// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import '@openzeppelin/contracts/access/Ownable.sol';
import './ERC20SingleRequestProxy.sol';

/**
 * @title ERC20SingleRequestProxyFactory
 * @notice This contract is used to create ERC20SingleRequestProxy instances
 */
contract ERC20SingleRequestProxyFactory is Ownable {
  address public erc20FeeProxy;

  event ERC20SingleRequestProxyCreated(
    address indexed proxyAddress,
    address indexed payee,
    bytes indexed paymentReference
  );

  constructor(address _erc20FeeProxy) {
    erc20FeeProxy = _erc20FeeProxy;
  }

  /**
   * @notice Creates a new ERC20SingleRequestProxy instance
   * @param _payee The address of the payee
   * @param _paymentReference The payment reference
   * @param _feeAddress The address of the fee recipient
   * @param _feeAmount The fee amount
   * @return The address of the newly created proxy
   */
  function createERC20SingleRequestProxy(
    address _payee,
    address _tokenAddress,
    bytes memory _paymentReference,
    address _feeAddress,
    uint256 _feeAmount
  ) external returns (address) {
    ERC20SingleRequestProxy proxy = new ERC20SingleRequestProxy(
      _payee,
      _tokenAddress,
      _feeAddress,
      _feeAmount,
      _paymentReference,
      erc20FeeProxy
    );

    emit ERC20SingleRequestProxyCreated(address(proxy), _payee, _paymentReference);
    return address(proxy);
  }

  /**
   * @notice Updates the ERC20FeeProxy address
   * @param _newERC20FeeProxy The new ERC20FeeProxy address
   */
  function setERC20FeeProxy(address _newERC20FeeProxy) external onlyOwner {
    erc20FeeProxy = _newERC20FeeProxy;
  }
}
