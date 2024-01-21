// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/interfaces/IERC165.sol';
import '../interfaces/IRequestApp.sol';

/**
 * @title HookLibrary
 * @notice This Library encapsulate hooks specific logic, responsible for executing use-case specific RequestApp logic.
 */
library HooksLibrary {
  struct HookData {
    /** The address of the app that should execute the custom logic */
    address app;
    /** The custom logic that we want to execute */
    bytes data;
  }

  /**
   * @notice Check and execute an app custom logic.
   * @param paymentCtx The payment context passed by the payment proxy
   * @param hooksData Custom data to be executed
   */
  function executeHooks(IRequestApp.PaymentCtx memory paymentCtx, bytes[] memory hooksData) internal {
    bytes4 erc165InterfaceId = type(IERC165).interfaceId;
    bytes4 requestAppInterfaceId = type(IRequestApp).interfaceId;

    for(uint256 i=0; i<hooksData.length; i++) {
      HookData memory hookData = abi.decode(hooksData[i], (HookData));
      require(
        IERC165(hookData.app).supportsInterface(erc165InterfaceId) &&
          IERC165(hookData.app).supportsInterface(requestAppInterfaceId),
        'Hook cannot be processed - invalid app'
      );

      bool success = IRequestApp(hookData.app).beforePaymentHook(paymentCtx, hookData.data);
      require(success, 'Hook execution failed');
    }

  }

  /**
   * @notice Returns a PaymentContext based on payment values.
   * @param amount Payment amount
   * @param payer Payer address
   * @param recipient Recipient address
   * @param token Payment token address
   * @param paymentRef Payment reference
   */
  function computePaymentContext(
    uint256 amount,
    address payer,
    address recipient,
    address token,
    bytes memory paymentRef
  ) internal pure returns (IRequestApp.PaymentCtx memory paymentCtx) {
    return paymentCtx = IRequestApp.PaymentCtx(amount, payer, recipient, token, paymentRef);
  }

  /**
   * @notice Returns a bytes-encoded HookData.
   * @param app Address of the app to execute
   * @param appData data to execute
   */
  function computeHooksData(address app, bytes calldata appData)
    internal
    pure
    returns (bytes memory)
  {
    return abi.encode(HookData(app, appData));
  }
}
