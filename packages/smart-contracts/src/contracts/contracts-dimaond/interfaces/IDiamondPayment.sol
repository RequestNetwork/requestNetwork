// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface of the DiamondPaymentFacet

interface IDiamondPayment {
  // Event to declare an ERC20 payment
  event TokenTransfer(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference
  );

  // Event to declare an ERC20 payment with fees
  event TokenTransferWithFees(
    address tokenAddress,
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  // Event to declare a native crypto transfer
  event NativeTransfer(address to, uint256 amount, bytes indexed paymentReference);

  // Event to declare a native crypto transfer with fees
  event NativeTransferWithFees(
    address to,
    uint256 amount,
    bytes indexed paymentReference,
    uint256 feeAmount,
    address feeAddress
  );

  /**
   * @notice Performs a ERC20 token transfer with a reference
   * @param _tokenAddress Address of the ERC20 token smart contract
   * @param _to Transfer recipient
   * @param _amount Amount to transfer
   * @param _paymentReference Reference of the payment related
   */
  function tokenTransfer(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference
  ) external;

  /**
    * @notice Performs a ERC20 token transfer with a reference
              and a transfer to a second address for the payment of a fee
    * @param _tokenAddress Address of the ERC20 token smart contract
    * @param _to Transfer recipient
    * @param _amount Amount to transfer
    * @param _paymentReference Reference of the payment related
    * @param _feeAmount The amount of the payment fee
    * @param _feeAddress The fee recipient
    */
  function tokenTransferWithFees(
    address _tokenAddress,
    address _to,
    uint256 _amount,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address _feeAddress
  ) external;

  /**
   * @notice Performs an Ethereum transfer with a reference
   * @param _to Transfer recipient
   * @param _paymentReference Reference of the payment related
   */
  function nativeTransfer(address _to, bytes calldata _paymentReference) external payable;

  /**
   * @notice Performs an Ethereum transfer with a reference
   * @param _to Transfer recipient
   * @param _paymentReference Reference of the payment related
   * @param _feeAmount The amount of the payment fee (part of the msg.value)
   * @param _feeAddress The fee recipient
   */
  function nativeTransferWithFees(
    address payable _to,
    bytes calldata _paymentReference,
    uint256 _feeAmount,
    address payable _feeAddress
  ) external payable;
}
