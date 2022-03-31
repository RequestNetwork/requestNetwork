// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ERC20FeeProxy.sol";
import "./interfaces/EthereumFeeProxy.sol";
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';

/**
 * @title BatchPayments
 * @notice This contract makes multiple payments with references, in one transaction:
 *          - on: ERC20 Payment Proxy and ETH Payment Proxy of the Request Network protocol
 *          - to: multiple addresses
 *          - fees: Proxy fees can be paid to the same address. 
 *                  An additional batch fee is added, paid to the same address.
 */
contract BatchPayments is Ownable, ReentrancyGuard {
    
    // This event is declared in ERC20FeeProxy
    event TransferWithReferenceAndFee(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference,
        uint256 feeAmount,
        address feeAddress
    );
    
    // @dev: Between 0 and 1000, i.e: batchFee = 10 represent 1% of fee
    uint256 public batchFee;

    IERC20FeeProxy public paymentErc20FeeProxy;
    IEthereumFeeProxy public paymentEthereumFeeProxy;

    /**
     * @param _paymentErc20FeeProxy The address to the ERC20 payment proxy to use.
     * @param _paymentEthereumFeeProxy The address to the Ethereum payment proxy to use.
     * @param _owner Owner of the contract.
     */
    constructor(address _paymentErc20FeeProxy, address _paymentEthereumFeeProxy, address _owner) {
        paymentErc20FeeProxy  = IERC20FeeProxy(_paymentErc20FeeProxy);
        paymentEthereumFeeProxy = IEthereumFeeProxy(_paymentEthereumFeeProxy);
        batchFee = 0;
        transferOwnership(_owner);
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
        uint256 toReturn = msg.value;
        uint256 sumBatchFeeAmount = 0;

        // Contract pays the batch payment
        for (uint256 i = 0; i < _recipients.length; i++) {
            uint256 batchFeeAmount = (_amounts[i] * batchFee) / 1000;
            require(toReturn >= _amounts[i] + _feeAmounts[i] + batchFeeAmount, "not enough funds");
            sumBatchFeeAmount += batchFeeAmount;
            toReturn -= (_amounts[i]+_feeAmounts[i] + batchFeeAmount);

            paymentEthereumFeeProxy.transferWithReferenceAndFee{value: _amounts[i]+_feeAmounts[i]}(
                payable(_recipients[i]), 
                _paymentReferences[i],
                _feeAmounts[i],
                payable(_feeAddress)
            );
        }
        _feeAddress.transfer(sumBatchFeeAmount);

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
        
        uint256 batchAmount = 0;

        for (uint256 i = 0; i < _recipients.length; i++) {
             batchAmount += _amounts[i];
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

        require(safeTransferFrom(_tokenAddress, _feeAddress, (batchAmount * batchFee) / 1000),
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

        address[] memory uniqueTokens = new address[](_tokenAddresses.length);
        uint256[] memory amountByToken = new uint256[](_tokenAddresses.length);

        // Pay the requests
        for (uint256 i = 0; i < _recipients.length; i++) {
            // Create a list of unique tokens used
            for(uint j = 0; j < uniqueTokens.length; j++){
                if(uniqueTokens[j] == _tokenAddresses[i]){
                    amountByToken[j] += _amounts[i];
                    break;
                }
                if(amountByToken[j] == 0){
                    uniqueTokens[j] = _tokenAddresses[i];
                    amountByToken[j] = _amounts[i];
                    break;
                }
            }

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

        // Pay batch fee
        for(uint i = 0; i < uniqueTokens.length && amountByToken[i] > 0; i++){
            require(safeTransferFrom(uniqueTokens[i], _feeAddress, (amountByToken[i] * batchFee) / 1000),
             "batch fee transferFrom() failed");
             amountByToken[i] = 0;
        }
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

    function setPaymentErc20FeeProxy(address _paymentProxyAddress) public onlyOwner {
        paymentErc20FeeProxy = IERC20FeeProxy(_paymentProxyAddress);
    }

    function setPaymentEthereumFeeProxy(address _paymentEthereumFeeProxyAddress) public onlyOwner {
        paymentEthereumFeeProxy = IEthereumFeeProxy(_paymentEthereumFeeProxyAddress);
    }
}