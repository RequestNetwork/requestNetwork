// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './lib/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ERC20FeeProxy.sol';
import './interfaces/EthereumFeeProxy.sol';

/**
 * @title BatchPaymentsPublic
 * @notice  This contract makes multiple payments with references, in one transaction:
 *          - on: ERC20 Payment Proxy and ETH Payment Proxy of the Request Network protocol
 *          - to: multiple addresses
 *          - fees: ERC20 and ETH proxies fees are paid to the same address.
 *                  An additional batch fee is paid to the same address.
 *         If one transaction of the batch fail, every transactions are reverted.
 * @dev It is a clone of BatchPayment.sol, with three main modifications:
 *         - function "receive" is not implemented
 *         - fees are now divided by 10_000 instead of 1_000 in previous version
 *         - batch payment functions are now public, instead of external
 */
contract BatchPaymentsPublic is Ownable {
  using SafeERC20 for IERC20;

  IERC20FeeProxy public paymentErc20Proxy;
  IEthereumFeeProxy public paymentEthProxy;

  uint256 public batchFee;
  // payerAuthorized is set to true only when needed for batch Eth conversion
  bool internal payerAuthorized;

  struct Token {
    address tokenAddress;
    uint256 amountAndFee;
    uint256 batchFeeAmount;
  }

  /**
   * @param _paymentErc20Proxy The address to the ERC20 fee payment proxy to use.
   * @param _paymentEthProxy The address to the Ethereum fee payment proxy to use.
   * @param _owner Owner of the contract.
   */
  constructor(
    address _paymentErc20Proxy,
    address _paymentEthProxy,
    address _owner
  ) {
    paymentErc20Proxy = IERC20FeeProxy(_paymentErc20Proxy);
    paymentEthProxy = IEthereumFeeProxy(_paymentEthProxy);
    transferOwnership(_owner);
    batchFee = 0;
  }

  /**
   * This contract is non-payable. Making an ETH payment with conversion requires the contract to accept incoming ETH.
   * See the end of `batchRouter` where the leftover is given back to the transaction sender.
   */
  receive() external payable {
    require(payerAuthorized || msg.value == 0, 'Non-payable');
  }

  /**
   * @notice Send a batch of ETH (or EVM native token) payments with fees and paymentReferences to multiple accounts.
   *         If one payment fails, the whole batch reverts.
   * @param _recipients List of recipient accounts.
   * @param _amounts List of amounts, matching recipients[].
   * @param _paymentReferences List of paymentRefs, matching recipients[].
   * @param _feeAmounts List fee amounts, matching recipients[].
   * @param _feeAddress The fee recipient.
   * @dev It uses EthereumFeeProxy to pay an invoice and fees with a payment reference.
   *      Make sure: msg.value >= sum(_amouts)+sum(_feeAmounts)+sumBatchFeeAmount
   */
  function batchEthPaymentsWithReference(
    address[] calldata _recipients,
    uint256[] calldata _amounts,
    bytes[] calldata _paymentReferences,
    uint256[] calldata _feeAmounts,
    address payable _feeAddress
  ) public payable {
    require(
      _recipients.length == _amounts.length &&
        _recipients.length == _paymentReferences.length &&
        _recipients.length == _feeAmounts.length,
      'the input arrays must have the same length'
    );

    // amount is used to get the total amount and then used as batch fee amount
    uint256 amount = 0;

    // Batch contract pays the requests thourgh EthFeeProxy
    for (uint256 i = 0; i < _recipients.length; i++) {
      require(address(this).balance >= _amounts[i] + _feeAmounts[i], 'not enough funds');
      amount += _amounts[i];

      paymentEthProxy.transferWithReferenceAndFee{value: _amounts[i] + _feeAmounts[i]}(
        payable(_recipients[i]),
        _paymentReferences[i],
        _feeAmounts[i],
        payable(_feeAddress)
      );
    }

    // amount is updated into batch fee amount
    amount = (amount * batchFee) / 10000;
    // Check that batch contract has enough funds to pay batch fee
    require(address(this).balance >= amount, 'not enough funds for batch fee');
    // Batch pays batch fee
    _feeAddress.transfer(amount);

    // Batch contract transfers the remaining ethers to the payer
    if (address(this).balance > 0) {
      (bool sendBackSuccess, ) = payable(msg.sender).call{value: address(this).balance}('');
      require(sendBackSuccess, 'Could not send remaining funds to the payer');
    }
  }

  /**
   * @notice Send a batch of ERC20 payments with fees and paymentReferences to multiple accounts.
   * @param _tokenAddress Token used for all the payments.
   * @param _recipients List of recipient accounts.
   * @param _amounts List of amounts, matching recipients[].
   * @param _paymentReferences List of paymentRefs, matching recipients[].
   * @param _feeAmounts List of payment fee amounts, matching recipients[].
   * @param _feeAddress The fee recipient.
   * @dev Uses ERC20FeeProxy to pay an invoice and fees, with a payment reference.
   *      Make sure this contract has enough allowance to spend the payer's token.
   *      Make sure the payer has enough tokens to pay the amount, the fee, and the batch fee.
   */
  function batchERC20PaymentsWithReference(
    address _tokenAddress,
    address[] calldata _recipients,
    uint256[] calldata _amounts,
    bytes[] calldata _paymentReferences,
    uint256[] calldata _feeAmounts,
    address _feeAddress
  ) public {
    require(
      _recipients.length == _amounts.length &&
        _recipients.length == _paymentReferences.length &&
        _recipients.length == _feeAmounts.length,
      'the input arrays must have the same length'
    );

    // amount is used to get the total amount and fee, and then used as batch fee amount
    uint256 amount = 0;
    for (uint256 i = 0; i < _recipients.length; i++) {
      amount += _amounts[i] + _feeAmounts[i];
    }

    // Transfer the amount and fee from the payer to the batch contract
    IERC20 requestedToken = IERC20(_tokenAddress);
    require(
      requestedToken.allowance(msg.sender, address(this)) >= amount,
      'Insufficient allowance for batch to pay'
    );
    require(requestedToken.balanceOf(msg.sender) >= amount, 'not enough funds');
    require(
      safeTransferFrom(_tokenAddress, address(this), amount),
      'payment transferFrom() failed'
    );

    // Batch contract approve Erc20FeeProxy to spend the token
    if (requestedToken.allowance(address(this), address(paymentErc20Proxy)) < amount) {
      approvePaymentProxyToSpend(address(requestedToken), address(paymentErc20Proxy));
    }

    // Batch contract pays the requests using Erc20FeeProxy
    for (uint256 i = 0; i < _recipients.length; i++) {
      // amount is updated to become the sum of amounts, to calculate batch fee amount
      amount -= _feeAmounts[i];
      paymentErc20Proxy.transferFromWithReferenceAndFee(
        _tokenAddress,
        _recipients[i],
        _amounts[i],
        _paymentReferences[i],
        _feeAmounts[i],
        _feeAddress
      );
    }

    // amount is updated into batch fee amount
    amount = (amount * batchFee) / 10000;
    // Check if the payer has enough funds to pay batch fee
    require(requestedToken.balanceOf(msg.sender) >= amount, 'not enough funds for the batch fee');

    // Payer pays batch fee amount
    require(
      safeTransferFrom(_tokenAddress, _feeAddress, amount),
      'batch fee transferFrom() failed'
    );
  }

  /**
   * @notice Send a batch of ERC20 payments with fees and paymentReferences to multiple accounts, with multiple tokens.
   * @param _tokenAddresses List of tokens to transact with.
   * @param _recipients List of recipient accounts.
   * @param _amounts List of amounts, matching recipients[].
   * @param _paymentReferences List of paymentRefs, matching recipients[].
   * @param _feeAmounts List of amounts of the payment fee, matching recipients[].
   * @param _feeAddress The fee recipient.
   * @dev It uses ERC20FeeProxy to pay an invoice and fees, with a payment reference.
   *      Make sure this contract has enough allowance to spend the payer's token.
   *      Make sure the payer has enough tokens to pay the amount, the fee, and the batch fee.
   */
  function batchERC20PaymentsMultiTokensWithReference(
    address[] calldata _tokenAddresses,
    address[] calldata _recipients,
    uint256[] calldata _amounts,
    bytes[] calldata _paymentReferences,
    uint256[] calldata _feeAmounts,
    address _feeAddress
  ) public {
    require(
      _tokenAddresses.length == _recipients.length &&
        _tokenAddresses.length == _amounts.length &&
        _tokenAddresses.length == _paymentReferences.length &&
        _tokenAddresses.length == _feeAmounts.length,
      'the input arrays must have the same length'
    );

    // Create a list of unique tokens used and the amounts associated
    // Only considere tokens having: amounts + feeAmounts > 0
    // batchFeeAmount is the amount's sum, and then, batch fee rate is applied
    Token[] memory uTokens = new Token[](_tokenAddresses.length);
    for (uint256 i = 0; i < _tokenAddresses.length; i++) {
      for (uint256 j = 0; j < _tokenAddresses.length; j++) {
        // If the token is already in the existing uTokens list
        if (uTokens[j].tokenAddress == _tokenAddresses[i]) {
          uTokens[j].amountAndFee += _amounts[i] + _feeAmounts[i];
          uTokens[j].batchFeeAmount += _amounts[i];
          break;
        }
        // If the token is not in the list (amountAndFee = 0), and amount + fee > 0
        if (uTokens[j].amountAndFee == 0 && (_amounts[i] + _feeAmounts[i]) > 0) {
          uTokens[j].tokenAddress = _tokenAddresses[i];
          uTokens[j].amountAndFee = _amounts[i] + _feeAmounts[i];
          uTokens[j].batchFeeAmount = _amounts[i];
          break;
        }
      }
    }

    // The payer transfers tokens to the batch contract and pays batch fee
    for (uint256 i = 0; i < uTokens.length && uTokens[i].amountAndFee > 0; i++) {
      uTokens[i].batchFeeAmount = (uTokens[i].batchFeeAmount * batchFee) / 10000;
      IERC20 requestedToken = IERC20(uTokens[i].tokenAddress);

      require(
        requestedToken.allowance(msg.sender, address(this)) >=
          uTokens[i].amountAndFee + uTokens[i].batchFeeAmount,
        'Not sufficient allowance for batch to pay'
      );
      // check if the payer can pay the amount, the fee, and the batchFee
      require(
        requestedToken.balanceOf(msg.sender) >=
          uTokens[i].amountAndFee + uTokens[i].batchFeeAmount,
        'not enough funds'
      );

      // Transfer only the amount and fee required for the token on the batch contract
      require(
        safeTransferFrom(uTokens[i].tokenAddress, address(this), uTokens[i].amountAndFee),
        'payment transferFrom() failed'
      );

      // Batch contract approves Erc20FeeProxy to spend the token
      if (
        requestedToken.allowance(address(this), address(paymentErc20Proxy)) <
        uTokens[i].amountAndFee
      ) {
        approvePaymentProxyToSpend(address(requestedToken), address(paymentErc20Proxy));
      }

      // Payer pays batch fee amount
      require(
        safeTransferFrom(uTokens[i].tokenAddress, _feeAddress, uTokens[i].batchFeeAmount),
        'batch fee transferFrom() failed'
      );
    }

    // Batch contract pays the requests using Erc20FeeProxy
    for (uint256 i = 0; i < _recipients.length; i++) {
      paymentErc20Proxy.transferFromWithReferenceAndFee(
        _tokenAddresses[i],
        _recipients[i],
        _amounts[i],
        _paymentReferences[i],
        _feeAmounts[i],
        _feeAddress
      );
    }
  }

  /*
   * Helper functions
   */

  /**
   * @notice Authorizes the proxy to spend a new request currency (ERC20).
   * @param _erc20Address Address of an ERC20 used as the request currency.
   * @param _paymentErc20Proxy Address of the proxy.
   */
  function approvePaymentProxyToSpend(address _erc20Address, address _paymentErc20Proxy) internal {
    IERC20 erc20 = IERC20(_erc20Address);
    uint256 max = 2**256 - 1;
    erc20.safeApprove(address(_paymentErc20Proxy), max);
  }

  /**
   * @notice Call transferFrom ERC20 function and validates the return data of a ERC20 contract call.
   * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
   * @return result The return value of the ERC20 call, returning true for non-standard tokens
   */
  function safeTransferFrom(
    address _tokenAddress,
    address _to,
    uint256 _amount
  ) internal returns (bool result) {
    /* solium-disable security/no-inline-assembly */
    // check if the address is a contract
    assembly {
      if iszero(extcodesize(_tokenAddress)) {
        revert(0, 0)
      }
    }

    // solium-disable-next-line security/no-low-level-calls
    (bool success, ) = _tokenAddress.call(
      abi.encodeWithSignature('transferFrom(address,address,uint256)', msg.sender, _to, _amount)
    );

    assembly {
      switch returndatasize()
      case 0 {
        // Not a standard erc20
        result := 1
      }
      case 32 {
        // Standard erc20
        returndatacopy(0, 0, 32)
        result := mload(0)
      }
      default {
        // Anything else, should revert for safety
        revert(0, 0)
      }
    }

    require(success, 'transferFrom() has been reverted');

    /* solium-enable security/no-inline-assembly */
    return result;
  }

  /*
   * Admin functions to edit the proxies address and fees
   */

  /**
   * @notice fees added when using Erc20/Eth batch functions
   * @param _batchFee between 0 and 10000, i.e: batchFee = 50 represent 0.50% of fee
   */
  function setBatchFee(uint256 _batchFee) external onlyOwner {
    batchFee = _batchFee;
  }

  /**
   * @param _paymentErc20Proxy The address to the Erc20 fee payment proxy to use.
   */
  function setPaymentErc20Proxy(address _paymentErc20Proxy) external onlyOwner {
    paymentErc20Proxy = IERC20FeeProxy(_paymentErc20Proxy);
  }

  /**
   * @param _paymentEthProxy The address to the Ethereum fee payment proxy to use.
   */
  function setPaymentEthProxy(address _paymentEthProxy) external onlyOwner {
    paymentEthProxy = IEthereumFeeProxy(_paymentEthProxy);
  }
}
