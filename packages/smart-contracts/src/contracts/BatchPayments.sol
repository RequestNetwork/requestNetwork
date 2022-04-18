// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import './lib/SafeERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ERC20FeeProxy.sol";
import "./interfaces/EthereumFeeProxy.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/**
 * @title BatchPayments
 * @notice This contract makes multiple payments with references, in one transaction:
 *          - on: ERC20 Payment Proxy and ETH Payment Proxy of the Request Network protocol
 *          - to: multiple addresses
 *          - fees: payee1 and ETH Proxy fees are paid to the same address. 
 *                  An additional batch fee is paid to the same address.
 *         If one transaction fail, every transactions are reverted.
 */
contract BatchPayments is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20FeeProxy public paymentErc20FeeProxy;
    IEthereumFeeProxy public paymentEthFeeProxy;

     // @dev: Between 0 and 1000, i.e: batchFee = 10 represent 1% of fee
    uint256 public batchFee;

    /**
     * @param _paymentErc20FeeProxy The address to the ERC20 payment proxy to use.
     * @param _paymentEthFeeProxy The address to the Ethereum payment proxy to use.
     * @param _owner Owner of the contract.
     */
    constructor(address _paymentErc20FeeProxy, address _paymentEthFeeProxy, address _owner) {
        paymentErc20FeeProxy  = IERC20FeeProxy(_paymentErc20FeeProxy);
        paymentEthFeeProxy = IEthereumFeeProxy(_paymentEthFeeProxy);
        transferOwnership(_owner);
        batchFee = 0;
    }

    // batchEthPaymentsWithReferenceAndFee requires that the contract has ethers
    receive() external payable {}

    /**
    * @notice Send a batch of Eth payments w/fees with paymentReferences to multiple accounts.
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
        address payable _feeAddress 
    ) external payable nonReentrant {
        require(
            _recipients.length == _amounts.length
            && _recipients.length == _paymentReferences.length
            && _recipients.length == _feeAmounts.length
            , "the input arrays must have the same length"
        );

        // Sender transfers tokens to the contract
        payable(address(this)).transfer(msg.value);
        uint256 remainingAmount = msg.value;
        uint256 sumBatchFeeAmount = 0;

        // Batch proxy pays the requests thourgh EthFeeProxy
        for (uint256 i = 0; i < _recipients.length; i++) {
            uint256 batchFeeAmount = (_amounts[i] * batchFee) / 1000;
            require(remainingAmount >= _amounts[i] + _feeAmounts[i] + batchFeeAmount, "not enough funds");
            sumBatchFeeAmount += batchFeeAmount;
            remainingAmount -= (_amounts[i]+_feeAmounts[i] + batchFeeAmount);

            paymentEthFeeProxy.transferWithReferenceAndFee{value: _amounts[i]+_feeAmounts[i]}(
                payable(_recipients[i]), 
                _paymentReferences[i],
                _feeAmounts[i],
                payable(_feeAddress)
            );
        }
        _feeAddress.transfer(sumBatchFeeAmount);

        // Transfer the remaining ethers to the sender
        if (remainingAmount > 0) {
            (bool sendBackSuccess, ) = payable(msg.sender).call{ value: remainingAmount }('');
            require(sendBackSuccess, 'Could not send remaining funds to the payer');
        }
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

        // Transfer the total amount to the batch proxy
        uint totalAmount = 0;
        for (uint256 i = 0; i < _recipients.length; i++) {
            totalAmount += _amounts[i] + _feeAmounts[i];
        }
        require(safeTransferFrom(_tokenAddress, address(this), totalAmount), "payment transferFrom() failed");

        // Batch proxy approve Erc20FeeProxy to spend the token
        IERC20 requestedToken = IERC20(_tokenAddress);
        if (requestedToken.allowance(address(this), address(paymentErc20FeeProxy)) < totalAmount) {
            approvePaymentProxyToSpend(address(requestedToken));
        }
        
        // Batch proxy pays the requests using Erc20FeeProxy
        for (uint256 i = 0; i < _recipients.length; i++) {
            // totalAmount is now used as the batch amount to calculate batch fee amount
            totalAmount -= _feeAmounts[i];
            paymentErc20FeeProxy.transferFromWithReferenceAndFee(
                _tokenAddress,
                _recipients[i], 
                _amounts[i],
                _paymentReferences[i],
                _feeAmounts[i],
                _feeAddress
            );
        }

        // Sender pays batch fee amount
        require(safeTransferFrom(_tokenAddress, _feeAddress, (totalAmount * batchFee) / 1000),
         "batch fee transferFrom() failed");
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

        // Create 2 lists of unique tokens used and the amounts associated
        address[] memory uniqueTokens = new address[](_tokenAddresses.length);
        uint256[] memory amountByToken = new uint256[](_tokenAddresses.length);
        for (uint256 i = 0; i < _recipients.length; i++) {
            for(uint j = 0; j < uniqueTokens.length; j++){
                if(uniqueTokens[j] == _tokenAddresses[i]){
                    amountByToken[j] += _amounts[i] + _feeAmounts[i];
                    break;
                }
                if(amountByToken[j] == 0){
                    uniqueTokens[j] = _tokenAddresses[i];
                    amountByToken[j] = _amounts[i] + _feeAmounts[i];
                    break;
                }
            }
        }

        // Sender transfer tokens on the batch proxy
        for (uint256 i = 0; i < uniqueTokens.length && amountByToken[i] > 0; i++) {
            require(safeTransferFrom(uniqueTokens[i], address(this), amountByToken[i]), "payment transferFrom() failed");

            // Batch proxy approve Erc20FeeProxy to spend the token
            IERC20 requestedToken = IERC20(uniqueTokens[i]);
            if (requestedToken.allowance(address(this), address(paymentErc20FeeProxy)) < amountByToken[i]) {
                approvePaymentProxyToSpend(address(requestedToken));
            }
        }

        // Batch proxy pays the requests using Erc20FeeProxy
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

        // Sender pays batch fee amount
        for(uint i = 0; i < uniqueTokens.length && amountByToken[i] > 0; i++){
            uint amount = amountByToken[i];
            amountByToken[i] = 0;
            require(safeTransferFrom(uniqueTokens[i], _feeAddress, (amount * batchFee) / 1000),
             "batch fee transferFrom() failed");
        }
    }

    /**
     * @notice Authorizes the proxy to spend a new request currency (ERC20).
     * @param _erc20Address Address of an ERC20 used as the request currency.
     */
    function approvePaymentProxyToSpend(address _erc20Address) public {
        IERC20 erc20 = IERC20(_erc20Address);
        uint256 max = 2**256 - 1;
        erc20.safeApprove(address(paymentErc20FeeProxy), max);
    }

    /**
    * @notice Call transferFrom ERC20 function and validates the return data of a ERC20 contract call.
    * @dev This is necessary because of non-standard ERC20 tokens that don't have a return value.
    * @return result The return value of the ERC20 call, returning true for non-standard tokens
    */
    function safeTransferFrom(address _tokenAddress, address _to, uint256 _amount) internal returns (bool result) {
    /* solium-disable security/no-inline-assembly */
    // check if the address is a contract
    assembly {
        if iszero(extcodesize(_tokenAddress)) { revert(0, 0) }
    }

    // solium-disable-next-line security/no-low-level-calls
    (bool success, ) = _tokenAddress.call(abi.encodeWithSignature(
        "transferFrom(address,address,uint256)",
        msg.sender,
        _to,
        _amount
    ));

    assembly {
        switch returndatasize()
        case 0 { // Not a standard erc20
            result := 1
        }
        case 32 { // Standard erc20
            returndatacopy(0, 0, 32)
            result := mload(0)
        }
        default { // Anything else, should revert for safety
            revert(0, 0)
        }
    }

    require(success, "transferFrom() has been reverted");

    /* solium-enable security/no-inline-assembly */
    return result;
  }

    /*
    * Admin functions to edit the proxies address
    */

    function setBatchFee(uint256 _batchFee) public onlyOwner {
        batchFee = _batchFee;
    }

    function setPaymentErc20FeeProxy(address _paymentErc20FeeProxy) public onlyOwner {
        paymentErc20FeeProxy = IERC20FeeProxy(_paymentErc20FeeProxy);
    }

    function setPaymentEthFeeProxy(address _paymentEthFeeProxy) public onlyOwner {
        paymentEthFeeProxy = IEthereumFeeProxy(_paymentEthFeeProxy);
    }
}
