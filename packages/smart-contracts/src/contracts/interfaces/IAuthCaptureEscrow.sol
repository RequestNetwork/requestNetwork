// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title IAuthCaptureEscrow
/// @notice Interface for AuthCaptureEscrow contract
interface IAuthCaptureEscrow {
  /// @notice Payment info, contains all information required to authorize and capture a unique payment
  struct PaymentInfo {
    /// @dev Entity responsible for driving payment flow
    address operator;
    /// @dev The payer's address authorizing the payment
    address payer;
    /// @dev Address that receives the payment (minus fees)
    address receiver;
    /// @dev The token contract address
    address token;
    /// @dev The amount of tokens that can be authorized
    uint120 maxAmount;
    /// @dev Timestamp when the payer's pre-approval can no longer authorize payment
    uint48 preApprovalExpiry;
    /// @dev Timestamp when an authorization can no longer be captured and the payer can reclaim from escrow
    uint48 authorizationExpiry;
    /// @dev Timestamp when a successful payment can no longer be refunded
    uint48 refundExpiry;
    /// @dev Minimum fee percentage in basis points
    uint16 minFeeBps;
    /// @dev Maximum fee percentage in basis points
    uint16 maxFeeBps;
    /// @dev Address that receives the fee portion of payments, if 0 then operator can set at capture
    address feeReceiver;
    /// @dev A source of entropy to ensure unique hashes across different payments
    uint256 salt;
  }

  function getHash(PaymentInfo memory paymentInfo) external view returns (bytes32);

  function authorize(
    PaymentInfo memory paymentInfo,
    uint256 amount,
    address tokenCollector,
    bytes calldata collectorData
  ) external;

  function capture(
    PaymentInfo memory paymentInfo,
    uint256 captureAmount,
    uint16 feeBps,
    address feeReceiver
  ) external;

  function paymentState(bytes32 paymentHash)
    external
    view
    returns (
      bool hasCollectedPayment,
      uint120 capturableAmount,
      uint120 refundableAmount
    );

  function void(PaymentInfo memory paymentInfo) external;

  function charge(
    PaymentInfo memory paymentInfo,
    uint256 amount,
    address tokenCollector,
    bytes calldata collectorData,
    uint16 feeBps,
    address feeReceiver
  ) external;

  function reclaim(PaymentInfo memory paymentInfo) external;

  function refund(
    PaymentInfo memory paymentInfo,
    uint256 refundAmount,
    address tokenCollector,
    bytes calldata collectorData
  ) external;
}
