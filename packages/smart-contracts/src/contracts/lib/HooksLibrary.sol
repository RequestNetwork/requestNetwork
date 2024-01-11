// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/interfaces/IERC165.sol';
import '../interfaces/IRequestApp.sol';

/**
 * @title ERC20FeeProxy
 * @notice This contract performs an ERC20 token transfer, with a Fee sent to a third address and stores a reference
 */
library HooksLibrary {
  struct HookData {
    address app;
    bytes data;
  }

  function executeHooks(IRequestApp.PaymentCtx memory paymentCtx, bytes memory hooksData) internal {
    bytes4 erc165InterfaceId = type(IERC165).interfaceId;
    bytes4 requestAppInterfaceId = type(IRequestApp).interfaceId;

    HookData memory hookData = abi.decode(hooksData, (HookData));
    require(
      IERC165(hookData.app).supportsInterface(erc165InterfaceId) &&
        IERC165(hookData.app).supportsInterface(requestAppInterfaceId),
      'Hook cannot be processed - invalid app'
    );

    bool success = IRequestApp(hookData.app).beforePaymentHook(paymentCtx, hookData.data);
    require(success, 'Hook execution failed');
  }

  function computePaymentContext(
    uint256 amount,
    address payer,
    address recipient,
    address token,
    bytes memory paymentRef
  ) internal pure returns (IRequestApp.PaymentCtx memory paymentCtx) {
    return paymentCtx = IRequestApp.PaymentCtx(amount, payer, recipient, token, paymentRef);
  }

  function computeHooksData(address app, bytes calldata appData)
    internal
    pure
    returns (bytes memory)
  {
    return abi.encode(HookData(app, appData));
  }
}
