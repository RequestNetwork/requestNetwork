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
/// @dev Fee Architecture:
///      - Fees are Request Network platform fees, NOT Commerce Escrow protocol fees
///      - Merchant pays fee (subtracted from capture amount: merchantReceives = captureAmount - fee)
///      - Single fee recipient per operation (can be a fee-splitting contract if needed)
///      - All fees distributed via ERC20FeeProxy for Request Network compatibility and event tracking
///      - Commerce Escrow fee mechanism is intentionally bypassed (feeBps=0, feeReceiver=address(0))
///      - See docs/design-decisions/FEE_MECHANISM_DESIGN.md for detailed architecture and future enhancements
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
  /// @dev Struct packing optimizes storage from 11 slots to 5 slots (~55% gas savings)
  /// Slot 0: payer (20 bytes)
  /// Slot 1: merchant (20 bytes) + amount (12 bytes)
  /// Slot 2: operator (20 bytes) + maxAmount (12 bytes)
  /// Slot 3: token (20 bytes) + preApprovalExpiry (6 bytes) + authorizationExpiry (6 bytes)
  /// Slot 4: refundExpiry (6 bytes)
  /// Slot 5: commercePaymentHash (32 bytes)
  /// @dev Payment existence is determined by commercePaymentHash != bytes32(0)
  /// This approach delegates to the Commerce Escrow's state tracking without external calls,
  /// maintaining gas efficiency while avoiding state synchronization issues.
  struct PaymentData {
    address payer;
    address merchant;
    uint96 amount;
    address operator; // The real operator who can capture/void this payment
    uint96 maxAmount;
    address token;
    uint48 preApprovalExpiry;
    uint48 authorizationExpiry; // When authorization expires and can be reclaimed
    uint48 refundExpiry; // When refunds are no longer allowed
    bytes32 commercePaymentHash;
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
    /// IMPORTANT: Merchant pays this fee (subtracted from payment amount).
    /// Formula: feeAmount = (amount * feeBps) / 10000
    /// Example: 250 bps on 1000 USDC = 25 USDC fee, merchant receives 975 USDC
    uint16 feeBps;
    /// @dev Request Network platform fee recipient address (single recipient per operation).
    /// This is NOT a Commerce Escrow protocol fee - it's a Request Network service fee.
    /// Can be a fee-splitting smart contract if multi-party distribution is needed.
    /// Separate from any Commerce Escrow fees (which are bypassed in this wrapper).
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

    // Execute authorization
    commerceEscrow.authorize(
      paymentInfo,
      params.amount,
      params.tokenCollector,
      params.collectorData
    );

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

    // Calculate Request Network platform fee (MERCHANT PAYS MODEL)
    // Merchant receives: captureAmount - feeAmount
    // Fee receiver gets: feeAmount
    // Formula: feeAmount = (captureAmount * feeBps) / 10000
    // Integer division truncates toward zero (slightly favors merchant in rounding)
    // Example: 1001 wei @ 250 bps = 25 wei fee (not 25.025), merchant gets 976 wei
    uint256 feeAmount = (captureAmount * feeBps) / 10000;
    uint256 merchantAmount = captureAmount - feeAmount;

    // Approve ERC20FeeProxy to spend the full amount we received
    IERC20(payment.token).forceApprove(address(erc20FeeProxy), captureAmount);

    // Transfer via ERC20FeeProxy - splits payment between merchant and fee recipient
    // ERC20FeeProxy emits TransferWithReferenceAndFee event for Request Network tracking
    // Merchant receives: merchantAmount (captureAmount - feeAmount)
    // Fee recipient receives: feeAmount
    erc20FeeProxy.transferFromWithReferenceAndFee(
      payment.token,
      payment.merchant,
      merchantAmount,
      abi.encodePacked(paymentReference),
      feeAmount,
      feeReceiver
    );

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

    // Create PaymentInfo for the void operation (must match the original authorization)
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfoFromStored(
      payment,
      paymentReference
    );

    // Get the amount to void before the operation
    (, uint120 capturableAmount, ) = commerceEscrow.paymentState(payment.commercePaymentHash);

    // Void the payment - funds go directly from TokenStore to payer (not through wrapper)
    commerceEscrow.void(paymentInfo);

    // No need to transfer - the escrow sends directly from TokenStore to payer
    // Just emit the Request Network compatible event
    emit TransferWithReferenceAndFee(
      payment.token,
      payment.payer,
      capturableAmount,
      paymentReference,
      0, // No fee for voids
      address(0)
    );

    emit PaymentVoided(
      paymentReference,
      payment.commercePaymentHash,
      capturableAmount,
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

    // Calculate Request Network platform fee (MERCHANT PAYS MODEL)
    // Merchant receives: amount - feeAmount
    // Fee receiver gets: feeAmount
    uint256 feeAmount = (amount * feeBps) / 10000;
    uint256 merchantAmount = amount - feeAmount;

    // Approve ERC20FeeProxy to spend the full amount
    IERC20(token).forceApprove(address(erc20FeeProxy), amount);

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
  }

  /// @notice Reclaim a payment after authorization expiry (payer only)
  /// @param paymentReference Request Network payment reference
  function reclaimPayment(bytes8 paymentReference)
    external
    nonReentrant
    onlyPayer(paymentReference)
  {
    PaymentData storage payment = payments[paymentReference];

    // Create PaymentInfo for the reclaim operation (must match the original authorization)
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfoFromStored(
      payment,
      paymentReference
    );

    // Get the amount to reclaim before the operation
    (, uint120 capturableAmount, ) = commerceEscrow.paymentState(payment.commercePaymentHash);

    // Reclaim the payment - funds go directly from TokenStore to payer (not through wrapper)
    commerceEscrow.reclaim(paymentInfo);

    // No need to transfer - the escrow sends directly from TokenStore to payer
    // Just emit the Request Network compatible event
    emit TransferWithReferenceAndFee(
      payment.token,
      payment.payer,
      capturableAmount,
      paymentReference,
      0, // No fee for reclaims
      address(0)
    );

    emit PaymentReclaimed(
      paymentReference,
      payment.commercePaymentHash,
      capturableAmount,
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
    IERC20(payment.token).forceApprove(tokenCollector, refundAmount);

    // Refund the payment - OperatorRefundCollector will pull from wrapper to TokenStore
    // Then escrow sends from TokenStore to payer
    commerceEscrow.refund(paymentInfo, refundAmount, tokenCollector, collectorData);

    // Emit Request Network compatible event
    emit TransferWithReferenceAndFee(
      payment.token,
      payment.payer,
      refundAmount,
      paymentReference,
      0, // No fee for refunds
      address(0)
    );

    emit PaymentRefunded(
      paymentReference,
      payment.commercePaymentHash,
      refundAmount,
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

    return commerceEscrow.paymentState(payment.commercePaymentHash);
  }

  /// @notice Check if payment can be captured
  /// @param paymentReference Request Network payment reference
  /// @return True if payment can be captured
  function canCapture(bytes8 paymentReference) external view returns (bool) {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) return false;

    (, uint120 capturableAmount, ) = commerceEscrow.paymentState(payment.commercePaymentHash);
    return capturableAmount > 0;
  }

  /// @notice Check if payment can be voided
  /// @param paymentReference Request Network payment reference
  /// @return True if payment can be voided
  function canVoid(bytes8 paymentReference) external view returns (bool) {
    PaymentData storage payment = payments[paymentReference];
    if (payment.commercePaymentHash == bytes32(0)) return false;

    (, uint120 capturableAmount, ) = commerceEscrow.paymentState(payment.commercePaymentHash);
    return capturableAmount > 0;
  }
}
