// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface EthereumFeeProxy {
  event TransferWithReferenceAndFee(
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  function transferFromWithReferenceAndFee(
    address payable _to,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address payable _feeAddress
  )
    external
    payable;
}
