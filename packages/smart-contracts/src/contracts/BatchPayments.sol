// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ERC20FeeProxy.sol";
import "./interfaces/EthereumFeeProxy.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/**
 * @title BatchPayments
 * @notice This contract pays multiple paymentrequests in one transaction:
 *          - on: ERC20, Ethereum
 *              - regarding ERC20: on multiple tokens in a batch
 *          - to: multiple addresses
 */
contract BatchPayments is Ownable, ReentrancyGuard {
    
    // Event to declare a transfer with a reference
    event TransferWithReferenceAndFee(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference,
        uint256 feeAmount,
        address feeAddress
    );
    
    IERC20FeeProxy public paymentErc20FeeProxy;
    IEthereumFeeProxy public paymentEthereumFeeProxy;

    /**
     * @param _paymentErc20FeeProxy The address to the ERC20 payment proxy to use.
     * @param _paymentEthereumFeeProxy The address to the Ethereum payment proxy to use.
     */
    constructor(address _paymentErc20FeeProxy, address _paymentEthereumFeeProxy) {
        paymentErc20FeeProxy  = IERC20FeeProxy(_paymentErc20FeeProxy);
        paymentEthereumFeeProxy = IEthereumFeeProxy(_paymentEthereumFeeProxy);
    }

    // Needed because batchEthPaymentsWithReferenceAndFee requires that the contract has ethers
    receive() external payable {}

    /**
    * @notice Send a batch of Ethereum payments w/fees with paymentReferences to multiple accounts.
    *         The sum of _amounts and _feeAmounts must be <= to msg.value.
    *         If one payment failed, the whole batch is reverted
    * @param _recipients List of recipients accounts.
    * @param _amounts List of amounts, corresponding to recipients[].
    * @param _paymentReferences List of paymentRefs, corr. to the recipients[].
    * @param _feeAmounts List of amounts of the payment fee, corr. to the recipients[].
    * @param _feeAddress The fee recipient.
    * @dev Uses EthereumFeeProxy.sol to pay an invoice and fees, with a payment reference.
    *      Make sure: msg.value >= sum(_amouts)+sum(_feeAmounts)
    */
    function batchEthPaymentsWithReference(
        address[] calldata _recipients, 
        uint256[] calldata _amounts,
        bytes[] calldata _paymentReferences,
        uint256[] calldata _feeAmounts,
        address _feeAddress 
    ) external payable nonReentrant {
        require(
            _recipients.length == _amounts.length
            && _recipients.length == _paymentReferences.length
            && _recipients.length == _feeAmounts.length
            , "the input arrays must have the same length"
        );

        // sender transfer token on the contract
        payable(address(this)).transfer(msg.value);
        uint256 toReturn = msg.value;

        // Contract pays the batch payment
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(toReturn >= _amounts[i] + _feeAmounts[i], "not enough funds");

            toReturn -= (_amounts[i]+_feeAmounts[i]);
            paymentEthereumFeeProxy.transferWithReferenceAndFee{value: _amounts[i]+_feeAmounts[i]}(
                payable(_recipients[i]), 
                _paymentReferences[i],
                _feeAmounts[i],
                payable(_feeAddress)
            );
        }

        // Transfer the remaining ethers to the sender
        (bool sendBackSuccess, ) = payable(msg.sender).call{ value: toReturn }('');
        require(sendBackSuccess, 'Could not send remaining funds to the payer');
    }

    /**
     * @notice Send a batch of erc20 payments w/fees with paymentReferences to multiple accounts.
     * @param _tokenAddress Token to transact with.
     * @param _recipients List of recipients accounts.
     * @param _amounts List of amounts, corresponding to recipients[].
     * @param _paymentReferences List of paymentRefs, corr. to the recipients[] and .
     * @param _feeAmounts List of amounts of the payment fee, corr. to the recipients[].
     * @param _feeAddress The fee recipient.
     * @dev Uses ERC20FeeProxy.sol to pay an invoice and fees, with a payment reference.
     *      Make sure the contract has allowance to spend the sender token.
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
            _recipients.length == _amounts.length
            && _recipients.length == _paymentReferences.length
            && _recipients.length == _feeAmounts.length
            , "the input arrays must have the same length"
        );

        for (uint256 i = 0; i < _recipients.length; i++) {
           (bool status, ) = address(paymentErc20FeeProxy).delegatecall(
            abi.encodeWithSignature(
            "transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)",
                _tokenAddress,
                _recipients[i], 
                _amounts[i],
                _paymentReferences[i],
                _feeAmounts[i],
                _feeAddress
                )
            );
            require(status, "transferFromWithReference failed");
        }
    }

    /**
     * @notice Send a batch of erc20 payments on multiple tokens w/fees with paymentReferences to multiple accounts.
     * @param _tokenAddresses List of tokens to transact with.
     * @param _recipients List of recipients accounts.
     * @param _amounts List of amounts, corresponding to recipients[].
     * @param _paymentReferences List of paymentRefs, corr. to the recipients[].
     * @param _feeAmounts List of amounts of the payment fee, corr. to the recipients[].
     * @param _feeAddress The fee recipient.
     * @dev Uses ERC20FeeProxy.sol to pay an invoice and fees, with a payment reference.
     *      Make sure the contract has allowance to spend the sender token.
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
            _tokenAddresses.length == _recipients.length
            && _tokenAddresses.length == _amounts.length
            && _tokenAddresses.length == _paymentReferences.length
            && _tokenAddresses.length == _feeAmounts.length
            , "the input arrays must have the same length"
            );

        for (uint256 i = 0; i < _recipients.length; i++) {
           (bool status, ) = address(paymentErc20FeeProxy).delegatecall(
            abi.encodeWithSignature(
            "transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)",
                _tokenAddresses[i],
                _recipients[i], 
                _amounts[i],
                _paymentReferences[i],
                _feeAmounts[i],
                _feeAddress
                )
            );
            require(status, "transferFromWithReference failed");
        }
    }

    /*
    * Admin functions to edit the proxies address
    */

    function setPaymentErc20FeeProxy(address _paymentProxyAddress) public onlyOwner {
        paymentErc20FeeProxy = IERC20FeeProxy(_paymentProxyAddress);
    }

    function setPaymentEthereumFeeProxy(address _paymentEthereumFeeProxyAddress) public onlyOwner {
        paymentEthereumFeeProxy = IEthereumFeeProxy(_paymentEthereumFeeProxyAddress);
    }
}