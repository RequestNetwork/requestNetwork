// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import './ERC20SingleRequestProxy.sol';
import './EthereumSingleRequestProxy.sol';

/**
 * @title SingleRequestProxyFactory
 * @notice This contract is used to create SingleRequestProxy instances
 */
contract SingleRequestProxyFactory is Ownable {
  /// @notice The address of the EthereumFeeProxy contract
  /// @dev This proxy is used for handling Ethereum-based fee transactions
  address public ethereumFeeProxy;

  /// @notice The address of the ERC20FeeProxy contract
  /// @dev This proxy is used for handling ERC20-based fee transactions
  address public erc20FeeProxy;

  event EthereumSingleRequestProxyCreated(
    address indexed proxyAddress,
    address indexed payee,
    bytes indexed paymentReference
  );

  event ERC20SingleRequestProxyCreated(
    address indexed proxyAddress,
    address indexed payee,
    address tokenAddress,
    bytes indexed paymentReference
  );

  event ERC20FeeProxyUpdated(address indexed newERC20FeeProxy);
  event EthereumFeeProxyUpdated(address indexed newEthereumFeeProxy);

  constructor(address _ethereumFeeProxy, address _erc20FeeProxy) {
    require(_ethereumFeeProxy != address(0), 'EthereumFeeProxy address cannot be zero');
    require(_erc20FeeProxy != address(0), 'ERC20FeeProxy address cannot be zero');
    ethereumFeeProxy = _ethereumFeeProxy;
    erc20FeeProxy = _erc20FeeProxy;
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
    emit EthereumSingleRequestProxyCreated(address(proxy), _payee, _paymentReference);
    return address(proxy);
  }

  /**
   * @notice Creates a new ERC20SingleRequestProxy instance
   * @param _payee The address of the payee
   * @param _tokenAddress The address of the token
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

    emit ERC20SingleRequestProxyCreated(address(proxy), _payee, _tokenAddress, _paymentReference);
    return address(proxy);
  }

  /**
   * @notice Updates the ERC20FeeProxy address
   * @param _newERC20FeeProxy The new ERC20FeeProxy address
   */
  function setERC20FeeProxy(address _newERC20FeeProxy) external onlyOwner {
    require(_newERC20FeeProxy != address(0), 'ERC20FeeProxy address cannot be zero');
    erc20FeeProxy = _newERC20FeeProxy;
    emit ERC20FeeProxyUpdated(_newERC20FeeProxy);
  }

  /**
   * @notice Updates the EthereumFeeProxy address
   * @param _newEthereumFeeProxy The new EthereumFeeProxy address
   */
  function setEthereumFeeProxy(address _newEthereumFeeProxy) external onlyOwner {
    require(_newEthereumFeeProxy != address(0), 'EthereumFeeProxy address cannot be zero');
    ethereumFeeProxy = _newEthereumFeeProxy;
    emit EthereumFeeProxyUpdated(_newEthereumFeeProxy);
  }
}
