// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';
import '@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ERC20FeeProxy.sol';
import './lib/SafeERC20.sol';

/**
 * @title ERC20RecurringPaymentProxy
 * @notice Triggers recurring ERC20 payments based on predefined schedules.
 */
contract ERC20RecurringPaymentProxy is EIP712, AccessControl, Pausable, ReentrancyGuard, Ownable {
  using SafeERC20 for IERC20;

  error ERC20RecurringPaymentProxy__BadSignature();
  error ERC20RecurringPaymentProxy__SignatureExpired();
  error ERC20RecurringPaymentProxy__PaymentOutOfOrder();
  error ERC20RecurringPaymentProxy__IndexOutOfBounds();
  error ERC20RecurringPaymentProxy__NotDueYet();
  error ERC20RecurringPaymentProxy__AlreadyPaid();
  error ERC20RecurringPaymentProxy__ZeroAddress();
  error ERC20RecurringPaymentProxy__TransferFailed();
  error ERC20RecurringPaymentProxy__ShortPull();
  error ERC20RecurringPaymentProxy__ZeroScheduleId();
  error ERC20RecurringPaymentProxy__InvalidDueTimes();
  error ERC20RecurringPaymentProxy__TooManyLegs();
  error ERC20RecurringPaymentProxy__EmptyLegs();
  error ERC20RecurringPaymentProxy__ZeroAmount();
  error ERC20RecurringPaymentProxy__NotSubscriber();
  error ERC20RecurringPaymentProxy__Cancelled();

  uint8 public constant MAX_LEGS = 8;

  bytes32 public constant RELAYER_ROLE = keccak256('RELAYER_ROLE');

  /* keccak256 of the typed-data struct with relayerFee field */
  bytes32 private constant _PERMIT_TYPEHASH =
    keccak256(
      'SchedulePermit(address subscriber,address token,address recipient,'
      'address feeAddress,uint128 amount,uint128 feeAmount,uint128 relayerFee,'
      'uint32 periodSeconds,uint32 firstPayment,uint8 totalPayments,'
      'uint256 nonce,uint256 deadline,bool strictOrder)'
    );

  bytes32 private constant _LEG_TYPEHASH =
    keccak256('Leg(address recipient,uint128 amount,bytes8 paymentReference)');

  /* Nested Leg is appended once, in EIP-712 referenced-type order. */
  bytes32 private constant _BATCH_TYPEHASH =
    keccak256(
      'SchedulePermitBatch(address subscriber,address token,uint128 relayerFee,'
      'uint8 totalPayments,uint256 nonce,uint256 deadline,bool strictOrder,'
      'bytes32 scheduleId,uint32[] dueTimes,Leg[] initialLegs,Leg[] recurringLegs)'
      'Leg(address recipient,uint128 amount,bytes8 paymentReference)'
    );

  /* replay defence */
  mapping(bytes32 => uint256) public triggeredPaymentsBitmap;
  mapping(bytes32 => uint8) public lastPaymentIndex;
  mapping(bytes32 => bool) public cancelledSchedules;

  IERC20FeeProxy public erc20FeeProxy;

  struct SchedulePermit {
    address subscriber;
    address token;
    address recipient;
    address feeAddress;
    uint128 amount;
    uint128 feeAmount;
    uint128 relayerFee;
    uint32 periodSeconds;
    uint32 firstPayment;
    uint8 totalPayments;
    uint256 nonce;
    uint256 deadline;
    bool strictOrder;
  }

  struct Leg {
    address recipient;
    uint128 amount;
    bytes8 paymentReference;
  }

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
    transferOwnership(adminSafe);
    erc20FeeProxy = IERC20FeeProxy(erc20FeeProxyAddress);
  }

  function _hashSchedule(SchedulePermit calldata p) private view returns (bytes32) {
    bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, p));

    return _hashTypedDataV4(structHash);
  }

  function hashSchedule(SchedulePermit calldata p) public view returns (bytes32) {
    return _hashSchedule(p);
  }

  function _hashUint32Array(uint32[] calldata values) private pure returns (bytes32) {
    bytes32[] memory words = new bytes32[](values.length);
    for (uint256 i = 0; i < values.length; ++i) {
      words[i] = bytes32(uint256(values[i]));
    }
    return keccak256(abi.encodePacked(words));
  }

  function _hashLeg(Leg calldata leg) private pure returns (bytes32) {
    return keccak256(abi.encode(_LEG_TYPEHASH, leg.recipient, leg.amount, leg.paymentReference));
  }

  function _hashLegs(Leg[] calldata legs) private pure returns (bytes32) {
    bytes32[] memory words = new bytes32[](legs.length);
    for (uint256 i = 0; i < legs.length; ++i) {
      words[i] = _hashLeg(legs[i]);
    }
    return keccak256(abi.encodePacked(words));
  }

  function _hashScheduleBatch(SchedulePermitBatch calldata p) private view returns (bytes32) {
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
        _hashUint32Array(p.dueTimes),
        _hashLegs(p.initialLegs),
        _hashLegs(p.recurringLegs)
      )
    );

    return _hashTypedDataV4(structHash);
  }

  function hashScheduleBatch(SchedulePermitBatch calldata p) public view returns (bytes32) {
    return _hashScheduleBatch(p);
  }

  function _assertSigner(
    address subscriber,
    bytes32 digest,
    bytes calldata signature
  ) private view {
    if (!SignatureChecker.isValidSignatureNow(subscriber, digest, signature)) {
      revert ERC20RecurringPaymentProxy__BadSignature();
    }
  }

  function _scheduleKeyFromPermit(SchedulePermit calldata p) private pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          p.subscriber,
          p.token,
          p.recipient,
          p.feeAddress,
          p.amount,
          p.feeAmount,
          p.relayerFee,
          p.periodSeconds,
          p.firstPayment,
          p.totalPayments,
          p.strictOrder
        )
      );
  }

  function scheduleKeyFromPermit(SchedulePermit calldata p) public pure returns (bytes32) {
    return _scheduleKeyFromPermit(p);
  }

  function _scheduleKeyFromBatch(SchedulePermitBatch calldata p) private pure returns (bytes32) {
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
          _hashUint32Array(p.dueTimes),
          _hashLegs(p.initialLegs),
          _hashLegs(p.recurringLegs)
        )
      );
  }

  function scheduleKeyFromBatch(SchedulePermitBatch calldata p) public pure returns (bytes32) {
    return _scheduleKeyFromBatch(p);
  }

  function _assertSubscriber(address subscriber) private view {
    if (msg.sender != subscriber) revert ERC20RecurringPaymentProxy__NotSubscriber();
  }

  function _assertNotCancelled(bytes32 scheduleKey) private view {
    if (cancelledSchedules[scheduleKey]) revert ERC20RecurringPaymentProxy__Cancelled();
  }

  function _cancel(bytes32 scheduleKey) private {
    cancelledSchedules[scheduleKey] = true;
  }

  function _assertUnpaid(bytes32 scheduleKey, uint8 index) private view {
    if (triggeredPaymentsBitmap[scheduleKey] & (1 << index) != 0) {
      revert ERC20RecurringPaymentProxy__AlreadyPaid();
    }
  }

  function _assertOrder(
    bytes32 scheduleKey,
    uint8 index,
    bool strictOrder
  ) private view {
    if (strictOrder && index != lastPaymentIndex[scheduleKey] + 1) {
      revert ERC20RecurringPaymentProxy__PaymentOutOfOrder();
    }
  }

  function _markPaid(
    bytes32 scheduleKey,
    uint8 index,
    bool strictOrder
  ) private {
    triggeredPaymentsBitmap[scheduleKey] |= (1 << index);
    if (strictOrder) {
      lastPaymentIndex[scheduleKey] = index;
    }
  }

  function _pullExact(
    IERC20 token,
    address from,
    uint256 amount
  ) private {
    uint256 balanceBefore = token.balanceOf(address(this));
    if (!token.safeTransferFrom(from, address(this), amount)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
    if (token.balanceOf(address(this)) - balanceBefore != amount) {
      revert ERC20RecurringPaymentProxy__ShortPull();
    }
  }

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

  function _payRelayer(IERC20 token, uint256 amount) private {
    if (amount == 0) {
      return;
    }
    if (!token.safeTransfer(msg.sender, amount)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
  }

  function _assertNonZeroRecipient(address account, uint256 amount) private pure {
    if (amount > 0 && account == address(0)) {
      revert ERC20RecurringPaymentProxy__ZeroAddress();
    }
  }

  function _assertLegArrays(SchedulePermitBatch calldata p) private pure {
    if (p.initialLegs.length > MAX_LEGS || p.recurringLegs.length > MAX_LEGS) {
      revert ERC20RecurringPaymentProxy__TooManyLegs();
    }
  }

  function _sumAndAssertLegs(Leg[] calldata legs) private pure returns (uint256 sum) {
    if (legs.length == 0) revert ERC20RecurringPaymentProxy__EmptyLegs();
    for (uint256 i = 0; i < legs.length; ++i) {
      if (legs[i].recipient == address(0)) {
        revert ERC20RecurringPaymentProxy__ZeroAddress();
      }
      if (legs[i].amount == 0) {
        revert ERC20RecurringPaymentProxy__ZeroAmount();
      }
      sum += legs[i].amount;
    }
  }

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

  function _proxyTransfer(SchedulePermit calldata p, bytes calldata paymentReference) private {
    erc20FeeProxy.transferFromWithReferenceAndFee(
      p.token,
      p.recipient,
      p.amount,
      paymentReference,
      p.feeAmount,
      p.feeAddress
    );
  }

  function triggerRecurringPayment(
    SchedulePermit calldata p,
    bytes calldata signature,
    uint8 index,
    bytes calldata paymentReference
  ) external whenNotPaused onlyRole(RELAYER_ROLE) nonReentrant {
    bytes32 digest = _hashSchedule(p);

    _assertSigner(p.subscriber, digest, signature);
    if (block.timestamp > p.deadline) revert ERC20RecurringPaymentProxy__SignatureExpired();

    if (index == 0) revert ERC20RecurringPaymentProxy__IndexOutOfBounds();
    if (index > p.totalPayments) revert ERC20RecurringPaymentProxy__IndexOutOfBounds();

    bytes32 scheduleKey = _scheduleKeyFromPermit(p);
    _assertNotCancelled(scheduleKey);
    _assertOrder(scheduleKey, index, p.strictOrder);
    _assertUnpaid(scheduleKey, index);

    uint256 execTime = uint256(p.firstPayment) + uint256(index - 1) * p.periodSeconds;
    if (block.timestamp < execTime) revert ERC20RecurringPaymentProxy__NotDueYet();

    _assertNonZeroRecipient(p.feeAddress, p.feeAmount);

    uint256 total = p.amount + p.feeAmount + p.relayerFee;

    IERC20 token = IERC20(p.token);
    _pullExact(token, p.subscriber, total);
    _approveFeeProxy(token, erc20FeeProxy, p.amount + p.feeAmount);
    _proxyTransfer(p, paymentReference);
    _payRelayer(token, p.relayerFee);
    _markPaid(scheduleKey, index, p.strictOrder);
  }

  function triggerRecurringPaymentBatch(
    SchedulePermitBatch calldata p,
    bytes calldata signature,
    uint8 index
  ) external whenNotPaused onlyRole(RELAYER_ROLE) nonReentrant {
    if (p.token == address(0) || p.subscriber == address(0)) {
      revert ERC20RecurringPaymentProxy__ZeroAddress();
    }

    bytes32 digest = _hashScheduleBatch(p);

    _assertSigner(p.subscriber, digest, signature);
    if (block.timestamp > p.deadline) revert ERC20RecurringPaymentProxy__SignatureExpired();

    if (index == 0) revert ERC20RecurringPaymentProxy__IndexOutOfBounds();
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

    _assertLegArrays(p);

    bytes32 scheduleKey = _scheduleKeyFromBatch(p);
    _assertNotCancelled(scheduleKey);
    _assertOrder(scheduleKey, index, p.strictOrder);
    _assertUnpaid(scheduleKey, index);

    bool useInitial = p.initialLegs.length != 0 && index == 1;
    uint256 legsSum = useInitial
      ? _sumAndAssertLegs(p.initialLegs)
      : _sumAndAssertLegs(p.recurringLegs);
    uint256 payerTotal = legsSum + p.relayerFee;

    _markPaid(scheduleKey, index, p.strictOrder);

    IERC20 token = IERC20(p.token);
    IERC20FeeProxy proxy = erc20FeeProxy;
    _pullExact(token, p.subscriber, payerTotal);
    _approveFeeProxy(token, proxy, legsSum);
    if (useInitial) {
      _settleLegs(proxy, p.token, p.initialLegs);
    } else {
      _settleLegs(proxy, p.token, p.recurringLegs);
    }
    _payRelayer(token, p.relayerFee);
  }

  /**
   * @notice Blocks further triggers for this single-fee schedule.
   * @dev Does not revoke the subscriber's ERC-20 allowance to this contract. A relayer can
   *      still collect a due cycle if they include a trigger in the same block ahead of
   *      cancel. Also `approve` this proxy to 0 (or decrease) in the same wallet batch.
   */
  function cancelSchedule(SchedulePermit calldata p) external {
    _assertSubscriber(p.subscriber);
    _cancel(_scheduleKeyFromPermit(p));
  }

  /**
   * @notice Blocks further triggers for this batch schedule.
   * @dev Does not revoke the subscriber's ERC-20 allowance to this contract. A relayer can
   *      still collect a due cycle if they include a trigger in the same block ahead of
   *      cancel. Also `approve` this proxy to 0 (or decrease) in the same wallet batch.
   */
  function cancelScheduleBatch(SchedulePermitBatch calldata p) external {
    _assertSubscriber(p.subscriber);
    _cancel(_scheduleKeyFromBatch(p));
  }

  function setRelayer(address oldRelayer, address newRelayer) external onlyOwner {
    if (newRelayer == address(0)) revert ERC20RecurringPaymentProxy__ZeroAddress();
    _revokeRole(RELAYER_ROLE, oldRelayer);
    _grantRole(RELAYER_ROLE, newRelayer);
  }

  function setFeeProxy(address newProxy) external onlyOwner {
    if (newProxy == address(0)) revert ERC20RecurringPaymentProxy__ZeroAddress();
    erc20FeeProxy = IERC20FeeProxy(newProxy);
  }

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }

  function rescueTokens(
    address token,
    address to,
    uint256 amount
  ) external onlyOwner nonReentrant {
    if (token == address(0) || to == address(0)) {
      revert ERC20RecurringPaymentProxy__ZeroAddress();
    }
    if (!IERC20(token).safeTransfer(to, amount)) {
      revert ERC20RecurringPaymentProxy__TransferFailed();
    }
  }
}
