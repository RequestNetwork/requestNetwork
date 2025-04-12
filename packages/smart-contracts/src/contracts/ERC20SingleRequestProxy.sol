// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/ERC20FeeProxy.sol';
import './lib/SafeERC20.sol';

/**
 * @title ERC20SingleRequestProxy
 * @notice This contract is used to send a single request to a payee with a fee sent to a third address for ERC20
 */

contract ERC20SingleRequestProxy {
  address public payee;
  address public tokenAddress;
  bytes public paymentReference;
  address public feeAddress;
  uint256 public feeAmount;
  IERC20FeeProxy public erc20FeeProxy;

  constructor(
    address _payee,
    address _tokenAddress,
    bytes memory _paymentReference,
    address _feeAddress,
    uint256 _feeAmount,
    address _erc20FeeProxy
  ) {
    payee = _payee;
    tokenAddress = _tokenAddress;
    paymentReference = _paymentReference;
    feeAddress = _feeAddress;
    feeAmount = _feeAmount;
    erc20FeeProxy = IERC20FeeProxy(_erc20FeeProxy);
  }

  receive() external payable {
    require(msg.value == 0, 'This function is only for triggering the transfer');
    _processPayment();
  }

  function triggerERC20Payment() external {
    _processPayment();
  }

  function _processPayment() internal {
    IERC20 token = IERC20(tokenAddress);
    uint256 balance = token.balanceOf(address(this));
    uint256 paymentAmount = balance;
    if (feeAmount > 0 && feeAddress != address(0)) {
      require(balance > feeAmount, 'Insufficient balance to cover fee');
      paymentAmount = balance - feeAmount;
    }

    require(SafeERC20.safeApprove(token, address(erc20FeeProxy), balance), 'Approval failed');

    erc20FeeProxy.transferFromWithReferenceAndFee(
      tokenAddress,
      payee,
      paymentAmount,
      paymentReference,
      feeAmount,
      feeAddress
    );
  }

  /**
   * @notice Rescues any trapped funds by sending them to the payee
   * @dev Can be called by anyone, but funds are always sent to the payee
   */
  function rescueERC20Funds(address _tokenAddress) external {
    require(_tokenAddress != address(0), 'Invalid token address');
    IERC20 token = IERC20(_tokenAddress);
    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, 'No funds to rescue');
    bool success = SafeERC20.safeTransfer(token, payee, balance);
    require(success, 'ERC20 rescue failed');
  }

  /**
   * @notice Rescues any trapped funds by sending them to the payee
   * @dev Can be called by anyone, but funds are always sent to the payee
   */
  function rescueNativeFunds() external {
    uint256 balance = address(this).balance;
    require(balance > 0, 'No funds to rescue');

    (bool success, ) = payable(payee).call{value: balance}('');
    require(success, 'Rescue failed');
  }
}
