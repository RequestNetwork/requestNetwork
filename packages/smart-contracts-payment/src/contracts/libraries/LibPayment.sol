// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {LibDiamond} from '../libraries/LibDiamond.sol';

library LibPayment {
  /**
   * @notice Call transferFrom ERC20 function and validates the return data of a ERC20 contract call.
   * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
   * @return result The return value of the ERC20 call, returning true for non-standard tokens
   */
  function safeTransferFrom(
    address _tokenAddress,
    address _to,
    uint256 _amount
  ) internal returns (bool result) {
    /* solium-disable security/no-inline-assembly */
    // check if the address is a contract
    assembly {
      if iszero(extcodesize(_tokenAddress)) {
        revert(0, 0)
      }
    }

    // solium-disable-next-line security/no-low-level-calls
    (bool success, ) = _tokenAddress.call(
      abi.encodeWithSignature('transferFrom(address,address,uint256)', msg.sender, _to, _amount)
    );

    assembly {
      switch returndatasize()
      case 0 {
        // not a standard erc20
        result := 1
      }
      case 32 {
        // standard erc20
        returndatacopy(0, 0, 32)
        result := mload(0)
      }
      default {
        // anything else, should revert for safety
        revert(0, 0)
      }
    }

    require(success, 'transferFrom() has been reverted');

    /* solium-enable security/no-inline-assembly */
    return result;
  }

  function makeTokenPayment(
    address _to,
    address _token,
    bytes calldata _paymentReference,
    uint256 _amountToPay,
    address _feeAddress,
    uint256 _feeAmountToPay
  ) internal returns (bool success) {
    // Use the DiamondPaymentFacet payment method
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    bytes4 paymentMethodSelector = bytes4(
      keccak256('tokenTransferWithFees(address,address,uint256,bytes,uint256,address)')
    );
    address paymentFacet = address(bytes20(ds.facets[paymentMethodSelector]));
    bytes memory paymentCall = abi.encodeWithSelector(
      paymentMethodSelector,
      _token,
      _to,
      _amountToPay,
      _paymentReference,
      _feeAmountToPay,
      _feeAddress
    );
    (success, ) = address(paymentFacet).delegatecall(paymentCall);
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

  function makeNativePayment(
    address _to,
    uint256 _amountToPay,
    bytes calldata _paymentReference,
    uint256 _amountToPayInFees,
    address _feeAddress
  ) internal returns (bool success) {
    // Use the DiamondPaymentFacet payment method
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    bytes4 paymentMethodSelector = bytes4(
      keccak256('exactNativeTransferWithFees(address,uint256,bytes,uint256,address)')
    );
    address paymentFacet = address(bytes20(ds.facets[paymentMethodSelector]));
    bytes memory paymentCall = abi.encodeWithSelector(
      paymentMethodSelector,
      _to,
      _amountToPay,
      _paymentReference,
      _amountToPayInFees,
      _feeAddress
    );
    (success, ) = address(paymentFacet).delegatecall(paymentCall);
  }
}
