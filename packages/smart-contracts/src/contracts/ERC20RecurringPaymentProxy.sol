// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';
import '@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol';
import './interfaces/ERC20FeeProxy.sol';
import './lib/SafeERC20.sol';

/**
 * @title ERC20RecurringPaymentProxy
 * @notice Collects ERC-20 payments on a signed multi-cycle schedule through an ERC20FeeProxy.
 * @dev The subscriber signs an EIP-712 `SchedulePermitBatch`. A `RELAYER_ROLE` holder — or the
 *      subscriber on a cycle the relayer has admitted — then calls
 *      {triggerRecurringPaymentBatch} for each due index.
 *
 *      Cancel is callable by the subscriber or a relayer and does not revoke ERC-20 allowance.
 *      {scheduleKeyFromBatch} hashes every signed term except `nonce` and `deadline`, so
 *      amending those other terms creates a new schedule; cancelling A does not cancel B.
 */
contract ERC20RecurringPaymentProxy is EIP712, AccessControl, Pausable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  /// @notice The EIP-712 digest does not recover to `subscriber`.
  error ERC20RecurringPaymentProxy__BadSignature();
  /// @notice `block.timestamp` is after the permit `deadline`.
  error ERC20RecurringPaymentProxy__SignatureExpired();
  /// @notice `strictOrder` is set and `index` is not `lastIndex + 1`.
  error ERC20RecurringPaymentProxy__PaymentOutOfOrder();
  /// @notice Cycle `index` is 0 or greater than `totalPayments`.
  error ERC20RecurringPaymentProxy__IndexOutOfBounds();
  /// @notice `block.timestamp` is before `dueTimes[index - 1]`.
  error ERC20RecurringPaymentProxy__NotDueYet();
  /// @notice This cycle index was already collected.
  error ERC20RecurringPaymentProxy__AlreadyPaid();
  /// @notice A required address argument is the zero address.
  error ERC20RecurringPaymentProxy__ZeroAddress();
  /// @notice An ERC-20 `transfer` / `transferFrom` / `approve` failed.
  error ERC20RecurringPaymentProxy__TransferFailed();
  /// @notice The token credited this contract less than the requested pull amount.
  error ERC20RecurringPaymentProxy__ShortPull();
  /// @notice Residual tokens remain on this contract after settling a cycle.
  error ERC20RecurringPaymentProxy__UnexpectedBalance();
  /// @notice `scheduleId` is `bytes32(0)`.
  error ERC20RecurringPaymentProxy__ZeroScheduleId();
  /// @notice `dueTimes` length does not match `totalPayments`, or times are not strictly increasing.
  error ERC20RecurringPaymentProxy__InvalidDueTimes();
  /// @notice A legs array is longer than {MAX_LEGS}.
  error ERC20RecurringPaymentProxy__TooManyLegs();
  /// @notice A required legs array is empty.
  error ERC20RecurringPaymentProxy__EmptyLegs();
  /// @notice Two legs in the same array share a `paymentReference`.
  error ERC20RecurringPaymentProxy__DuplicatePaymentReference();
  /// @notice A leg amount is zero.
  error ERC20RecurringPaymentProxy__ZeroAmount();
  /// @notice `msg.sender` is neither the subscriber nor (where allowed) a relayer.
  error ERC20RecurringPaymentProxy__NotSubscriber();
  /// @notice The schedule was cancelled; further triggers are blocked.
  error ERC20RecurringPaymentProxy__Cancelled();
  /// @notice The subscriber is self-triggering a cycle the relayer has not admitted.
  error ERC20RecurringPaymentProxy__NotAdmitted();
  /// @notice `revokeRelayer` was called for an address that does not hold {RELAYER_ROLE}.
  error ERC20RecurringPaymentProxy__NotRelayer();

  /// @notice Maximum length of `initialLegs` or `recurringLegs`.
  uint8 public constant MAX_LEGS = 8;

  /// @notice Role that may trigger any due cycle, admit/revoke self-triggers, and cancel.
  /// @dev Extra holders compete for `relayerFee` because {_payRelayer} pays `msg.sender`.
  bytes32 public constant RELAYER_ROLE = keccak256('RELAYER_ROLE');

  /// @dev EIP-712 typehash of {Leg}.
  bytes32 private constant _LEG_TYPEHASH =
    keccak256('Leg(address recipient,uint128 amount,bytes8 paymentReference)');

  /// @dev EIP-712 typehash of {SchedulePermitBatch}. Nested `Leg` is appended once, in
  ///      referenced-type order.
  bytes32 private constant _BATCH_TYPEHASH =
    keccak256(
      'SchedulePermitBatch(address subscriber,address token,uint128 relayerFee,'
      'uint8 totalPayments,uint256 nonce,uint256 deadline,bool strictOrder,'
      'bytes32 scheduleId,uint32[] dueTimes,Leg[] initialLegs,Leg[] recurringLegs)'
      'Leg(address recipient,uint128 amount,bytes8 paymentReference)'
    );

  /**
   * @notice On-chain state for one schedule key.
   * @param bitmap Bit `index` is set after that cycle is paid (index is 1-based; bit 0 unused).
   * @param admitted Relayer-set mask of cycles the subscriber may self-trigger.
   * @param lastIndex Last paid index when `strictOrder` is true; otherwise unused.
   * @param cancelled When true, further triggers revert with {ERC20RecurringPaymentProxy__Cancelled}.
   */
  struct ScheduleState {
    uint256 bitmap;
    uint256 admitted;
    uint8 lastIndex;
    bool cancelled;
  }

  /**
   * @notice Schedule state keyed by {scheduleKeyFromBatch}.
   * @dev The key includes every signed term except `nonce` and `deadline`. Changing any of
   *      those other terms yields a new key with a virgin bitmap and cancelled flag.
   */
  mapping(bytes32 => ScheduleState) public schedules;

  /**
   * @notice Emitted after a cycle is pulled from the subscriber and settled through the fee proxy.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @param subscriber Payer whose tokens were pulled.
   * @param token ERC-20 that was transferred.
   * @param index 1-based cycle that was collected.
   * @param payerTotal Sum of the settled legs plus `relayerFee`.
   */
  event PaymentTriggered(
    bytes32 indexed scheduleKey,
    address indexed subscriber,
    address token,
    uint8 index,
    uint256 payerTotal
  );

  /**
   * @notice Emitted when a schedule is cancelled. Further triggers for this key revert.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @param subscriber Subscriber recorded on the permit (not necessarily `msg.sender`).
   */
  event ScheduleCancelled(bytes32 indexed scheduleKey, address indexed subscriber);

  /**
   * @notice Emitted when a relayer admits cycles for subscriber self-trigger.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @param mask Bits OR-ed into `admitted`.
   */
  event CyclesAdmitted(bytes32 indexed scheduleKey, uint256 mask);

  /**
   * @notice Emitted when a relayer clears previously admitted self-trigger bits.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @param mask Bits cleared from `admitted`.
   */
  event CyclesRevoked(bytes32 indexed scheduleKey, uint256 mask);

  /**
   * @notice Emitted when the admin replaces the ERC20FeeProxy used to settle legs.
   * @param oldProxy Previous fee-proxy address.
   * @param newProxy New fee-proxy address.
   */
  event FeeProxyUpdated(address indexed oldProxy, address indexed newProxy);

  /// @notice ERC20FeeProxy used to settle each cycle's legs.
  IERC20FeeProxy public erc20FeeProxy;

  /**
   * @notice One payout inside a cycle.
   * @param recipient Token recipient. Must be non-zero.
   * @param amount Token amount for this recipient. Must be non-zero.
   * @param paymentReference 8-byte Request payment reference; unique within a legs array.
   */
  struct Leg {
    address recipient;
    uint128 amount;
    bytes8 paymentReference;
  }

  /**
   * @notice EIP-712 permit describing a batch of recurring cycles.
   * @param subscriber Payer whose signature and ERC-20 allowance are consumed.
   * @param token ERC-20 pulled from the subscriber.
   * @param relayerFee Extra tokens paid to `msg.sender` on each successful trigger.
   * @param totalPayments Number of cycles; must equal `dueTimes.length`.
   * @param nonce Included in the signed digest only; not part of the schedule key.
   * @param deadline Unix time after which the signature is rejected.
   * @param strictOrder When true, cycles must be paid in increasing index order.
   * @param scheduleId Non-zero id that distinguishes otherwise identical permits.
   * @param dueTimes Unix times, strictly increasing, one per cycle (1-based index).
   * @param initialLegs Optional first-cycle payouts. Empty uses `recurringLegs` for cycle 1.
   * @param recurringLegs Payouts for later cycles, and for cycle 1 if `initialLegs` is empty.
   */
  struct SchedulePermitBatch {
    address subscriber;
    address token;
    uint128 relayerFee;
    uint8 totalPayments;
    uint256 nonce;
    uint256 deadline;
    bool strictOrder;
    bytes32 scheduleId;
    uint32[] dueTimes;
    Leg[] initialLegs;
    Leg[] recurringLegs;
  }

  /**
   * @notice Deploys the proxy and grants the initial admin and relayer.
   * @param adminSafe Address granted `DEFAULT_ADMIN_ROLE`.
   * @param relayerEOA Address granted {RELAYER_ROLE}.
   * @param erc20FeeProxyAddress ERC20FeeProxy used to settle legs.
   */
  constructor(
    address adminSafe,
    address relayerEOA,
    address erc20FeeProxyAddress
  ) EIP712('ERC20RecurringPaymentProxy', '1') {
    if (adminSafe == address(0) || relayerEOA == address(0) || erc20FeeProxyAddress == address(0)) {
      revert ERC20RecurringPaymentProxy__ZeroAddress();
    }
    _grantRole(DEFAULT_ADMIN_ROLE, adminSafe);
    _grantRole(RELAYER_ROLE, relayerEOA);
    erc20FeeProxy = IERC20FeeProxy(erc20FeeProxyAddress);
  }

  /// @dev EIP-712 array hash of `uint32` values (`keccak256` of packed `bytes32` words).
  function _hashUint32Array(uint32[] calldata values) private pure returns (bytes32) {
    bytes32[] memory words = new bytes32[](values.length);
    for (uint256 i = 0; i < values.length; ++i) {
      words[i] = bytes32(uint256(values[i]));
    }
    return keccak256(abi.encodePacked(words));
  }

  /// @dev EIP-712 struct hash of a single {Leg}.
  function _hashLeg(Leg calldata leg) private pure returns (bytes32) {
    return keccak256(abi.encode(_LEG_TYPEHASH, leg.recipient, leg.amount, leg.paymentReference));
  }

  /// @dev EIP-712 array hash of {Leg} values.
  function _hashLegs(Leg[] calldata legs) private pure returns (bytes32) {
    bytes32[] memory words = new bytes32[](legs.length);
    for (uint256 i = 0; i < legs.length; ++i) {
      words[i] = _hashLeg(legs[i]);
    }
    return keccak256(abi.encodePacked(words));
  }

  /**
   * @dev Hashes the dynamic permit fields once so callers can reuse them for the digest and key.
   * @return dueTimesHash EIP-712 hash of `p.dueTimes`.
   * @return initialLegsHash EIP-712 hash of `p.initialLegs`.
   * @return recurringLegsHash EIP-712 hash of `p.recurringLegs`.
   */
  function _hashPermitParts(SchedulePermitBatch calldata p)
    private
    pure
    returns (
      bytes32 dueTimesHash,
      bytes32 initialLegsHash,
      bytes32 recurringLegsHash
    )
  {
    dueTimesHash = _hashUint32Array(p.dueTimes);
    initialLegsHash = _hashLegs(p.initialLegs);
    recurringLegsHash = _hashLegs(p.recurringLegs);
  }

  /**
   * @dev EIP-712 digest of `p` given precomputed dynamic-field hashes.
   * @param p Signed permit.
   * @param dueTimesHash Hash from {_hashPermitParts}.
   * @param initialLegsHash Hash from {_hashPermitParts}.
   * @param recurringLegsHash Hash from {_hashPermitParts}.
   * @return EIP-712 typed-data hash (`_hashTypedDataV4`).
   */
  function _hashScheduleBatch(
    SchedulePermitBatch calldata p,
    bytes32 dueTimesHash,
    bytes32 initialLegsHash,
    bytes32 recurringLegsHash
  ) private view returns (bytes32) {
    bytes32 structHash = keccak256(
      abi.encode(
        _BATCH_TYPEHASH,
        p.subscriber,
        p.token,
        p.relayerFee,
        p.totalPayments,
        p.nonce,
        p.deadline,
        p.strictOrder,
        p.scheduleId,
        dueTimesHash,
        initialLegsHash,
        recurringLegsHash
      )
    );

    return _hashTypedDataV4(structHash);
  }

  /**
   * @notice EIP-712 digest the subscriber must sign for `p`.
   * @param p Permit to hash. Dynamic fields are hashed per the EIP-712 spec.
   * @return digest Typed-data hash for `eth_signTypedData_v4`.
   */
  function hashScheduleBatch(SchedulePermitBatch calldata p) public view returns (bytes32) {
    (bytes32 dueTimesHash, bytes32 initialLegsHash, bytes32 recurringLegsHash) = _hashPermitParts(
      p
    );
    return _hashScheduleBatch(p, dueTimesHash, initialLegsHash, recurringLegsHash);
  }

  /**
   * @dev Reverts unless `signature` is a valid ERC-1271 or ECDSA signature of `digest` by
   *      `subscriber`.
   */
  function _assertSigner(
    address subscriber,
    bytes32 digest,
    bytes calldata signature
  ) private view {
    if (!SignatureChecker.isValidSignatureNow(subscriber, digest, signature)) {
      revert ERC20RecurringPaymentProxy__BadSignature();
    }
  }

  /**
   * @dev Schedule key from precomputed dynamic-field hashes. `nonce` and `deadline` are omitted
   *      so a refreshed signature does not reset payment state.
   */
  function _scheduleKeyFromBatch(
    SchedulePermitBatch calldata p,
    bytes32 dueTimesHash,
    bytes32 initialLegsHash,
    bytes32 recurringLegsHash
  ) private pure returns (bytes32) {
    if (p.scheduleId == bytes32(0)) revert ERC20RecurringPaymentProxy__ZeroScheduleId();
    return
      keccak256(
        abi.encode(
          p.subscriber,
          p.scheduleId,
          p.token,
          p.relayerFee,
          p.totalPayments,
          p.strictOrder,
          dueTimesHash,
          initialLegsHash,
          recurringLegsHash
        )
      );
  }

  /**
   * @notice Deterministic id of the on-chain schedule described by `p`.
   * @param p Permit whose terms (except `nonce` and `deadline`) identify the schedule.
   * @return scheduleKey Storage key in {schedules}.
   */
  function scheduleKeyFromBatch(SchedulePermitBatch calldata p) public pure returns (bytes32) {
    (bytes32 dueTimesHash, bytes32 initialLegsHash, bytes32 recurringLegsHash) = _hashPermitParts(
      p
    );
    return _scheduleKeyFromBatch(p, dueTimesHash, initialLegsHash, recurringLegsHash);
  }

  /**
   * @dev Computes both the schedule key and the EIP-712 digest from one permit-parts hash.
   * @return scheduleKey Storage key in {schedules}.
   * @return digest Typed-data hash the subscriber must have signed.
   */
  function _keyAndDigest(SchedulePermitBatch calldata p)
    private
    view
    returns (bytes32 scheduleKey, bytes32 digest)
  {
    (bytes32 dueTimesHash, bytes32 initialLegsHash, bytes32 recurringLegsHash) = _hashPermitParts(
      p
    );
    scheduleKey = _scheduleKeyFromBatch(p, dueTimesHash, initialLegsHash, recurringLegsHash);
    digest = _hashScheduleBatch(p, dueTimesHash, initialLegsHash, recurringLegsHash);
  }

  /**
   * @notice Bitmask of cycles already collected for `scheduleKey`.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @return bitmap Bit `index` is set after that cycle is paid.
   */
  function triggeredPaymentsBitmap(bytes32 scheduleKey) external view returns (uint256) {
    return schedules[scheduleKey].bitmap;
  }

  /**
   * @notice Last collected index when the permit used `strictOrder`; otherwise 0.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @return lastIndex Value stored in {ScheduleState.lastIndex}.
   */
  function lastPaymentIndex(bytes32 scheduleKey) external view returns (uint8) {
    return schedules[scheduleKey].lastIndex;
  }

  /**
   * @notice Whether further triggers for `scheduleKey` are blocked.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @return cancelled True after a successful {cancelScheduleBatch}.
   */
  function cancelledSchedules(bytes32 scheduleKey) external view returns (bool) {
    return schedules[scheduleKey].cancelled;
  }

  /**
   * @notice Bitmask of cycles the subscriber may self-trigger.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @return admitted Bits set by {admitCycles} and cleared by {revokeCycles}.
   */
  function admittedCycles(bytes32 scheduleKey) external view returns (uint256) {
    return schedules[scheduleKey].admitted;
  }

  /// @dev Reverts unless `msg.sender` is `subscriber`.
  function _assertSubscriber(address subscriber) private view {
    if (msg.sender != subscriber) revert ERC20RecurringPaymentProxy__NotSubscriber();
  }

  /// @dev Reverts unless `msg.sender` holds {RELAYER_ROLE} or is `subscriber`.
  function _assertSubscriberOrRelayer(address subscriber) private view {
    if (hasRole(RELAYER_ROLE, msg.sender)) {
      return;
    }
    _assertSubscriber(subscriber);
  }

  /// @dev Reverts if this schedule has been cancelled.
  function _assertNotCancelled(ScheduleState storage state) private view {
    if (state.cancelled) revert ERC20RecurringPaymentProxy__Cancelled();
  }

  /// @dev Marks the schedule cancelled. Does not touch ERC-20 allowance.
  function _cancel(ScheduleState storage state) private {
    state.cancelled = true;
  }

  /**
   * @dev Relayers may trigger any cycle. The subscriber may trigger only an admitted index.
   */
  function _assertRelayerOrAdmitted(
    address subscriber,
    ScheduleState storage state,
    uint8 index
  ) private view {
    if (hasRole(RELAYER_ROLE, msg.sender)) {
      return;
    }
    if (msg.sender != subscriber) revert ERC20RecurringPaymentProxy__NotSubscriber();
    if (state.admitted & (1 << index) == 0) {
      revert ERC20RecurringPaymentProxy__NotAdmitted();
    }
  }

  /**
   * @notice Allows the subscriber to self-trigger the cycles whose bits are set in `mask`.
   * @dev Relayer-initiated triggers do not consult `admitted`. Bits are OR-ed; already-set
   *      bits stay set.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @param mask Bits to set in {ScheduleState.admitted}.
   */
  function admitCycles(bytes32 scheduleKey, uint256 mask) external onlyRole(RELAYER_ROLE) {
    schedules[scheduleKey].admitted |= mask;
    emit CyclesAdmitted(scheduleKey, mask);
  }

  /**
   * @notice Clears bits so a previously admitted cycle can no longer be self-triggered.
   * @dev Relayer-initiated triggers are unaffected.
   * @param scheduleKey Key returned by {scheduleKeyFromBatch}.
   * @param mask Bits to clear from {ScheduleState.admitted}.
   */
  function revokeCycles(bytes32 scheduleKey, uint256 mask) external onlyRole(RELAYER_ROLE) {
    schedules[scheduleKey].admitted &= ~mask;
    emit CyclesRevoked(scheduleKey, mask);
  }

  /// @dev Reverts if bit `index` is already set on `state.bitmap`.
  function _assertUnpaid(ScheduleState storage state, uint8 index) private view {
    if (state.bitmap & (1 << index) != 0) {
      revert ERC20RecurringPaymentProxy__AlreadyPaid();
    }
  }

  /// @dev When `strictOrder` is true, requires `index == lastIndex + 1`.
  function _assertOrder(
    ScheduleState storage state,
    uint8 index,
    bool strictOrder
  ) private view {
    if (strictOrder && uint256(index) != uint256(state.lastIndex) + 1) {
      revert ERC20RecurringPaymentProxy__PaymentOutOfOrder();
    }
  }

  /// @dev Sets bit `index`. Updates `lastIndex` only when `strictOrder` is true.
  function _markPaid(
    ScheduleState storage state,
    uint8 index,
    bool strictOrder
  ) private {
    state.bitmap |= (1 << index);
    if (strictOrder) {
      state.lastIndex = index;
    }
  }

  /**
   * @dev Pulls `amount` from `from` and requires this contract's balance to increase by exactly
   *      `amount` (rejects fee-on-transfer tokens).
   * @return balanceBefore Token balance of this contract before the pull.
   */
  function _pullExact(
    IERC20 token,
    address from,
    uint256 amount
  ) private returns (uint256 balanceBefore) {
    balanceBefore = token.balanceOf(address(this));
    if (!token.safeTransferFrom(from, address(this), amount)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
    if (token.balanceOf(address(this)) - balanceBefore != amount) {
      revert ERC20RecurringPaymentProxy__ShortPull();
    }
  }

  /// @dev Zeroes then sets the fee-proxy allowance to `amount` (USDT-safe approve).
  function _approveFeeProxy(
    IERC20 token,
    IERC20FeeProxy proxy,
    uint256 amount
  ) private {
    if (!token.safeApprove(address(proxy), 0)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
    if (!token.safeApprove(address(proxy), amount)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
  }

  /// @dev Pays `amount` of `token` to `msg.sender`. No-op when `amount` is 0.
  function _payRelayer(IERC20 token, uint256 amount) private {
    if (amount == 0) {
      return;
    }
    if (!token.safeTransfer(msg.sender, amount)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
  }

  /**
   * @dev Requires a non-empty legs array with unique, non-zero recipients, amounts, and
   *      payment references.
   */
  function _assertLegs(Leg[] calldata legs) private pure {
    if (legs.length == 0) revert ERC20RecurringPaymentProxy__EmptyLegs();
    for (uint256 i = 0; i < legs.length; ++i) {
      if (legs[i].recipient == address(0)) {
        revert ERC20RecurringPaymentProxy__ZeroAddress();
      }
      if (legs[i].amount == 0) {
        revert ERC20RecurringPaymentProxy__ZeroAmount();
      }
      for (uint256 j = 0; j < i; ++j) {
        if (legs[i].paymentReference == legs[j].paymentReference) {
          revert ERC20RecurringPaymentProxy__DuplicatePaymentReference();
        }
      }
    }
  }

  /**
   * @dev Validates both legs arrays. `recurringLegs` may be empty only for a single-cycle
   *      permit that already has `initialLegs`.
   */
  function _assertScheduleLegs(SchedulePermitBatch calldata p) private pure {
    if (p.initialLegs.length > MAX_LEGS || p.recurringLegs.length > MAX_LEGS) {
      revert ERC20RecurringPaymentProxy__TooManyLegs();
    }
    if (p.initialLegs.length != 0) {
      _assertLegs(p.initialLegs);
    }
    if (p.recurringLegs.length != 0 || p.totalPayments > 1 || p.initialLegs.length == 0) {
      _assertLegs(p.recurringLegs);
    }
  }

  /// @dev Sum of `amount` across `legs`. Does not include `relayerFee`.
  function _sumLegs(Leg[] calldata legs) private pure returns (uint256 sum) {
    for (uint256 i = 0; i < legs.length; ++i) {
      sum += legs[i].amount;
    }
  }

  /// @dev Forwards each leg through the fee proxy with zero proxy fee.
  function _settleLegs(
    IERC20FeeProxy proxy,
    address token,
    Leg[] calldata legs
  ) private {
    for (uint256 i = 0; i < legs.length; ++i) {
      proxy.transferFromWithReferenceAndFee(
        token,
        legs[i].recipient,
        legs[i].amount,
        abi.encodePacked(legs[i].paymentReference),
        0,
        address(0)
      );
    }
  }

  /**
   * @notice Collects one due cycle: pulls tokens from the subscriber, settles legs, pays the
   *         relayer fee to `msg.sender`.
   * @dev Caller must hold {RELAYER_ROLE}, or be `p.subscriber` with bit `index` admitted.
   *      Cycle 1 uses `initialLegs` when that array is non-empty; otherwise `recurringLegs`.
   *      Marks the cycle paid before transfers so a reentrant token cannot double-collect.
   * @param p Signed permit. Must match the signature and current fee-proxy settlement path.
   * @param signature Subscriber EIP-712 or ERC-1271 signature of {hashScheduleBatch} `(p)`.
   * @param index 1-based cycle to collect. Must be due, unpaid, and in order when required.
   */
  function triggerRecurringPaymentBatch(
    SchedulePermitBatch calldata p,
    bytes calldata signature,
    uint8 index
  ) external whenNotPaused nonReentrant {
    if (p.token == address(0) || p.subscriber == address(0)) {
      revert ERC20RecurringPaymentProxy__ZeroAddress();
    }
    if (index == 0) revert ERC20RecurringPaymentProxy__IndexOutOfBounds();

    (bytes32 scheduleKey, bytes32 digest) = _keyAndDigest(p);
    ScheduleState storage state = schedules[scheduleKey];
    _assertRelayerOrAdmitted(p.subscriber, state, index);

    _assertSigner(p.subscriber, digest, signature);
    if (block.timestamp > p.deadline) revert ERC20RecurringPaymentProxy__SignatureExpired();

    if (p.totalPayments == 0 || index > p.totalPayments) {
      revert ERC20RecurringPaymentProxy__IndexOutOfBounds();
    }
    if (p.dueTimes.length != p.totalPayments) {
      revert ERC20RecurringPaymentProxy__InvalidDueTimes();
    }
    for (uint256 i = 1; i < p.dueTimes.length; ++i) {
      if (p.dueTimes[i] <= p.dueTimes[i - 1]) {
        revert ERC20RecurringPaymentProxy__InvalidDueTimes();
      }
    }
    if (block.timestamp < p.dueTimes[index - 1]) {
      revert ERC20RecurringPaymentProxy__NotDueYet();
    }

    _assertScheduleLegs(p);

    _assertNotCancelled(state);
    _assertOrder(state, index, p.strictOrder);
    _assertUnpaid(state, index);

    bool useInitial = p.initialLegs.length != 0 && index == 1;
    uint256 legsSum = _sumLegs(useInitial ? p.initialLegs : p.recurringLegs);
    uint256 payerTotal = legsSum + p.relayerFee;

    _markPaid(state, index, p.strictOrder);

    IERC20 token = IERC20(p.token);
    IERC20FeeProxy proxy = erc20FeeProxy;
    uint256 baseline = _pullExact(token, p.subscriber, payerTotal);
    _approveFeeProxy(token, proxy, legsSum);
    if (useInitial) {
      _settleLegs(proxy, p.token, p.initialLegs);
    } else {
      _settleLegs(proxy, p.token, p.recurringLegs);
    }
    _payRelayer(token, p.relayerFee);
    if (token.balanceOf(address(this)) != baseline) {
      revert ERC20RecurringPaymentProxy__UnexpectedBalance();
    }
    emit PaymentTriggered(scheduleKey, p.subscriber, p.token, index, payerTotal);
  }

  /**
   * @notice Blocks further triggers for this batch schedule.
   * @dev Callable by the subscriber or a {RELAYER_ROLE} holder. Does not revoke the
   *      subscriber's ERC-20 allowance to this contract. A relayer can still collect a due
   *      cycle if they include a trigger in the same block ahead of cancel. Also `approve`
   *      this proxy to 0 (or decrease) in the same wallet batch if allowance must drop.
   * @param p Permit that identifies the schedule via {scheduleKeyFromBatch}.
   */
  function cancelScheduleBatch(SchedulePermitBatch calldata p) external {
    _assertSubscriberOrRelayer(p.subscriber);
    bytes32 scheduleKey = scheduleKeyFromBatch(p);
    _cancel(schedules[scheduleKey]);
    emit ScheduleCancelled(scheduleKey, p.subscriber);
  }

  /**
   * @notice Grants {RELAYER_ROLE}. Every holder can collect `relayerFee` on trigger.
   * @param relayer Address to grant. Must be non-zero.
   */
  function grantRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (relayer == address(0)) revert ERC20RecurringPaymentProxy__ZeroAddress();
    _grantRole(RELAYER_ROLE, relayer);
  }

  /**
   * @notice Revokes {RELAYER_ROLE}. Reverts if `relayer` does not hold the role.
   * @param relayer Address to revoke.
   */
  function revokeRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (!hasRole(RELAYER_ROLE, relayer)) {
      revert ERC20RecurringPaymentProxy__NotRelayer();
    }
    _revokeRole(RELAYER_ROLE, relayer);
  }

  /**
   * @notice Replaces the ERC20FeeProxy used to settle legs.
   * @param newProxy New fee-proxy address. Must be non-zero.
   */
  function setFeeProxy(address newProxy) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newProxy == address(0)) revert ERC20RecurringPaymentProxy__ZeroAddress();
    address oldProxy = address(erc20FeeProxy);
    erc20FeeProxy = IERC20FeeProxy(newProxy);
    emit FeeProxyUpdated(oldProxy, newProxy);
  }

  /// @notice Pauses {triggerRecurringPaymentBatch}. Admin only.
  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  /// @notice Unpauses {triggerRecurringPaymentBatch}. Admin only.
  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  /**
   * @notice Recovers tokens accidentally held by this contract.
   * @dev Not used in the happy-path settlement; a successful trigger ends with a zero delta.
   * @param token ERC-20 to transfer. Must be non-zero.
   * @param to Recipient. Must be non-zero.
   * @param amount Amount to transfer.
   */
  function rescueTokens(
    address token,
    address to,
    uint256 amount
  ) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
    if (token == address(0) || to == address(0)) {
      revert ERC20RecurringPaymentProxy__ZeroAddress();
    }
    if (!IERC20(token).safeTransfer(to, amount)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
  }
}
