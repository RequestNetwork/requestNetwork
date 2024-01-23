// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from './LibDiamond.sol';
import {LibSafeERC20} from './LibSafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

library LibPayment {
  using LibSafeERC20 for IERC20;

  /**
   * @notice Performs a ERC20 token transfer with a reference
   * @param _tokenAddress Address of the ERC20 token smart contract
   * @param _to Transfer recipient
   * @param _amount Amount to transfer
   */
  function makeTokenTransfer(
    address _tokenAddress,
    address _to,
    uint256 _amount
  ) internal {
    require(
      IERC20(_tokenAddress).safeTransferFrom(msg.sender, _to, _amount),
      'TokenTransfer failed: transferFrom() failed'
    );
  }

  function makeTokenPaymentWithFees(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    uint256 _feeAmount,
    address _feeAddress
  ) internal {
    require(
      IERC20(_tokenAddress).safeTransferFrom(msg.sender, _to, _amount),
      'TokenTransferWithFees failed: transferFrom() failed (payment)'
    );
    if (_feeAmount > 0 && _feeAddress != address(0)) {
      require(
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, _feeAddress, _feeAmount),
        'TokenTransferWithFees failed: transferFrom() failed (fees)'
      );
    }
  }

  function makeTokenPaymentWithConversion(
    address _to,
    uint256 _requestAmount,
    address[] memory _path,
    bytes memory _paymentReference,
    uint256 _feeAmount,
    address _feeAddress,
    uint256 _maxToSpend,
    uint256 _maxRateTimespan
  ) internal returns (bool success) {
    // Use the DiamondPaymentConversionFacet payment method
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    bytes4 paymentMethodSelector = bytes4(
      keccak256(
        'tokenTransferWithConversion(address,uint256,address[],bytes,uint256,address,uint256,uint256)'
      )
    );
    address paymentFacet = address(bytes20(ds.facets[paymentMethodSelector]));
    bytes memory paymentCall = abi.encodeWithSelector(
      paymentMethodSelector,
      _to,
      _requestAmount,
      _path,
      _paymentReference,
      _feeAmount,
      _feeAddress,
      _maxToSpend, // _maxToSpend
      _maxRateTimespan
    );
    (success, ) = address(paymentFacet).delegatecall(paymentCall);
  }

  function makeNativePayment(address _to) internal {
    (bool success, ) = _to.call{value: msg.value}('');
    require(success, 'NativeTransfer failed: could not pay the recipient');
  }

  /**
   * @notice Internal method to perform an Ethereum transfer with an exact amount of eth
   * @param _to Transfer recipient
   * @param _amount Amount to transfer
   * @param _feeAmount The amount of the payment fee (part of the msg.value)
   * @param _feeAddress The fee recipient
   */
  function makeExactNativePaymentWithFees(
    address payable _to,
    uint256 _amount,
    uint256 _feeAmount,
    address payable _feeAddress
  ) internal {
    (bool sendSuccess, ) = _to.call{value: _amount}('');
    require(sendSuccess, 'NativeTransferWithFees failed: could not pay the recipient');

    (bool feeSendSuccess, ) = _feeAddress.call{value: _feeAmount}('');
    require(feeSendSuccess, 'NativeTransferWithFees failed: Could not pay the fee recipient');

    // transfer the remaining ethers to the sender
    (bool sendBackSuccess, ) = payable(msg.sender).call{value: msg.value - _amount - _feeAmount}(
      ''
    );
    require(
      sendBackSuccess,
      'NativeTransferWithFees failed: Could not send remaining funds to the payer'
    );
  }
}
