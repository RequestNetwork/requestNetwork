// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {IERC20} from '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import {SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {ReentrancyGuard} from '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import {IERC20FeeProxy} from './interfaces/ERC20FeeProxy.sol';
import {IAuthCaptureEscrow} from './interfaces/IAuthCaptureEscrow.sol';

/// @title ERC20CommerceEscrowWrapper
/// @notice Wrapper around Commerce Payments escrow that acts as depositor, operator, and recipient
/// @dev This contract maintains payment reference linking and provides secure operator delegation
///
/// @dev Fee Architecture Summary:
///      - Fees are REQUEST NETWORK PLATFORM FEES, NOT Commerce Escrow protocol fees
///      - MERCHANT PAYS fee (subtracted from capture amount: merchantReceives = captureAmount - fee)
///      - Single fee recipient per operation (can be a fee-splitting contract for multi-party distribution)
///      - All fees distributed via ERC20FeeProxy for Request Network compatibility and event tracking
///      - Commerce Escrow fee mechanism is intentionally bypassed (feeBps=0, feeReceiver=address(0))
///      - Fee calculation: feeAmount = (captureAmount * feeBps) / 10000 (basis points, max 10000 = 100%)
///      - Integer division truncates (slightly favors merchant in rounding)
///      - Fee-free operations: void, reclaim, refund (remedial actions, no value capture)
///
/// @dev For comprehensive fee mechanism documentation including:
///      - Fee payer model alternatives (payer-pays vs merchant-pays)
///      - Multi-recipient fee split strategies
///      - Future extensibility paths
///      - Security considerations
///      - Integration guidelines
///      See: docs/design-decisions/FEE_MECHANISM_DESIGN.md
///
/// @author Request Network & Coinbase Commerce Payments Integration
contract ERC20CommerceEscrowWrapper is ReentrancyGuard {
  using SafeERC20 for IERC20;

  /// @notice Commerce Payments escrow contract
  IAuthCaptureEscrow public immutable commerceEscrow;

  /// @notice Request Network's ERC20FeeProxy contract
  IERC20FeeProxy public immutable erc20FeeProxy;

  /// @notice Maps Request Network payment references to internal payment data
  mapping(bytes8 => PaymentData) public payments;

  /// @notice Internal payment data structure
  /// @dev Struct packing optimizes storage to 6 slots for gas efficiency
  /// Slot 0: payer (20 bytes)
  /// Slot 1: merchant (20 bytes) + amount (12 bytes)
  /// Slot 2: operator (20 bytes) + maxAmount (12 bytes)
  /// Slot 3: token (20 bytes) + preApprovalExpiry (6 bytes) + authorizationExpiry (6 bytes)
  /// Slot 4: refundExpiry (6 bytes)
  /// Slot 5: commercePaymentHash (32 bytes)
  /// @dev uint96 supports up to ~79B tokens (18 decimals) - sufficient for all practical use cases
  /// @dev uint48 timestamps valid until year 8,921,556 - no practical limitation
  /// @dev Payment existence is determined by commercePaymentHash != bytes32(0)
  /// This approach delegates to the Commerce Escrow's state tracking without external calls,
  /// maintaining gas efficiency while avoiding state synchronization issues.
  struct PaymentData {
    address payer; // Slot 0 (20 bytes)
    address merchant; // Slot 1 (20 bytes)
    uint96 amount; // Slot 1 (12 bytes) ← PACKED
    address operator; // Slot 2 (20 bytes) - The real operator who can capture/void this payment
    uint96 maxAmount; // Slot 2 (12 bytes) ← PACKED
    address token; // Slot 3 (20 bytes)
    uint48 preApprovalExpiry; // Slot 3 (6 bytes) ← PACKED
    uint48 authorizationExpiry; // Slot 3 (6 bytes) ← PACKED - When authorization expires and can be reclaimed
    uint48 refundExpiry; // Slot 4 (6 bytes) - When refunds are no longer allowed
    bytes32 commercePaymentHash; // Slot 5 (32 bytes)
  }

  /// @notice Emitted when a payment is authorized (frontend-friendly)
  event PaymentAuthorized(
    bytes8 indexed paymentReference,
    address payer,
    address merchant,
    address token,
    uint256 amount,
    bytes32 commercePaymentHash
  );

  /// @notice Emitted when a commerce payment is authorized (for compatibility)
  event CommercePaymentAuthorized(
    bytes8 indexed paymentReference,
    address payer,
    address merchant,
    uint256 amount
  );

  /// @notice Emitted when a payment is captured
  event PaymentCaptured(
    bytes8 indexed paymentReference,
    bytes32 commercePaymentHash,
    uint256 capturedAmount,
    address merchant
  );

  /// @notice Emitted when a payment is voided
  event PaymentVoided(
    bytes8 indexed paymentReference,
    bytes32 commercePaymentHash,
    uint256 voidedAmount,
    address payer
  );

  /// @notice Emitted when a payment is charged (immediate auth + capture)
  event PaymentCharged(
    bytes8 indexed paymentReference,
    address payer,
    address merchant,
    address token,
    uint256 amount,
    bytes32 commercePaymentHash
  );

  /// @notice Emitted when a payment is reclaimed by the payer
  event PaymentReclaimed(
    bytes8 indexed paymentReference,
    bytes32 commercePaymentHash,
    uint256 reclaimedAmount,
    address payer
  );

  /// @notice Emitted for Request Network compatibility (mimics ERC20FeeProxy event)
  event TransferWithReferenceAndFee(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes8 indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  /// @notice Emitted when a payment is refunded
  event PaymentRefunded(
    bytes8 indexed paymentReference,
    bytes32 commercePaymentHash,
    uint256 refundedAmount,
    address payer
  );

  /// @notice Struct to group charge parameters to avoid stack too deep
  struct ChargeParams {
    bytes8 paymentReference;
    address payer;
    address merchant;
    address operator;
    address token;
    uint256 amount;
    uint256 maxAmount;
    uint256 preApprovalExpiry;
    uint256 authorizationExpiry;
    uint256 refundExpiry;
    /// @dev Request Network platform fee in basis points (0-10000, where 10000 = 100%).
    ///      CRITICAL: MERCHANT PAYS this fee (subtracted from payment amount).
    ///      Formula: feeAmount = (amount * feeBps) / 10000
    ///      Example: 250 bps on 1000 USDC = 25 USDC fee, merchant receives 975 USDC
    ///      Validation: Reverts with InvalidFeeBps() if feeBps > 10000
    ///      See: FEE_MECHANISM_DESIGN.md for payer-pays alternatives
    uint16 feeBps;
    /// @dev Request Network platform fee recipient address (single recipient per operation).
    ///      This is NOT a Commerce Escrow protocol fee - it's a Request Network service fee.
    ///      For multi-party fee splits (e.g., RN API + Platform), use a fee-splitting contract.
    ///      Commerce Escrow fees are intentionally bypassed in this wrapper.
    ///      Can be address(0) to effectively burn the fee (not recommended).
    ///      See: FEE_MECHANISM_DESIGN.md for fee splitter contract examples
    address feeReceiver;
    address tokenCollector;
    bytes collectorData;
  }

  /// @notice Struct to group authorization parameters to avoid stack too deep
  struct AuthParams {
    bytes8 paymentReference;
    address payer;
    address merchant;
    address operator;
    address token;
    uint256 amount;
    uint256 maxAmount;
    uint256 preApprovalExpiry;
    uint256 authorizationExpiry;
    uint256 refundExpiry;
    address tokenCollector;
    bytes collectorData;
  }

  /// @notice Invalid payment reference
  error InvalidPaymentReference();

  /// @notice Payment not found
  error PaymentNotFound();

  /// @notice Payment already exists
  error PaymentAlreadyExists();

  /// @notice Invalid operator for this payment
  error InvalidOperator(address sender, address expectedOperator);

  /// @notice Invalid payer for this payment
  error InvalidPayer(address sender, address expectedPayer);

  /// @notice Zero address not allowed
  error ZeroAddress();

  /// @notice Scalar overflow when casting to smaller uint types
  error ScalarOverflow();

  /// @notice Invalid fee basis points (must be <= 10000)
  error InvalidFeeBps();

  /// @notice Check call sender is the operator for this payment
  /// @param paymentReference Request Network payment reference
  modifier onlyOperator(bytes8 paymentReference) {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) revert PaymentNotFound();

    // Check if the caller is the designated operator for this payment
    if (msg.sender != payment.operator) {
      revert InvalidOperator(msg.sender, payment.operator);
    }
    _;
  }

  /// @notice Check call sender is the payer for this payment
  /// @param paymentReference Request Network payment reference
  modifier onlyPayer(bytes8 paymentReference) {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) revert PaymentNotFound();

    // Check if the caller is the payer for this payment
    if (msg.sender != payment.payer) {
      revert InvalidPayer(msg.sender, payment.payer);
    }
    _;
  }

  /// @notice Constructor
  /// @param commerceEscrow_ Commerce Payments escrow contract
  /// @param erc20FeeProxy_ Request Network's ERC20FeeProxy contract
  constructor(address commerceEscrow_, address erc20FeeProxy_) {
    if (commerceEscrow_ == address(0)) revert ZeroAddress();
    if (erc20FeeProxy_ == address(0)) revert ZeroAddress();

    commerceEscrow = IAuthCaptureEscrow(commerceEscrow_);
    erc20FeeProxy = IERC20FeeProxy(erc20FeeProxy_);
  }

  /// @notice Authorize a payment into escrow
  /// @param params AuthParams struct containing all authorization parameters
  function authorizePayment(AuthParams calldata params) public nonReentrant {
    if (params.paymentReference == bytes8(0)) revert InvalidPaymentReference();
    if (payments[params.paymentReference].commercePaymentHash != bytes32(0))
      revert PaymentAlreadyExists();

    // Validate critical addresses
    if (params.payer == address(0)) revert ZeroAddress();
    if (params.merchant == address(0)) revert ZeroAddress();
    if (params.operator == address(0)) revert ZeroAddress();
    if (params.token == address(0)) revert ZeroAddress();
    // Note: tokenCollector is validated by the underlying escrow contract

    // Create and execute authorization
    _executeAuthorization(params);
  }

  /// @notice Internal function to execute authorization
  function _executeAuthorization(AuthParams memory params) internal {
    // Create PaymentInfo
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfo(
      params.payer,
      params.token,
      params.amount,
      params.maxAmount,
      params.preApprovalExpiry,
      params.authorizationExpiry,
      params.refundExpiry,
      params.paymentReference
    );

    // Store payment data
    bytes32 commerceHash = commerceEscrow.getHash(paymentInfo);
    _storePaymentData(
      params.paymentReference,
      params.payer,
      params.merchant,
      params.operator,
      params.token,
      params.amount,
      params.maxAmount,
      params.preApprovalExpiry,
      params.authorizationExpiry,
      params.refundExpiry,
      commerceHash
    );

    // Emit events before external call to prevent reentrancy concerns
    emit PaymentAuthorized(
      params.paymentReference,
      params.payer,
      params.merchant,
      params.token,
      params.amount,
      commerceHash
    );
    emit CommercePaymentAuthorized(
      params.paymentReference,
      params.payer,
      params.merchant,
      params.amount
    );

    // Execute authorization (external call)
    commerceEscrow.authorize(
      paymentInfo,
      params.amount,
      params.tokenCollector,
      params.collectorData
    );
  }

  /// @notice Create PaymentInfo struct
  function _createPaymentInfo(
    address payer,
    address token,
    uint256 amount,
    uint256 maxAmount,
    uint256 preApprovalExpiry,
    uint256 authorizationExpiry,
    uint256 refundExpiry,
    bytes8 paymentReference
  ) internal view returns (IAuthCaptureEscrow.PaymentInfo memory) {
    // Validate against uint96 (storage type) which is stricter than uint120 (escrow type)
    // uint96 supports up to ~79B tokens (18 decimals) - sufficient for all practical use cases
    if (amount > type(uint96).max) revert ScalarOverflow();
    if (maxAmount > type(uint96).max) revert ScalarOverflow();
    if (preApprovalExpiry > type(uint48).max) revert ScalarOverflow();
    if (authorizationExpiry > type(uint48).max) revert ScalarOverflow();
    if (refundExpiry > type(uint48).max) revert ScalarOverflow();

    // Commerce Escrow fees intentionally bypassed - all fee handling via ERC20FeeProxy
    // minFeeBps=0, maxFeeBps=10000 allows 0% fee (effectively disables Commerce Escrow fees)
    // feeReceiver=address(0) indicates no Commerce Escrow fee recipient
    return
      IAuthCaptureEscrow.PaymentInfo({
        operator: address(this),
        payer: payer,
        receiver: address(this),
        token: token,
        maxAmount: uint120(maxAmount),
        preApprovalExpiry: uint48(preApprovalExpiry),
        authorizationExpiry: uint48(authorizationExpiry),
        refundExpiry: uint48(refundExpiry),
        minFeeBps: 0,
        maxFeeBps: 10000,
        feeReceiver: address(0),
        salt: uint256(keccak256(abi.encodePacked(paymentReference)))
      });
  }

  /// @notice Store payment data
  /// @dev Values are validated in _createPaymentInfo before this function is called
  function _storePaymentData(
    bytes8 paymentReference,
    address payer,
    address merchant,
    address operator,
    address token,
    uint256 amount,
    uint256 maxAmount,
    uint256 preApprovalExpiry,
    uint256 authorizationExpiry,
    uint256 refundExpiry,
    bytes32 commerceHash
  ) internal {
    if (amount > type(uint96).max) revert ScalarOverflow();
    if (maxAmount > type(uint96).max) revert ScalarOverflow();

    payments[paymentReference] = PaymentData({
      payer: payer,
      merchant: merchant,
      amount: uint96(amount),
      operator: operator,
      maxAmount: uint96(maxAmount),
      token: token,
      preApprovalExpiry: uint48(preApprovalExpiry),
      authorizationExpiry: uint48(authorizationExpiry),
      refundExpiry: uint48(refundExpiry),
      commercePaymentHash: commerceHash
    });
  }

  /// @notice Create PaymentInfo from stored payment data
  /// @dev No overflow validation needed - stored types (uint96, uint48) are already validated
  /// during storage and safely cast to escrow types (uint120, uint48)
  function _createPaymentInfoFromStored(PaymentData storage payment, bytes8 paymentReference)
    internal
    view
    returns (IAuthCaptureEscrow.PaymentInfo memory)
  {
    // Commerce Escrow fees bypassed (same as authorization)
    return
      IAuthCaptureEscrow.PaymentInfo({
        operator: address(this),
        payer: payment.payer,
        receiver: address(this),
        token: payment.token,
        maxAmount: uint120(payment.maxAmount),
        preApprovalExpiry: payment.preApprovalExpiry,
        authorizationExpiry: payment.authorizationExpiry,
        refundExpiry: payment.refundExpiry,
        minFeeBps: 0,
        maxFeeBps: 10000,
        feeReceiver: address(0),
        salt: uint256(keccak256(abi.encodePacked(paymentReference)))
      });
  }

  /// @notice Frontend-friendly alias for authorizePayment
  /// @param params AuthParams struct containing all authorization parameters
  function authorizeCommercePayment(AuthParams calldata params) external {
    authorizePayment(params);
  }

  /// @notice Capture a payment by payment reference
  /// @dev Fee Architecture: Merchant pays platform fee (subtracted from capture amount).
  ///      For payer-pays-fee model, would need protocol changes to authorize (amount + fee).
  /// @param paymentReference Request Network payment reference
  /// @param captureAmount Amount to capture from escrow (total amount before fees)
  /// @param feeBps Request Network platform fee in basis points (0-10000, where 10000 = 100%).
  ///                MERCHANT PAYS: Fee is subtracted from captureAmount.
  ///                Formula: feeAmount = (captureAmount * feeBps) / 10000
  ///                Example: 250 bps on 1000 USDC = 25 USDC fee, merchant receives 975 USDC
  ///                Note: Use 0 for no fee. Reverts if > 10000 (InvalidFeeBps).
  /// @param feeReceiver Request Network platform fee recipient address (single recipient).
  ///                    This is a REQUEST NETWORK PLATFORM FEE, NOT Commerce Escrow protocol fee.
  ///                    For multiple recipients (e.g., API + Platform split), deploy a fee-splitting contract.
  ///                    Commerce Escrow fees are intentionally bypassed (see FEE_MECHANISM_DESIGN.md).
  ///                    Can be address(0) to effectively burn the fee (not recommended).
  function capturePayment(
    bytes8 paymentReference,
    uint256 captureAmount,
    uint16 feeBps,
    address feeReceiver
  ) external nonReentrant onlyOperator(paymentReference) {
    PaymentData storage payment = payments[paymentReference];

    // Validate fee basis points to prevent underflow
    if (feeBps > 10000) revert InvalidFeeBps();

    // Create PaymentInfo for the capture operation (must match the original authorization)
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfoFromStored(
      payment,
      paymentReference
    );

    // Capture from escrow with NO FEE - Commerce Escrow fees are intentionally bypassed
    // All fee handling is done via ERC20FeeProxy for Request Network compatibility
    // This ensures: 1) Proper RN event emission, 2) Unified fee tracking, 3) Flexible fee recipients
    commerceEscrow.capture(paymentInfo, captureAmount, 0, address(0));

    // Get the actual balance in wrapper (transfer all tokens to handle any existing balance)
    uint256 amountToTransfer = IERC20(payment.token).balanceOf(address(this));

    // Calculate Request Network platform fee (MERCHANT PAYS MODEL)
    // Merchant receives: amountToTransfer - feeAmount
    // Fee receiver gets: feeAmount
    // Formula: feeAmount = (amountToTransfer * feeBps) / 10000
    // Integer division truncates toward zero (slightly favors merchant in rounding)
    // Example: 1001 wei @ 250 bps = 25 wei fee (not 25.025), merchant gets 976 wei
    uint256 feeAmount = (amountToTransfer * feeBps) / 10000;
    uint256 merchantAmount = amountToTransfer - feeAmount;

    // Transfer via ERC20FeeProxy - splits payment between merchant and fee recipient
    // ERC20FeeProxy pulls tokens from this wrapper via transferFrom
    // Approve the exact amount to be transferred (merchant + fee = amountToTransfer)
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), amountToTransfer);

    // ERC20FeeProxy emits TransferWithReferenceAndFee event for Request Network tracking
    // Merchant receives: merchantAmount (amountToTransfer - feeAmount)
    // Fee recipient receives: feeAmount
    erc20FeeProxy.transferFromWithReferenceAndFee(
      payment.token,
      payment.merchant,
      merchantAmount,
      abi.encodePacked(paymentReference),
      feeAmount,
      feeReceiver
    );

    // Reset approval to 0 after use for security
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);

    emit PaymentCaptured(
      paymentReference,
      payment.commercePaymentHash,
      captureAmount,
      payment.merchant
    );
  }

  /// @notice Void a payment by payment reference
  /// @dev No fee is charged on void - funds return to payer (remedial action, no value capture)
  /// @param paymentReference Request Network payment reference
  function voidPayment(bytes8 paymentReference)
    external
    nonReentrant
    onlyOperator(paymentReference)
  {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) revert PaymentNotFound();

    // Create PaymentInfo for the void operation (must match the original authorization)
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfoFromStored(
      payment,
      paymentReference
    );

    // Verify the hash matches the stored hash to ensure escrow will accept it
    bytes32 computedHash = commerceEscrow.getHash(paymentInfo);
    if (computedHash != payment.commercePaymentHash) revert PaymentNotFound();

    // Reset any existing approval before escrow call (prevents reentrancy issues)
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);

    // Get balance before void to calculate actual amount received
    uint256 balanceBefore = IERC20(payment.token).balanceOf(address(this));

    // Void the payment - funds come to wrapper first
    commerceEscrow.void(paymentInfo);

    // Get the actual balance received from escrow (may include existing tokens)
    uint256 balanceAfter = IERC20(payment.token).balanceOf(address(this));
    uint256 actualVoidedAmount = balanceAfter > balanceBefore
      ? balanceAfter - balanceBefore
      : balanceAfter;

    // If we didn't receive the expected amount, use the full balance (handles edge cases)
    if (actualVoidedAmount == 0) {
      actualVoidedAmount = balanceAfter;
    }

    // Transfer the voided amount to payer via ERC20FeeProxy (no fee for voids)
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), actualVoidedAmount);

    erc20FeeProxy.transferFromWithReferenceAndFee(
      payment.token,
      payment.payer,
      actualVoidedAmount,
      abi.encodePacked(paymentReference),
      0, // No fee for voids
      address(0)
    );

    // Reset approval to 0 after use for security
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);

    emit PaymentVoided(
      paymentReference,
      payment.commercePaymentHash,
      actualVoidedAmount,
      payment.payer
    );
  }

  /// @notice Charge a payment (immediate authorization and capture)
  /// @dev Combines authorize + capture into one transaction. Merchant pays platform fee (subtracted from amount).
  /// @param params ChargeParams struct containing all payment parameters (including feeBps and feeReceiver)
  function chargePayment(ChargeParams calldata params) external nonReentrant {
    if (params.paymentReference == bytes8(0)) revert InvalidPaymentReference();
    if (payments[params.paymentReference].commercePaymentHash != bytes32(0))
      revert PaymentAlreadyExists();

    // Validate addresses
    if (params.payer == address(0)) revert ZeroAddress();
    if (params.merchant == address(0)) revert ZeroAddress();
    if (params.operator == address(0)) revert ZeroAddress();
    if (params.token == address(0)) revert ZeroAddress();

    // Create and execute charge
    _executeCharge(params);
  }

  /// @notice Internal function to execute charge
  function _executeCharge(ChargeParams memory params) internal {
    // Create PaymentInfo
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfo(
      params.payer,
      params.token,
      params.amount,
      params.maxAmount,
      params.preApprovalExpiry,
      params.authorizationExpiry,
      params.refundExpiry,
      params.paymentReference
    );

    // Store payment data
    bytes32 commerceHash = commerceEscrow.getHash(paymentInfo);
    _storePaymentData(
      params.paymentReference,
      params.payer,
      params.merchant,
      params.operator,
      params.token,
      params.amount,
      params.maxAmount,
      params.preApprovalExpiry,
      params.authorizationExpiry,
      params.refundExpiry,
      commerceHash
    );

    // Commerce Escrow charge with NO FEE - bypassing Commerce Escrow fee mechanism
    // All fee handling delegated to ERC20FeeProxy for Request Network compatibility
    commerceEscrow.charge(
      paymentInfo,
      params.amount,
      params.tokenCollector,
      params.collectorData,
      0,
      address(0)
    );

    // Transfer to merchant via ERC20FeeProxy with Request Network platform fee
    // Merchant pays fee (receives amount - fee)
    _transferToMerchant(
      params.token,
      params.merchant,
      params.amount,
      params.feeBps,
      params.feeReceiver,
      params.paymentReference
    );

    emit PaymentCharged(
      params.paymentReference,
      params.payer,
      params.merchant,
      params.token,
      params.amount,
      commerceHash
    );
  }

  /// @notice Transfer funds to merchant via ERC20FeeProxy with Request Network platform fee
  /// @dev CRITICAL: Merchant pays the fee (receives amount - feeAmount).
  ///      All fee distribution goes through ERC20FeeProxy for Request Network event compatibility.
  ///      Integer division truncates (slightly favors merchant in rounding).
  /// @param token ERC20 token address
  /// @param merchant Merchant address (receives amount after fee deduction)
  /// @param amount Total payment amount (before fee deduction)
  /// @param feeBps Request Network platform fee in basis points (0-10000, validated)
  /// @param feeReceiver Request Network platform fee recipient address
  /// @param paymentReference Request Network payment reference for tracking
  function _transferToMerchant(
    address token,
    address merchant,
    uint256 amount,
    uint16 feeBps,
    address feeReceiver,
    bytes8 paymentReference
  ) internal {
    // Validate fee basis points to prevent underflow
    if (feeBps > 10000) revert InvalidFeeBps();

    // Get the actual balance in wrapper (transfer all tokens to handle any existing balance)
    uint256 amountToTransfer = IERC20(token).balanceOf(address(this));

    // Calculate Request Network platform fee (MERCHANT PAYS MODEL)
    // Merchant receives: amountToTransfer - feeAmount
    // Fee receiver gets: feeAmount
    uint256 feeAmount = (amountToTransfer * feeBps) / 10000;
    uint256 merchantAmount = amountToTransfer - feeAmount;
    uint256 totalToTransfer = merchantAmount + feeAmount;

    // Approve ERC20FeeProxy to spend the exact amount to be transferred
    // Reset approval to 0 first for tokens that require it, then set to totalToTransfer
    IERC20(token).safeApprove(address(erc20FeeProxy), 0);
    IERC20(token).safeApprove(address(erc20FeeProxy), totalToTransfer);

    // Transfer via ERC20FeeProxy - splits between merchant and fee recipient
    // Emits TransferWithReferenceAndFee event for Request Network tracking
    erc20FeeProxy.transferFromWithReferenceAndFee(
      token,
      merchant,
      merchantAmount,
      abi.encodePacked(paymentReference),
      feeAmount,
      feeReceiver
    );

    // Reset approval to 0 after use for security
    IERC20(token).safeApprove(address(erc20FeeProxy), 0);
  }

  /// @notice Reclaim a payment after authorization expiry (payer only)
  /// @param paymentReference Request Network payment reference
  function reclaimPayment(bytes8 paymentReference)
    external
    nonReentrant
    onlyPayer(paymentReference)
  {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) revert PaymentNotFound();

    // Create PaymentInfo for the reclaim operation (must match the original authorization)
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfoFromStored(
      payment,
      paymentReference
    );

    // Verify the hash matches the stored hash to ensure escrow will accept it
    bytes32 computedHash = commerceEscrow.getHash(paymentInfo);
    if (computedHash != payment.commercePaymentHash) revert PaymentNotFound();

    // Reset any existing approval before escrow call (prevents reentrancy issues)
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);

    // Get balance before reclaim to calculate actual amount received
    uint256 balanceBefore = IERC20(payment.token).balanceOf(address(this));

    // Reclaim the payment - funds come to wrapper first
    commerceEscrow.reclaim(paymentInfo);

    // Get the actual balance received from escrow (may include existing tokens)
    uint256 balanceAfter = IERC20(payment.token).balanceOf(address(this));
    uint256 actualReclaimedAmount = balanceAfter > balanceBefore
      ? balanceAfter - balanceBefore
      : balanceAfter;

    // If we didn't receive the expected amount, use the full balance (handles edge cases)
    if (actualReclaimedAmount == 0) {
      actualReclaimedAmount = balanceAfter;
    }

    // Transfer the reclaimed amount to payer via ERC20FeeProxy (no fee for reclaims)
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), actualReclaimedAmount);

    erc20FeeProxy.transferFromWithReferenceAndFee(
      payment.token,
      payment.payer,
      actualReclaimedAmount,
      abi.encodePacked(paymentReference),
      0, // No fee for reclaims
      address(0)
    );

    // Reset approval to 0 after use for security
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);

    emit PaymentReclaimed(
      paymentReference,
      payment.commercePaymentHash,
      actualReclaimedAmount,
      payment.payer
    );
  }

  /// @notice Refund a captured payment (operator only)
  /// @param paymentReference Request Network payment reference
  /// @param refundAmount Amount to refund
  /// @param tokenCollector Address of token collector to use
  /// @param collectorData Data to pass to token collector
  function refundPayment(
    bytes8 paymentReference,
    uint256 refundAmount,
    address tokenCollector,
    bytes calldata collectorData
  ) external nonReentrant onlyOperator(paymentReference) {
    PaymentData storage payment = payments[paymentReference];

    // Create PaymentInfo for the refund operation (must match the original authorization)
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfoFromStored(
      payment,
      paymentReference
    );

    // Since paymentInfo.operator is this wrapper, but the actual operator (msg.sender) has the tokens,
    // we need to collect tokens from msg.sender first, then provide them to the escrow.
    // The OperatorRefundCollector will try to pull from paymentInfo.operator (this wrapper).

    // Pull tokens from the actual operator (msg.sender) to this wrapper
    IERC20(payment.token).safeTransferFrom(msg.sender, address(this), refundAmount);

    // Approve the OperatorRefundCollector to pull from this wrapper
    // Reset approval to 0 first for tokens that require it, then set to refundAmount
    IERC20(payment.token).safeApprove(tokenCollector, 0);
    IERC20(payment.token).safeApprove(tokenCollector, refundAmount);

    // Refund the payment - escrow will pull from wrapper and send to wrapper
    commerceEscrow.refund(paymentInfo, refundAmount, tokenCollector, collectorData);

    // Get the actual balance in wrapper (transfer all tokens to handle any existing balance)
    uint256 actualRefundAmount = IERC20(payment.token).balanceOf(address(this));

    // Forward the refund to payer via ERC20FeeProxy (no fee for refunds)
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), actualRefundAmount);

    erc20FeeProxy.transferFromWithReferenceAndFee(
      payment.token,
      payment.payer,
      actualRefundAmount,
      abi.encodePacked(paymentReference),
      0, // No fee for refunds
      address(0)
    );

    // Reset approval to 0 after use for security
    IERC20(payment.token).safeApprove(address(erc20FeeProxy), 0);

    emit PaymentRefunded(
      paymentReference,
      payment.commercePaymentHash,
      actualRefundAmount,
      payment.payer
    );
  }

  /// @notice Get payment data by payment reference
  /// @param paymentReference Request Network payment reference
  /// @return PaymentData struct
  function getPaymentData(bytes8 paymentReference) external view returns (PaymentData memory) {
    return payments[paymentReference];
  }

  /// @notice Get payment state from Commerce Payments escrow
  /// @param paymentReference Request Network payment reference
  /// @return hasCollectedPayment Whether payment has been collected
  /// @return capturableAmount Amount available for capture
  /// @return refundableAmount Amount available for refund
  function getPaymentState(bytes8 paymentReference)
    external
    view
    returns (
      bool hasCollectedPayment,
      uint120 capturableAmount,
      uint120 refundableAmount
    )
  {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) revert PaymentNotFound();

    (hasCollectedPayment, capturableAmount, refundableAmount) = commerceEscrow.paymentState(
      payment.commercePaymentHash
    );
    return (hasCollectedPayment, capturableAmount, refundableAmount);
  }

  /// @notice Check if payment can be captured
  /// @param paymentReference Request Network payment reference
  /// @return True if payment can be captured
  function canCapture(bytes8 paymentReference) external view returns (bool) {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) return false;

    // solhint-disable-next-line no-unused-vars
    (
      bool _hasCollectedPayment,
      uint120 capturableAmount,
      uint120 _refundableAmount
    ) = commerceEscrow.paymentState(payment.commercePaymentHash);
    return capturableAmount > 0;
  }

  /// @notice Check if payment can be voided
  /// @param paymentReference Request Network payment reference
  /// @return True if payment can be voided
  function canVoid(bytes8 paymentReference) external view returns (bool) {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) return false;

    // solhint-disable-next-line no-unused-vars
    (
      bool _hasCollectedPayment,
      uint120 capturableAmount,
      uint120 _refundableAmount
    ) = commerceEscrow.paymentState(payment.commercePaymentHash);
    return capturableAmount > 0;
  }
}
