// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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
 *      This contract emits no events. Index TransferWithReferenceAndFee on ERC20FeeProxy
 *      with msg.sender == address(this batch contract).
 *      The proxy receives a one-time max allowance per token.
 */
contract ERC20BatchPayments {
  using SafeERC20 for IERC20;

  IERC20FeeProxy public immutable paymentErc20FeeProxy;

  /// @dev True after unlimited proxy approval was set for a token (avoids repeated approve calls).
  mapping(address => bool) private _proxyApproved;

  struct Token {
    address tokenAddress;
    uint256 amountAndFee;
  }

  /**
   * @param _paymentErc20FeeProxy The address of the ERC20FeeProxy to use.
   */
  constructor(address _paymentErc20FeeProxy) {
    require(_paymentErc20FeeProxy != address(0), 'ERC20BatchPayments: paymentErc20FeeProxy cannot be 0x');
    paymentErc20FeeProxy = IERC20FeeProxy(_paymentErc20FeeProxy);
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
    require(_tokenAddress != address(0), 'ERC20BatchPayments: token cannot be 0x');

    uint256 amountAndFee = 0;
    for (uint256 i = 0; i < _recipients.length; ) {
      amountAndFee += _amounts[i] + _feeAmounts[i];
      unchecked {
        ++i;
      }
    }

    if (amountAndFee > 0) {
      _transferToContractAndApproveProxy(IERC20(_tokenAddress), amountAndFee);
    }

    for (uint256 i = 0; i < _recipients.length; ) {
      uint256 paymentSum = _amounts[i] + _feeAmounts[i];
      if (paymentSum == 0) {
        unchecked {
          ++i;
        }
        continue;
      }
      require(_recipients[i] != address(0), 'ERC20BatchPayments: recipient cannot be 0x');
      if (_feeAmounts[i] > 0) {
        require(_feeAddress != address(0), 'ERC20BatchPayments: feeAddress cannot be 0x when fee > 0');
      }
      paymentErc20FeeProxy.transferFromWithReferenceAndFee(
        _tokenAddress,
        _recipients[i],
        _amounts[i],
        _paymentReferences[i],
        _feeAmounts[i],
        _feeAddress
      );
      unchecked {
        ++i;
      }
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
    for (uint256 i = 0; i < _tokenAddresses.length; ) {
      require(_tokenAddresses[i] != address(0), 'ERC20BatchPayments: token cannot be 0x');
      for (uint256 j = 0; j < _tokenAddresses.length; ) {
        if (uniqueTokens[j].tokenAddress == _tokenAddresses[i]) {
          uniqueTokens[j].amountAndFee += _amounts[i] + _feeAmounts[i];
          break;
        }
        if (uniqueTokens[j].amountAndFee == 0 && (_amounts[i] + _feeAmounts[i]) > 0) {
          uniqueTokens[j].tokenAddress = _tokenAddresses[i];
          uniqueTokens[j].amountAndFee = _amounts[i] + _feeAmounts[i];
          break;
        }
        unchecked {
          ++j;
        }
      }
      unchecked {
        ++i;
      }
    }

    for (uint256 i = 0; i < uniqueTokens.length && uniqueTokens[i].amountAndFee > 0; ) {
      _transferToContractAndApproveProxy(
        IERC20(uniqueTokens[i].tokenAddress),
        uniqueTokens[i].amountAndFee
      );
      unchecked {
        ++i;
      }
    }

    for (uint256 i = 0; i < _recipients.length; ) {
      uint256 paymentSum = _amounts[i] + _feeAmounts[i];
      if (paymentSum == 0) {
        unchecked {
          ++i;
        }
        continue;
      }
      require(_recipients[i] != address(0), 'ERC20BatchPayments: recipient cannot be 0x');
      if (_feeAmounts[i] > 0) {
        require(_feeAddress != address(0), 'ERC20BatchPayments: feeAddress cannot be 0x when fee > 0');
      }
      paymentErc20FeeProxy.transferFromWithReferenceAndFee(
        _tokenAddresses[i],
        _recipients[i],
        _amounts[i],
        _paymentReferences[i],
        _feeAmounts[i],
        _feeAddress
      );
      unchecked {
        ++i;
      }
    }
  }

  /**
   * @notice Pulls tokens from the payer to this contract and approves the proxy to spend them.
   * @dev Approves the proxy once per token with max allowance; later batches skip approve.
   * @param requestedToken The token to pay.
   * @param amountAndFee The sum of payment amounts and fees for this token.
   */
  function _transferToContractAndApproveProxy(
    IERC20 requestedToken,
    uint256 amountAndFee
  ) internal {
    require(
      requestedToken.safeTransferFrom(msg.sender, address(this), amountAndFee),
      'payment transferFrom() failed'
    );

    address token = address(requestedToken);
    if (!_proxyApproved[token]) {
      require(
        requestedToken.safeApprove(address(paymentErc20FeeProxy), type(uint256).max),
        'approve() failed'
      );
      _proxyApproved[token] = true;
    }
  }
}
