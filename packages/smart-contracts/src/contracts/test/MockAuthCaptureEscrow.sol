// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '../interfaces/IAuthCaptureEscrow.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/// @title MockAuthCaptureEscrow
/// @notice Mock implementation of IAuthCaptureEscrow for testing
contract MockAuthCaptureEscrow is IAuthCaptureEscrow {
  struct PaymentState {
    bool hasCollectedPayment;
    uint120 capturableAmount;
    uint120 refundableAmount;
  }

  mapping(bytes32 => PaymentState) public paymentStates;
  mapping(bytes32 => bool) public authorizedPayments;

  // Events to track calls for testing
  event AuthorizeCalled(bytes32 paymentHash, uint256 amount);
  event CaptureCalled(bytes32 paymentHash, uint256 captureAmount);
  event VoidCalled(bytes32 paymentHash);
  event ChargeCalled(bytes32 paymentHash, uint256 amount);
  event ReclaimCalled(bytes32 paymentHash);
  event RefundCalled(bytes32 paymentHash, uint256 refundAmount);

  function getHash(PaymentInfo memory paymentInfo) external pure override returns (bytes32) {
    return keccak256(abi.encode(paymentInfo));
  }

  function authorize(
    PaymentInfo memory paymentInfo,
    uint256 amount,
    address, /* tokenCollector */
    bytes calldata /* collectorData */
  ) external override {
    bytes32 hash = this.getHash(paymentInfo);

    // Transfer tokens from payer to this contract (simulating escrow)
    IERC20(paymentInfo.token).transferFrom(paymentInfo.payer, address(this), amount);

    // Set payment state
    paymentStates[hash] = PaymentState({
      hasCollectedPayment: true,
      capturableAmount: uint120(amount),
      refundableAmount: 0
    });

    authorizedPayments[hash] = true;
    emit AuthorizeCalled(hash, amount);
  }

  function capture(
    PaymentInfo memory paymentInfo,
    uint256 captureAmount,
    uint16, /* feeBps */
    address /* feeReceiver */
  ) external override {
    bytes32 hash = this.getHash(paymentInfo);
    require(authorizedPayments[hash], 'Payment not authorized');

    PaymentState storage state = paymentStates[hash];
    require(state.capturableAmount >= captureAmount, 'Insufficient capturable amount');

    // Transfer tokens to receiver (wrapper contract)
    IERC20(paymentInfo.token).transfer(paymentInfo.receiver, captureAmount);

    // Update state
    state.capturableAmount -= uint120(captureAmount);
    state.refundableAmount += uint120(captureAmount);

    emit CaptureCalled(hash, captureAmount);
  }

  function paymentState(bytes32 paymentHash)
    external
    view
    override
    returns (
      bool hasCollectedPayment,
      uint120 capturableAmount,
      uint120 refundableAmount
    )
  {
    PaymentState storage state = paymentStates[paymentHash];
    return (state.hasCollectedPayment, state.capturableAmount, state.refundableAmount);
  }

  function void(PaymentInfo memory paymentInfo) external override {
    bytes32 hash = this.getHash(paymentInfo);
    require(authorizedPayments[hash], 'Payment not authorized');

    PaymentState storage state = paymentStates[hash];
    require(state.capturableAmount > 0, 'Nothing to void');

    uint120 amountToVoid = state.capturableAmount;

    // Transfer tokens to receiver (wrapper) first, then wrapper forwards to payer
    // This matches the real escrow behavior where funds go through the wrapper
    IERC20(paymentInfo.token).transfer(paymentInfo.receiver, amountToVoid);

    // Update state
    state.capturableAmount = 0;

    emit VoidCalled(hash);
  }

  function charge(
    PaymentInfo memory paymentInfo,
    uint256 amount,
    address, /* tokenCollector */
    bytes calldata, /* collectorData */
    uint16, /* feeBps */
    address /* feeReceiver */
  ) external override {
    bytes32 hash = this.getHash(paymentInfo);

    // Transfer tokens from payer to receiver (wrapper contract)
    IERC20(paymentInfo.token).transferFrom(paymentInfo.payer, paymentInfo.receiver, amount);

    // Set payment state as captured
    paymentStates[hash] = PaymentState({
      hasCollectedPayment: true,
      capturableAmount: 0,
      refundableAmount: uint120(amount)
    });

    authorizedPayments[hash] = true;
    emit ChargeCalled(hash, amount);
  }

  function reclaim(PaymentInfo memory paymentInfo) external override {
    bytes32 hash = this.getHash(paymentInfo);
    require(authorizedPayments[hash], 'Payment not authorized');

    PaymentState storage state = paymentStates[hash];
    uint120 amountToReclaim = state.capturableAmount;

    // Transfer tokens to receiver (wrapper) first, then wrapper forwards to payer
    // This matches the real escrow behavior where funds go through the wrapper
    IERC20(paymentInfo.token).transfer(paymentInfo.receiver, amountToReclaim);

    // Update state
    state.capturableAmount = 0;

    emit ReclaimCalled(hash);
  }

  function refund(
    PaymentInfo memory paymentInfo,
    uint256 refundAmount,
    address tokenCollector,
    bytes calldata /* collectorData */
  ) external override {
    bytes32 hash = this.getHash(paymentInfo);
    require(authorizedPayments[hash], 'Payment not authorized');

    PaymentState storage state = paymentStates[hash];
    require(state.refundableAmount >= refundAmount, 'Insufficient refundable amount');

    // Use tokenCollector to pull tokens from operator (wrapper) to this contract
    // The wrapper should have already approved the tokenCollector
    if (tokenCollector != address(0)) {
      IERC20(paymentInfo.token).transferFrom(paymentInfo.operator, address(this), refundAmount);
    } else {
      // Fallback: pull directly from operator
      IERC20(paymentInfo.token).transferFrom(paymentInfo.operator, address(this), refundAmount);
    }

    // Transfer to payer via receiver (wrapper) so wrapper can emit events
    IERC20(paymentInfo.token).transfer(paymentInfo.receiver, refundAmount);

    // Update state
    state.refundableAmount -= uint120(refundAmount);

    emit RefundCalled(hash, refundAmount);
  }

  // Helper functions for testing
  function setPaymentState(
    bytes32 paymentHash,
    bool hasCollectedPayment,
    uint120 capturableAmount,
    uint120 refundableAmount
  ) external {
    paymentStates[paymentHash] = PaymentState({
      hasCollectedPayment: hasCollectedPayment,
      capturableAmount: capturableAmount,
      refundableAmount: refundableAmount
    });
    authorizedPayments[paymentHash] = true;
  }
}
