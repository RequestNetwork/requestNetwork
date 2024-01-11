// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './BaseRequestApp.sol';
import '../interfaces/IRequestApp.sol';
import '../lib/HooksLibrary.sol';

/**
 * @title IRequestApp
 * @notice This interface expose the methods to integrates your application within the request network protocol
 */
contract DoublePaymentPreventionApp is BaseRequestApp {
  mapping(bytes => bool) executedPayments;

  struct DoublePaymentPreventionData {
    bytes paymentReference;
    bytes nextAppData;
  }

  constructor() {}

  /**
   * @notice This function will be called before receiving a payment.
   *         It's purpose is to perform checks based on the received PaymentContext and Data.
   * @param paymentCtx The payment context passed by the payment proxy
   * @param appData The application data
   */
  function beforePaymentHook(IRequestApp.PaymentCtx calldata paymentCtx, bytes calldata appData)
    external
    override(IRequestApp)
    returns (bool)
  {
    DoublePaymentPreventionData memory data = abi.decode(appData, (DoublePaymentPreventionData));
    require(
      keccak256(paymentCtx.paymentRef) == keccak256(data.paymentReference),
      'Payment Reference does not match'
    );
    require(!executedPayments[appData], 'Payment already executed');

    executedPayments[appData] = true;
    if (data.nextAppData.length != 0) {
      HooksLibrary.executeHooks(paymentCtx, data.nextAppData);
    }
    return true;
  }

  function computeBeforePaymentAppData(bytes calldata paymentReference, bytes calldata nextAppData)
    external
    pure
    returns (bytes memory)
  {
    return abi.encode(DoublePaymentPreventionData(paymentReference, nextAppData));
  }
}
