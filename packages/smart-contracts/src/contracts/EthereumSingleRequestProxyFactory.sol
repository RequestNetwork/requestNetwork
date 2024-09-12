// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import '@openzeppelin/contracts/access/Ownable.sol';
import './EthereumSingleRequestProxy.sol';

/**
 * @title EthereumSingleRequestProxyFactory
 * @notice This contract is used to create EthereumSingleRequestProxy instances
 */
contract EthereumSingleRequestProxyFactory is Ownable {
  address public ethereumFeeProxy;

  event EtheruemSingleRequestProxyCreated(
    address indexed proxyAddress,
    address indexed payee,
    bytes indexed paymentReference
  );

  constructor(address _ethereumFeeProxy) {
    ethereumFeeProxy = _ethereumFeeProxy;
  }

  /**
   * @notice Creates a new EthereumSingleRequestProxy instance
   * @param _payee The address of the payee
   * @param _paymentReference The payment reference
   * @param _feeAddress The address of the fee recipient
   * @param _feeAmount The fee amount
   * @return The address of the newly created proxy
   */
  function createEthereumSingleRequestProxy(
    address _payee,
    bytes memory _paymentReference,
    address _feeAddress,
    uint256 _feeAmount
  ) external returns (address) {
    EthereumSingleRequestProxy proxy = new EthereumSingleRequestProxy(
      _payee,
      _paymentReference,
      ethereumFeeProxy,
      _feeAddress,
      _feeAmount
    );
    emit EtheruemSingleRequestProxyCreated(address(proxy), _payee, _paymentReference);
    return address(proxy);
  }

  /**
   * @notice Updates the EthereumFeeProxy address
   * @param _newEthereumFeeProxy The new EthereumFeeProxy address
   */
  function updateEthereumFeeProxy(address _newEthereumFeeProxy) external onlyOwner {
    ethereumFeeProxy = _newEthereumFeeProxy;
  }
}
