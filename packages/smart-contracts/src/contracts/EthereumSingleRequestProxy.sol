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

  address private originalSender;
  bool private locked;

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

  modifier noReentrant() {
    if (msg.sender != address(ethereumFeeProxy)) {
      require(!locked, 'Reentrant call detected');
      locked = true;
      _;
      locked = false;
    } else {
      // Allow the call if it's from Contract B
      _;
    }
  }

  receive() external payable noReentrant {
    if (msg.sender == address(ethereumFeeProxy)) {
      // Funds are being sent back from EthereumFeeProxy
      require(originalSender != address(0), 'No original sender stored');

      // Forward the funds to the original sender
      (bool forwardSuccess, ) = payable(originalSender).call{value: msg.value}('');
      require(forwardSuccess, 'Forwarding to original sender failed');

      // Clear the stored original sender
      originalSender = address(0);
    } else {
      require(originalSender == address(0), 'Another request is in progress');

      originalSender = msg.sender;

      bytes memory data = abi.encodeWithSignature(
        'transferWithReferenceAndFee(address,bytes,uint256,address)',
        payable(payee),
        paymentReference,
        feeAmount,
        payable(feeAddress)
      );

      (bool callSuccess, ) = address(ethereumFeeProxy).call{value: msg.value}(data);
      require(callSuccess, 'Call to EthereumFeeProxy failed');
    }
  }
}
