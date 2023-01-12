// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/utils/Strings.sol';

contract PaymentProtectionProxy {
  mapping(bytes32 => uint256) payments;

  function singlePaymentProtection(
    bytes32 paymentId,
    address paymentProxy,
    bytes calldata paymentData
  ) external payable {
    require(payments[paymentId] == 0, Strings.toString(payments[paymentId]));
    payments[paymentId] = block.timestamp;

    (bool success, ) = paymentProxy.delegatecall(paymentData);
    require(success, 'Payment execution failed');
  }

  function batchPaymentProtection(
    bytes32[] calldata paymentIds,
    address paymentProxy,
    bytes calldata paymentData
  ) external payable {
    for (uint256 i = 0; i < paymentIds.length; i++) {
      require(payments[paymentIds[i]] == 0, Strings.toString(payments[paymentIds[i]]));
      payments[paymentIds[i]] = block.timestamp;
    }

    (bool success, ) = paymentProxy.delegatecall(paymentData);
    require(success, 'Payment execution failed');
  }
}
