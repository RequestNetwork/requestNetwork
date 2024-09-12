// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/ERC20FeeProxy.sol';

/**
 * @title ERC20SingleRequestProxy
 * @notice This contract is used to send a single request to a payee with a fee sent to a third address for ERC20
 */

contract ERC20SingleRequestProxy {
  address public payee;
  address public tokenAddress;
  address public feeAddress;
  uint256 public feeAmount;
  bytes public paymentReference;
  IERC20FeeProxy public erc20FeeProxy;

  constructor(
    address _payee,
    address _tokenAddress,
    address _feeAddress,
    uint256 _feeAmount,
    bytes memory _paymentReference,
    address _erc20FeeProxy
  ) {
    payee = _payee;
    tokenAddress = _tokenAddress;
    feeAddress = _feeAddress;
    feeAmount = _feeAmount;
    paymentReference = _paymentReference;
    erc20FeeProxy = IERC20FeeProxy(_erc20FeeProxy);
  }

  receive() external payable {
    require(msg.value == 0, 'This function is only for triggering the transfer');
    IERC20 token = IERC20(tokenAddress);
    uint256 balance = token.balanceOf(address(this));

    token.approve(address(erc20FeeProxy), balance);

    erc20FeeProxy.transferFromWithReferenceAndFee(
      tokenAddress,
      payee,
      transferAmount,
      paymentReference,
      feeAmount,
      feeAddress
    );
  }
}
