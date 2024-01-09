// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IDiamondPayment} from '../interfaces/IDiamondPayment.sol';
import {LibPayment} from '../libraries/LibPayment.sol';

// Request Protocol Diamond Facet to perform basic payments:
//  - ERC20 Payments
//  - ERC20 Payments with Fees
//  - Native Crypto Payments
//  - Native Crypto Payments with Fees

contract DiamondPaymentFacet is IDiamondPayment {
  /** ------------------------------------------------------------ */
  /** ---------------------- ERC20 Payments ---------------------- */
  /** ------------------------------------------------------------ */

  /**
   * @notice Performs a ERC20 token transfer with a reference
   * @param _tokenAddress Address of the ERC20 token smart contract
   * @param _to Transfer recipient
   * @param _amount Amount to transfer
   * @param _paymentReference Reference of the payment related
   */
  function tokenTransfer(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference
  ) external override {
    require(
      LibPayment.safeTransferFrom(_tokenAddress, _to, _amount),
      'TransferFromWithReference failed: transferFrom() failed'
    );
    emit TokenTransfer(_tokenAddress, _to, _amount, _paymentReference);
  }

  /**
    * @notice Performs a ERC20 token transfer with a reference
              and a transfer to a second address for the payment of a fee
    * @param _tokenAddress Address of the ERC20 token smart contract
    * @param _to Transfer recipient
    * @param _amount Amount to transfer
    * @param _paymentReference Reference of the payment related
    * @param _feeAmount The amount of the payment fee
    * @param _feeAddress The fee recipient
    */
  function tokenTransferWithFees(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress
  ) external override {
    require(
      LibPayment.safeTransferFrom(_tokenAddress, _to, _amount),
      'TokenTransferWithFees failed: payment transferFrom() failed'
    );
    if (_feeAmount > 0 && _feeAddress != address(0)) {
      require(
        LibPayment.safeTransferFrom(_tokenAddress, _feeAddress, _feeAmount),
        'TokenTransferWithFees failed: fee transferFrom() failed'
      );
    }
    emit TokenTransferWithFees(
      _tokenAddress,
      _to,
      _amount,
      _paymentReference,
      _feeAmount,
      _feeAddress
    );
  }

  /** ------------------------------------------------------------ */
  /** ------------------ Native Crypto Payments ------------------ */
  /** ------------------------------------------------------------ */

  /**
   * @notice Performs a transfer in native currency
   * @param _to Transfer recipient
   * @param _paymentReference Reference of the payment related
   */
  function nativeTransfer(address _to, bytes calldata _paymentReference) external payable override {
    (bool success, ) = _to.call{value: msg.value}('');
    require(success, 'Could not pay the recipient');
    emit NativeTransfer(_to, msg.value, _paymentReference);
  }

  /**
   * @notice Performs an Ethereum transfer with a reference
   * @param _to Transfer recipient
   * @param _paymentReference Reference of the payment related
   * @param _feeAmount The amount of the payment fee (part of the msg.value)
   * @param _feeAddress The fee recipient
   */
  function nativeTransferWithFees(
    address payable _to,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address payable _feeAddress
  ) external payable override {
    exactNativeTransferWithFees(
      _to,
      msg.value - _feeAmount,
      _paymentReference,
      _feeAmount,
      _feeAddress
    );
  }

  /**
   * @notice Performs an Ethereum transfer with a reference with an exact amount of eth
   * @param _to Transfer recipient
   * @param _amount Amount to transfer
   * @param _paymentReference Reference of the payment related
   * @param _feeAmount The amount of the payment fee (part of the msg.value)
   * @param _feeAddress The fee recipient
   */
  function exactNativeTransferWithFees(
    address payable _to,
    uint256 _amount,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address payable _feeAddress
  ) public payable {
    (bool sendSuccess, ) = _to.call{value: _amount}('');
    require(sendSuccess, 'Could not pay the recipient');

    _feeAddress.call{value: _feeAmount}('');

    // transfer the remaining ethers to the sender
    (bool sendBackSuccess, ) = payable(msg.sender).call{value: msg.value - _amount - _feeAmount}(
      ''
    );
    require(sendBackSuccess, 'Could not send remaining funds to the payer');

    emit NativeTransferWithFees(_to, _amount, _paymentReference, _feeAmount, _feeAddress);
  }
}
