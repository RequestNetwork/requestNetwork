// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import './interfaces/EthereumFeeProxy.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './lib/SafeERC20.sol';

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

  /**
   * @dev Custom reentrancy guard.
   * Similar to OpenZeppelin's ReentrancyGuard, but allows reentrancy from ethereumFeeProxy.
   * This enables controlled callbacks from ethereumFeeProxy while protecting against other reentrancy attacks.
   */
  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;
  uint256 private _status;

  constructor(
    address _payee,
    bytes memory _paymentReference,
    address _feeAddress,
    uint256 _feeAmount,
    address _ethereumFeeProxy
  ) {
    payee = _payee;
    paymentReference = _paymentReference;
    feeAddress = _feeAddress;
    feeAmount = _feeAmount;
    ethereumFeeProxy = IEthereumFeeProxy(_ethereumFeeProxy);
    _status = _NOT_ENTERED;
  }

  /**
   * @dev Modified nonReentrant guard.
   * Prevents reentrancy except for calls from ethereumFeeProxy.
   */
  modifier nonReentrant() {
    if (msg.sender != address(ethereumFeeProxy)) {
      require(_status != _ENTERED, 'ReentrancyGuard: reentrant call');
      _status = _ENTERED;
    }
    _;
    if (msg.sender != address(ethereumFeeProxy)) {
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

  /**
   * @notice Rescues any trapped funds by sending them to the payee
   * @dev Can be called by anyone, but funds are always sent to the payee
   */
  function rescueNativeFunds() external nonReentrant {
    uint256 balance = address(this).balance;
    require(balance > 0, 'No funds to rescue');

    (bool success, ) = payable(payee).call{value: balance}('');
    require(success, 'Rescue failed');
  }

  /**
   * @notice Rescues any trapped ERC20 funds by sending them to the payee
   * @dev Can be called by anyone, but funds are always sent to the payee
   * @param _tokenAddress The address of the ERC20 token to rescue
   */
  function rescueERC20Funds(address _tokenAddress) external nonReentrant {
    require(_tokenAddress != address(0), 'Invalid token address');
    IERC20 token = IERC20(_tokenAddress);
    uint256 balance = token.balanceOf(address(this));
    require(balance > 0, 'No funds to rescue');
    bool success = SafeERC20.safeTransfer(token, payee, balance);
    require(success, 'Rescue failed');
  }
}
