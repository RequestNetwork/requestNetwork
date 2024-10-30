// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockEthereumFeeProxy {
  function transferWithReferenceAndFee(
    address payable _to,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address payable _feeAddress
  ) external payable {
    // Do nothing, just accept the funds
  }

  function sendFundsBack(address payable _to, uint256 _amount) external {
    (bool success, ) = _to.call{value: _amount}('');
    require(success, 'Failed to send funds back');
  }

  receive() external payable {}
}
