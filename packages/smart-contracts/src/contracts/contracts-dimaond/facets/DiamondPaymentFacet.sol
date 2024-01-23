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
    LibPayment.makeTokenTransfer(_tokenAddress, _to, _amount);
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
    LibPayment.makeTokenPaymentWithFees(_tokenAddress, _to, _amount, _feeAmount, _feeAddress);
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
    LibPayment.makeNativePayment(_to);
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
    LibPayment.makeExactNativePaymentWithFees(_to, msg.value - _feeAmount, _feeAmount, _feeAddress);
    emit NativeTransferWithFees(
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
    LibPayment.makeExactNativePaymentWithFees(_to, _amount, _feeAmount, _feeAddress);
    emit NativeTransferWithFees(_to, _amount, _paymentReference, _feeAmount, _feeAddress);
  }
}
