// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './BaseRequestApp.sol';
import '../interfaces/IRequestApp.sol';
import '../lib/HooksLibrary.sol';
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";

/**
 * @title DoublePaymentPreventionApp
 * @notice Specific app to prevent double payment through hooks during payment
 */
contract DoublePaymentPreventionApp is BaseRequestApp {
  using BitMaps for BitMaps.BitMap;
  BitMaps.BitMap private paymentStatus;

  struct DoublePaymentPreventionData {
    bytes paymentReference;
    bytes nextAppData;
  }

  constructor() {}

  /**
   * @notice Allow the contract to receive funds (optional)
   */
  receive() external payable {}

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
    require(!paymentStatus.get(uint256(keccak256(data.paymentReference))), "Payment already executed");
    paymentStatus.set(uint256(keccak256(data.paymentReference)));
    if (data.nextAppData.length != 0) {
      HooksLibrary.executeHooks(paymentCtx, data.nextAppData);
    }
    return true;
  }

  /**
   * @notice Method to compute the DoublePaymentPreventionData as encoded bytes 
   * @param paymentReference The payment reference of the payment
   * @param nextAppData Next application data to execute
   */
  function computeBeforePaymentAppData(bytes calldata paymentReference, bytes calldata nextAppData)
    external
    pure
    returns (bytes memory)
  {
    return abi.encode(DoublePaymentPreventionData(paymentReference, nextAppData));
  }
}
