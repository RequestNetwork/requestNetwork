// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './interfaces/ERC20FeeProxy.sol';
import './lib/SafeERC20.sol';

/**
 * @title ERC20BatchPayments
 * @notice Tron-only batch contract that routes each payment through ERC20FeeProxy.
 *         If one payment fails, the whole batch reverts.
 * @dev Uses ERC20FeeProxy to pay an invoice and fees, with a payment reference.
 *      Make sure this contract has allowance to spend the payer's tokens.
 *      Make sure the payer has enough tokens to pay the amounts and fees.
 */
contract ERC20BatchPayments is Ownable {
  using SafeERC20 for IERC20;

  IERC20FeeProxy public paymentErc20FeeProxy;

  struct Token {
    address tokenAddress;
    uint256 amountAndFee;
  }

  /**
   * @param _paymentErc20FeeProxy The address of the ERC20FeeProxy to use.
   * @param _owner Owner of the contract.
   */
  constructor(address _paymentErc20FeeProxy, address _owner) {
    paymentErc20FeeProxy = IERC20FeeProxy(_paymentErc20FeeProxy);
    transferOwnership(_owner);
  }

  /**
   * @notice Send a batch of ERC20 payments with fees and payment references to multiple accounts.
   * @param _tokenAddress Token to transact with.
   * @param _recipients List of recipient accounts.
   * @param _amounts List of amounts, corresponding to recipients[].
   * @param _paymentReferences List of payment references, corresponding to recipients[].
   * @param _feeAmounts List of fee amounts, corresponding to recipients[].
   * @param _feeAddress The fee recipient.
   */
  function batchERC20PaymentsWithReference(
    address _tokenAddress,
    address[] calldata _recipients,
    uint256[] calldata _amounts,
    bytes[] calldata _paymentReferences,
    uint256[] calldata _feeAmounts,
    address _feeAddress
  ) external {
    require(
      _recipients.length == _amounts.length &&
        _recipients.length == _paymentReferences.length &&
        _recipients.length == _feeAmounts.length,
      'the input arrays must have the same length'
    );

    uint256 amountAndFee = 0;
    for (uint256 i = 0; i < _recipients.length; i++) {
      amountAndFee += _amounts[i] + _feeAmounts[i];
    }

    _transferToContractAndApproveProxy(IERC20(_tokenAddress), amountAndFee);

    for (uint256 i = 0; i < _recipients.length; i++) {
      paymentErc20FeeProxy.transferFromWithReferenceAndFee(
        _tokenAddress,
        _recipients[i],
        _amounts[i],
        _paymentReferences[i],
        _feeAmounts[i],
        _feeAddress
      );
    }
  }

  /**
   * @notice Send a batch of ERC20 payments on multiple tokens with fees and payment references.
   * @param _tokenAddresses List of tokens to transact with.
   * @param _recipients List of recipient accounts.
   * @param _amounts List of amounts, corresponding to recipients[].
   * @param _paymentReferences List of payment references, corresponding to recipients[].
   * @param _feeAmounts List of fee amounts, corresponding to recipients[].
   * @param _feeAddress The fee recipient.
   */
  function batchERC20PaymentsMultiTokensWithReference(
    address[] calldata _tokenAddresses,
    address[] calldata _recipients,
    uint256[] calldata _amounts,
    bytes[] calldata _paymentReferences,
    uint256[] calldata _feeAmounts,
    address _feeAddress
  ) external {
    require(
      _tokenAddresses.length == _recipients.length &&
        _tokenAddresses.length == _amounts.length &&
        _tokenAddresses.length == _paymentReferences.length &&
        _tokenAddresses.length == _feeAmounts.length,
      'the input arrays must have the same length'
    );

    Token[] memory uniqueTokens = new Token[](_tokenAddresses.length);
    for (uint256 i = 0; i < _tokenAddresses.length; i++) {
      for (uint256 j = 0; j < _tokenAddresses.length; j++) {
        if (uniqueTokens[j].tokenAddress == _tokenAddresses[i]) {
          uniqueTokens[j].amountAndFee += _amounts[i] + _feeAmounts[i];
          break;
        }
        if (uniqueTokens[j].amountAndFee == 0 && (_amounts[i] + _feeAmounts[i]) > 0) {
          uniqueTokens[j].tokenAddress = _tokenAddresses[i];
          uniqueTokens[j].amountAndFee = _amounts[i] + _feeAmounts[i];
          break;
        }
      }
    }

    for (uint256 i = 0; i < uniqueTokens.length && uniqueTokens[i].amountAndFee > 0; i++) {
      _transferToContractAndApproveProxy(
        IERC20(uniqueTokens[i].tokenAddress),
        uniqueTokens[i].amountAndFee
      );
    }

    for (uint256 i = 0; i < _recipients.length; i++) {
      paymentErc20FeeProxy.transferFromWithReferenceAndFee(
        _tokenAddresses[i],
        _recipients[i],
        _amounts[i],
        _paymentReferences[i],
        _feeAmounts[i],
        _feeAddress
      );
    }
  }

  /**
   * @notice Authorizes the proxy to spend a request currency (ERC20).
   * @param _erc20Address Address of an ERC20 used as the request currency.
   */
  function approvePaymentProxyToSpend(address _erc20Address) public {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = type(uint256).max;
    require(erc20.safeApprove(address(paymentErc20FeeProxy), max), 'approve() failed');
  }

  /**
   * @notice Updates the ERC20FeeProxy address.
   * @param _paymentErc20FeeProxy The address of the ERC20FeeProxy to use.
   */
  function setPaymentErc20FeeProxy(address _paymentErc20FeeProxy) public onlyOwner {
    paymentErc20FeeProxy = IERC20FeeProxy(_paymentErc20FeeProxy);
  }

  /**
   * @notice Pulls tokens from the payer to this contract and approves the proxy to spend them.
   * @param requestedToken The token to pay.
   * @param amountAndFee The sum of payment amounts and fees for this token.
   */
  function _transferToContractAndApproveProxy(
    IERC20 requestedToken,
    uint256 amountAndFee
  ) internal {
    require(
      requestedToken.allowance(msg.sender, address(this)) >= amountAndFee,
      'Not sufficient allowance for batch to pay'
    );
    require(requestedToken.balanceOf(msg.sender) >= amountAndFee, 'not enough funds');
    require(
      requestedToken.safeTransferFrom(msg.sender, address(this), amountAndFee),
      'payment transferFrom() failed'
    );

    if (requestedToken.allowance(address(this), address(paymentErc20FeeProxy)) < amountAndFee) {
      approvePaymentProxyToSpend(address(requestedToken));
    }
  }
}
