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
  struct PaymentData {
    address payer;
    address merchant;
    address operator; // The real operator who can capture/void this payment
    address token;
    uint256 amount;
    uint256 maxAmount;
    uint256 preApprovalExpiry;
    uint256 authorizationExpiry; // When authorization expires and can be reclaimed
    uint256 refundExpiry; // When refunds are no longer allowed
    bytes32 commercePaymentHash;
    bool isActive;
  }

  /// @notice Emitted when a payment is authorized (frontend-friendly)
  event PaymentAuthorized(
    bytes8 indexed paymentReference,
    address indexed payer,
    address indexed merchant,
    address token,
    uint256 amount,
    bytes32 commercePaymentHash
  );

  /// @notice Emitted when a commerce payment is authorized (for compatibility)
  event CommercePaymentAuthorized(
    bytes8 indexed paymentReference,
    address indexed payer,
    address indexed merchant,
    uint256 amount
  );

  /// @notice Emitted when a payment is captured
  event PaymentCaptured(
    bytes8 indexed paymentReference,
    bytes32 indexed commercePaymentHash,
    uint256 capturedAmount,
    address indexed merchant
  );

  /// @notice Emitted when a payment is voided
  event PaymentVoided(
    bytes8 indexed paymentReference,
    bytes32 indexed commercePaymentHash,
    uint256 voidedAmount,
    address indexed payer
  );

  /// @notice Emitted when a payment is charged (immediate auth + capture)
  event PaymentCharged(
    bytes8 indexed paymentReference,
    address indexed payer,
    address indexed merchant,
    address token,
    uint256 amount,
    bytes32 commercePaymentHash
  );

  /// @notice Emitted when a payment is reclaimed by the payer
  event PaymentReclaimed(
    bytes8 indexed paymentReference,
    bytes32 indexed commercePaymentHash,
    uint256 reclaimedAmount,
    address indexed payer
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
    bytes32 indexed commercePaymentHash,
    uint256 refundedAmount,
    address indexed payer
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
    uint16 feeBps;
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

  /// @notice Check call sender is the operator for this payment
  /// @param paymentReference Request Network payment reference
  modifier onlyOperator(bytes8 paymentReference) {
    PaymentData storage payment = payments[paymentReference];
    if (!payment.isActive) revert PaymentNotFound();

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
    if (!payment.isActive) revert PaymentNotFound();

    // Check if the caller is the payer for this payment
    if (msg.sender != payment.payer) {
      revert InvalidOperator(msg.sender, payment.payer); // Reusing the same error for simplicity
    }
    _;
  }

  /// @notice Constructor
  /// @param commerceEscrow_ Commerce Payments escrow contract
  /// @param erc20FeeProxy_ Request Network's ERC20FeeProxy contract
  constructor(address commerceEscrow_, address erc20FeeProxy_) {
    commerceEscrow = IAuthCaptureEscrow(commerceEscrow_);
    erc20FeeProxy = IERC20FeeProxy(erc20FeeProxy_);
  }

  /// @notice Authorize a payment into escrow
  /// @param params AuthParams struct containing all authorization parameters
  function authorizePayment(AuthParams calldata params) external nonReentrant {
    if (params.paymentReference == bytes8(0)) revert InvalidPaymentReference();
    if (payments[params.paymentReference].isActive) revert PaymentAlreadyExists();

    // Create and execute authorization
    _executeAuthorization(params);
  }

  /// @notice Internal function to execute authorization
  function _executeAuthorization(AuthParams memory params) internal {
    // Create PaymentInfo
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfo(
      params.payer,
      params.token,
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
    uint256 maxAmount,
    uint256 preApprovalExpiry,
    uint256 authorizationExpiry,
    uint256 refundExpiry,
    bytes8 paymentReference
  ) internal view returns (IAuthCaptureEscrow.PaymentInfo memory) {
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
    payments[paymentReference] = PaymentData({
      payer: payer,
      merchant: merchant,
      operator: operator,
      token: token,
      amount: amount,
      maxAmount: maxAmount,
      preApprovalExpiry: preApprovalExpiry,
      authorizationExpiry: authorizationExpiry,
      refundExpiry: refundExpiry,
      commercePaymentHash: commerceHash,
      isActive: true
    });
  }

  /// @notice Create PaymentInfo from stored payment data
  function _createPaymentInfoFromStored(PaymentData storage payment, bytes8 paymentReference)
    internal
    view
    returns (IAuthCaptureEscrow.PaymentInfo memory)
  {
    return
      IAuthCaptureEscrow.PaymentInfo({
        operator: address(this),
        payer: payment.payer,
        receiver: address(this),
        token: payment.token,
        maxAmount: uint120(payment.maxAmount),
        preApprovalExpiry: uint48(payment.preApprovalExpiry),
        authorizationExpiry: uint48(payment.authorizationExpiry),
        refundExpiry: uint48(payment.refundExpiry),
        minFeeBps: 0,
        maxFeeBps: 10000,
        feeReceiver: address(0),
        salt: uint256(keccak256(abi.encodePacked(paymentReference)))
      });
  }

  /// @notice Frontend-friendly alias for authorizePayment
  /// @param params AuthParams struct containing all authorization parameters
  function authorizeCommercePayment(AuthParams calldata params) external {
    this.authorizePayment(params);
  }

  /// @notice Capture a payment by payment reference
  /// @param paymentReference Request Network payment reference
  /// @param captureAmount Amount to capture
  /// @param feeBps Fee basis points
  /// @param feeReceiver Fee recipient address
  function capturePayment(
    bytes8 paymentReference,
    uint256 captureAmount,
    uint16 feeBps,
    address feeReceiver
  ) external nonReentrant onlyOperator(paymentReference) {
    PaymentData storage payment = payments[paymentReference];

    // Create PaymentInfo for the capture operation (must match the original authorization)
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfoFromStored(
      payment,
      paymentReference
    );

    // Capture from escrow with NO FEE - let ERC20FeeProxy handle fee distribution
    // This way the wrapper receives the full captureAmount
    commerceEscrow.capture(paymentInfo, captureAmount, 0, address(0));

    // Calculate fee amounts - ERC20FeeProxy will handle the split
    uint256 feeAmount = (captureAmount * feeBps) / 10000;
    uint256 merchantAmount = captureAmount - feeAmount;

    // Approve ERC20FeeProxy to spend the full amount we received
    IERC20(payment.token).forceApprove(address(erc20FeeProxy), captureAmount);

    // Transfer via ERC20FeeProxy - it handles the fee distribution
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
  /// @param params ChargeParams struct containing all payment parameters
  function chargePayment(ChargeParams calldata params) external nonReentrant {
    if (params.paymentReference == bytes8(0)) revert InvalidPaymentReference();
    if (payments[params.paymentReference].isActive) revert PaymentAlreadyExists();

    // Create and execute charge
    _executeCharge(params);
  }

  /// @notice Internal function to execute charge
  function _executeCharge(ChargeParams memory params) internal {
    // Create PaymentInfo
    IAuthCaptureEscrow.PaymentInfo memory paymentInfo = _createPaymentInfo(
      params.payer,
      params.token,
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

    // Execute charge
    commerceEscrow.charge(
      paymentInfo,
      params.amount,
      params.tokenCollector,
      params.collectorData,
      params.feeBps,
      params.feeReceiver
    );

    // Transfer to merchant via ERC20FeeProxy
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

  /// @notice Transfer funds to merchant via ERC20FeeProxy
  function _transferToMerchant(
    address token,
    address merchant,
    uint256 amount,
    uint16 feeBps,
    address feeReceiver,
    bytes8 paymentReference
  ) internal {
    uint256 feeAmount = (amount * feeBps) / 10000;
    uint256 merchantAmount = amount - feeAmount;

    IERC20(token).forceApprove(address(erc20FeeProxy), amount);
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
    if (!payment.isActive) revert PaymentNotFound();

    return commerceEscrow.paymentState(payment.commercePaymentHash);
  }

  /// @notice Check if payment can be captured
  /// @param paymentReference Request Network payment reference
  /// @return True if payment can be captured
  function canCapture(bytes8 paymentReference) external view returns (bool) {
    PaymentData storage payment = payments[paymentReference];
    if (!payment.isActive) return false;

    (, uint120 capturableAmount, ) = commerceEscrow.paymentState(payment.commercePaymentHash);
    return capturableAmount > 0;
  }

  /// @notice Check if payment can be voided
  /// @param paymentReference Request Network payment reference
  /// @return True if payment can be voided
  function canVoid(bytes8 paymentReference) external view returns (bool) {
    PaymentData storage payment = payments[paymentReference];
    if (!payment.isActive) return false;

    (, uint120 capturableAmount, ) = commerceEscrow.paymentState(payment.commercePaymentHash);
    return capturableAmount > 0;
  }
}
