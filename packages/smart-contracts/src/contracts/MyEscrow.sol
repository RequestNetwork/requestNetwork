// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.0 <0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "src/contracts/interfaces/ERC20FeeProxy.sol";



/// @title Invoice based escrow smart-contract
contract MyEscrow {

    struct Invoice {
        IERC20 paymentToken; 
        uint256 amount;
        address payee;
        address payer;
        uint256 feeAmount;
        address feeAddress;
    }

    // Stores the Invoice details according to the payment reference
    mapping(bytes => Invoice) public paymentsMapping;

    /// Events to notify when the escrow is Initiated or Completed
    event EscrowInitiated(bytes indexed paymentReference, uint256 amount, address payee, IERC20 paymentToken, uint256 feeAmount, address feeAddress);
    event EscrowCompleted(bytes indexed paymentReference, address payer);
    // TODO: also describe events sent by contracts we delegate-call here (if needed);
   
    IERC20FeeProxy public paymentProxy;

    constructor(address _paymentProxyAddress) public {
     paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }


    /// Store the payment details in struct, then transfers the funds to the Escrow contract
    /// @param _paymentRef Reference of the Invoice related
    /// @param amount Amount to transfer
    /// @param payee address of the reciever/ beneficiary of the escrow funds
    function initAndDeposit(IERC20 paymentToken, uint256 amount, address payee, bytes memory _paymentRef, uint256 feeAmount, address feeAddress) 
        public
        payable
    {
        require(
            paymentsMapping[_paymentRef].amount == 0, 
            "This paymentRef already exists, is this the correct paymentRef?"
        );

        paymentsMapping[_paymentRef] = Invoice(
        paymentToken, 
        amount,
        payee,
        msg.sender,
        feeAmount,
        feeAddress
        );
        
        _deposit(_paymentRef);

        emit EscrowInitiated(_paymentRef, paymentsMapping[_paymentRef].amount,  paymentsMapping[_paymentRef].payee, paymentsMapping[_paymentRef].paymentToken, paymentsMapping[_paymentRef].feeAmount, paymentsMapping[_paymentRef].feeAddress);
    }


    /// Withdraw the funds of escrow from a given _paymentRef
    /// @param _paymentRef Reference of the payment related
    /// @dev require msg.sender to be the function executer
    function withdrawFunds(bytes memory _paymentRef) public {
        require(msg.sender == paymentsMapping[_paymentRef].payer, "Only the payer can withdraw funds from the Escrow contract");
        require(paymentsMapping[_paymentRef].amount != 0, "Payment reference does not exist");

        uint amount = paymentsMapping[_paymentRef].amount;
        paymentsMapping[_paymentRef].amount = 0;

        // Pay the request and fees
        (bool status, ) = address(paymentProxy).delegatecall(
            abi.encodeWithSignature(
                "transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)",
                paymentsMapping[_paymentRef].paymentToken,
                paymentsMapping[_paymentRef].payee, 
                amount, 
                _paymentRef, 
                paymentsMapping[_paymentRef].feeAmount, 
                paymentsMapping[_paymentRef].feeAddress 
            )

        );
        require(status, "transferFromWithReferenceAndFee failed");

        emit EscrowCompleted(_paymentRef, paymentsMapping[_paymentRef].payer);
    }


    /// Transfers paymentToken from payer to MyEscrow smartcontract  
    /// @param _paymentRef Reference of the Invoice related
    /// @dev   Internal function called from initAndDeposit
    function _deposit(bytes memory _paymentRef) internal {
        require(paymentsMapping[_paymentRef].paymentToken.transferFrom(
            paymentsMapping[_paymentRef].payer,
            address(this), 
            paymentsMapping[_paymentRef].amount
        ), 
        "Cannot lock tokens to Escrow as requested, did you approve CTBK?"); 
    }
 

    /** Getter functions */
    /// Get the Invoice details of a given _paymentRef
    /// @param _paymentRef Reference of the Invoice related
    function getInvoice(bytes memory _paymentRef) public view returns 
    (
        uint amount, 
        address payee,
        address payer
    ) 
    {
        require(
            paymentsMapping[_paymentRef].amount != 0,
            "Payment reference does not exist"
        );
        return ( 
            paymentsMapping[_paymentRef].amount, 
            paymentsMapping[_paymentRef].payee,
            paymentsMapping[_paymentRef].payer
        );
    }

}

    /// Rinkeby IERC20FeeProxy Contract Address 
    //  IERC20FeeProxy public paymentProxy = IERC20FeeProxy(0xda46309973bFfDdD5a10cE12c44d2EE266f45A44);
    
    /// Rinkeby CentralBankToken (CTBK) Contract Address 
    //  IERC20 public paymentToken = IERC20(0x995d6A8C21F24be1Dd04E105DD0d83758343E258);