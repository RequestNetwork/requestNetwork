// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EthereumFeeProxy
 * @notice This contract performs an Ethereum transfer with a Fee sent to a third address and stores a reference
 */
contract EthereumFeeProxy {
  // Event to declare a transfer with a reference
  event TransferWithReferenceAndFee(
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );


  // Fallback function returns funds to the sender
  receive() external payable {
    revert("not payable receive");
  }

  /**
  * @notice Performs an Ethereum transfer with a reference
  * @param _to Transfer recipient
  * @param _paymentReference Reference of the payment related
  * @param _feeAmount The amount of the payment fee (part of the msg.value)
  * @param _feeAddress The fee recipient
  */
  function transferWithReferenceAndFee(
    address payable _to,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address payable _feeAddress
  )
    external
    payable
  { 
    // TODO reentrancy guard !!!
    _to.transfer(msg.value - _feeAmount);
    _feeAddress.transfer(_feeAmount);
    emit TransferWithReferenceAndFee(_to, msg.value - _feeAmount, _paymentReference, _feeAmount, _feeAddress);
  }
}
