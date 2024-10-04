// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

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

  // Reentrancy guard
  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;
  uint256 private _status;

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
    _status = _NOT_ENTERED;
  }

  modifier nonReentrant() {
    if (msg.sender != address(ethereumFeeProxy)) {
      // On the first call to nonReentrant, _status will be _NOT_ENTERED
      require(_status != _ENTERED, 'ReentrancyGuard: reentrant call');
      // Any calls to nonReentrant after this point will fail
      _status = _ENTERED;
    }
    _;
    if (msg.sender != address(ethereumFeeProxy)) {
      // By storing the original value once again, a refund is triggered
      _status = _NOT_ENTERED;
    }
  }

  receive() external payable nonReentrant {
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
