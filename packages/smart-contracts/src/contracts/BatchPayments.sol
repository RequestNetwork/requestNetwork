// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IERC20Proxy {

    /// @notice Performs an ERC20 transfer with a reference.
    /// @param _tokenAddress Address of ERC20 token used.
    /// @param _to Transfer recipient.
    /// @param _amount Amount to transfer.
    /// @param _paymentReference Reference of the payment related.
    function transferFromWithReference(
        address _tokenAddress,
        address _to,
        uint256 _amount,
        bytes calldata _paymentReference
    ) external;
}

contract BatchPayments {
    
    IERC20Proxy public erc20Proxy;
    
    /// @notice Event emited by batchEtherPayment().
    event EthTransfer(
        address indexed Payer,
        uint256 Value
    );
    
    /// @notice Event emited by batchERC20PaymentWithReference().
    event TransferWithReference(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference
    );
    
    /// Constructor initiates the contract with the ERC20Proxy address.
    /// @notice This smartcontract let you pay multiple paymentrequests in one transaction.
    /// @param _erc20Proxy The address to the erc20 payment proxy to use.
    constructor(address _erc20Proxy) {
        erc20Proxy  = IERC20Proxy(_erc20Proxy);
    }

    function recieve() external payable {
        revert("Reverted");
    }

    /// @notice Send a batch of ether payments to multiple accounts.
    /// @param recipients Takes a list of accounts as input.
    /// @param amounts Takes a list of values, corresponding to recipients[] as input.
    function batchEtherPayment(
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) 
        external 
        payable 
    {
        for (uint256 i = 0; i < recipients.length; i++)
            payable(recipients[i]).transfer(amounts[i]);
        uint256 balance = address(this).balance;
        if (balance > 0)
            payable(msg.sender).transfer(balance);
        
        emit EthTransfer(msg.sender, msg.value);
    }

    /// @notice Send a batch of erc20 payments to multiple accounts.
    /// @param token The token to transact with. 
    /// @param recipients Takes a list of accounts as input.
    /// @param values Takes a list of values, corresponding to recipients[] as input.
    /// @dev Remember to give approval for this contract to spend user tokens.
    function batchERC20Payment(
        IERC20 token, 
        address[] calldata recipients, 
        uint256[] calldata values
    ) external {
        for (uint256 i = 0; i < recipients.length; i++)
            token.transferFrom(msg.sender, recipients[i], values[i]);
    }

    /// @notice Send a batch of erc20 payments with paymentReferences to multiple accounts.
    /// @param recipients List of recipients accounts as input.
    /// @param values List of values, corresponding to payees[] as input.
    /// @param paymentReferences List of paymentRefs, corresponding to the payees[] and values[].
    /// @dev This method uses ERC20Proxy.sol to pay an invoice with a paymentReference.
    function batchERC20PaymentWithReference(
        IERC20 token, 
        address[] calldata recipients, 
        uint256[] calldata values,
        bytes[] calldata paymentReferences
    ) external {
        for (uint256 i = 0; i < recipients.length; i++) {
           (bool status, ) = address(erc20Proxy).delegatecall(
            abi.encodeWithSignature(
            "transferFromWithReference(address,address,uint256,bytes)",
                address(token),
                recipients[i], 
                values[i],
                paymentReferences[i]
                )
            );
        require(status, "transferFromWithReference failed");

        emit TransferWithReference(
            address(token),
            recipients[i], 
            values[i],
            paymentReferences[i]
        );
        }
    }
}