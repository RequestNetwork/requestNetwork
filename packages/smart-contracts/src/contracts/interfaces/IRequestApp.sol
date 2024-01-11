// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/interfaces/IERC165.sol';

/**
 * @title IRequestApp
 * @notice This interface expose the methods to integrates your application within the request network protocol
 */
interface IRequestApp is IERC165 {
  /**
   * @notice Payment context structure. Contains payment information. It is passed during callbacks
   * @param amount Payment amount
   * @param payer Payer address
   * @param token Payment token address
   * @param paymentRef Payment reference
   */
  struct PaymentCtx {
    uint256 amount;
    address payer;
    address recipient;
    address token;
    bytes paymentRef;
  }

  /**
   * @notice This function will be called before a payment is processed.
   *         It's purpose is to perform checks based on the received paymentContext and appData.
   * @param paymentCtx The payment context passed by the previous request application
   * @param appData The application data to be used by this app.
   */
  function beforePaymentHook(PaymentCtx calldata paymentCtx, bytes calldata appData)
    external
    returns (bool success);
}
