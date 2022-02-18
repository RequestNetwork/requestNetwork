// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IERC20Proxy {

    /// @notice Performs an Ethereum transfer with a reference
    /// @param _to Transfer recipient
    /// @param _paymentReference Reference of the payment related
    function transferFromWithReference(
        address _tokenAddress,
        address _to,
        uint256 _amount,
        bytes calldata _paymentReference
    ) external;
}

contract BatchPayments {
    
    IERC20Proxy public erc20Proxy;

    error Reverted();
    event EthTransfer(address indexed Payer, uint256 receivers);

    /// Constructor initiates the contract with the ERC20Proxy address.
    /// @notice This smartcontract let you pay multiple paymentrequests in one transaction.
    /// @param _erc20Proxy The address to the erc20 payment proxy to use.
    constructor(address _erc20Proxy) {
        erc20Proxy  = IERC20Proxy(_erc20Proxy);
    }

    function recieve() external payable {
        revert Reverted();
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
        
        emit EthTransfer(msg.sender, recipients.length);
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
    /// @param payees Takes a list of payees accounts as input.
    /// @param amounts Takes a list of amounts, corresponding to payees as input.
    /// @param paymentReferences Takes a list of paymentreferences, corresponding to the payees[] and amounts[].
    /// @dev This method use ERC20Proxy to transact and pay an invoice according to the given paymentReferences.
    function batchERC20PaymentWithReference(
        IERC20 token, 
        address[] calldata payees, 
        uint256[] calldata amounts,
        bytes[] calldata paymentReferences
    ) external {
        for (uint256 i = 0; i < payees.length; i++) {
           (bool status, ) = address(erc20Proxy).delegatecall(
            abi.encodeWithSignature(
            "transferFromWithReference(address,address,uint256,bytes)",
                address(token),
                payees[i], 
                amounts[i],
                paymentReferences[i]
                )
            );
        require(status, "transferFromWithReference failed");
        }
    }
}