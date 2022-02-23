// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ERC20FeeProxy.sol";

contract BatchErc20Payments {
    
    IERC20FeeProxy public erc20FeeProxy;
    
    /// @notice Event emited by batchERC20PaymentWithReferenceAndFees().
    event TransferWithReferenceAndFee(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference,
        uint256 feeAmount,
        address feeAddress
    );
    
    /// Constructor initiates the contract with the ERC20FeeProxy address.
    /// @notice This smartcontract let you pay multiple paymentrequests in one transaction.
    /// @param _erc20FeeProxy The address to the erc20 payment proxy to use.
    constructor(address _erc20FeeProxy) {
        erc20FeeProxy  = IERC20FeeProxy(_erc20FeeProxy);
    }

    function recieve() external payable {
        revert("Reverted");
    }

    /// @notice Send a batch of erc20 payments with fees, to multiple accounts.
    /// @param _token The token to transact with. 
    /// @param _recipients Takes a list of accounts as input.
    /// @param _values Takes a list of values, corresponding to recipients[] as input.
    /// @dev Remember to give approval for this contract to spend user tokens.
    function batchOrphanERC20Payments(
        IERC20 _token, 
        address[] calldata _recipients, 
        uint256[] calldata _values
    ) external {
        for (uint256 i = 0; i < _recipients.length; i++)
            _token.transferFrom(msg.sender, _recipients[i], _values[i]);
    }

    /// @notice Send a batch of erc20 payments w/fees with paymentReferences to multiple accounts.
    /// @param _tokenAddress Token to transact with.
    /// @param _recipients List of recipients accounts as input.
    /// @param _values List of values, corresponding to recipients[] as input.
    /// @param _paymentReferences List of paymentRefs, corr. to the recipients[] and values[].
    /// @param _feeAmount The amount of the payment fee.
    /// @param _feeAddress The fee recipient.
    /// @dev Uses ERC20FeeProxy.sol to pay an invoice and fees, with a payment reference.
    function batchERC20PaymentsWithReferenceAndFee(
        address _tokenAddress, 
        address[] calldata _recipients, 
        uint256[] calldata _values,
        bytes[] calldata _paymentReferences,
        uint256 _feeAmount,
        address _feeAddress 
    ) external {
        for (uint256 i = 0; i < _recipients.length; i++) {
           (bool status, ) = address(erc20FeeProxy).delegatecall(
            abi.encodeWithSignature(
            "transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)",
                _tokenAddress,
                _recipients[i], 
                _values[i],
                _paymentReferences[i],
                _feeAmount,
                _feeAddress
                )
            );
        require(status, "transferFromWithReference failed");

        emit TransferWithReferenceAndFee(
            _tokenAddress,
            _recipients[i], 
            _values[i],
            _paymentReferences[i],
            _feeAmount,
            _feeAddress
        );
        }
    }
}