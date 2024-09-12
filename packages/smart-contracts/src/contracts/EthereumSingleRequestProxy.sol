// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import './interfaces/EthereumFeeProxy.sol';

/**
 * @title EthereumSingleRequestProxy
 * @notice This contract is used to send a single request to a payee with a fee sent to a third address
 */
contract EthereumSingleRequestProxy {
  address public payee;
  bytes public paymentReference;
  address public feeAddress;
  uint256 public feeAmount;
  IEthereumFeeProxy public ethereumFeeProxy;

  constructor(
    address _payee,
    bytes memory _paymentReference,
    address _ethereumFeeProxy,
    address _feeAddress,
    uint256 _feeAmount
  ) {
    payee = _payee;
    paymentReference = _paymentReference;
    feeAddress = _feeAddress;
    feeAmount = _feeAmount;
    ethereumFeeProxy = IEthereumFeeProxy(_ethereumFeeProxy);
  }

  receive() external payable {
    ethereumFeeProxy.transferWithReferenceAndFee{value: msg.value}(
      payable(payee),
      paymentReference,
      feeAmount,
      payable(feeAddress)
    );
  }
}
