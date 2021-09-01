/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "./interface/TestERC20FeeProxy.sol";


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

    struct Dispute {
        bytes paymentReference;
        IERC20 paymentToken; 
        uint256 amount;
        address payee;
        address payer;
        uint256 feeAmount;
        address feeAddress;
        uint256 duration;
        uint256 endTime;
        TokenTimelock tokentimelock;
    }

    // Stores the Invoice details according to the payment reference
    mapping(bytes => Invoice) public invoiceMapping;
    mapping(bytes => Dispute) public disputeMapping;

    // Modifier
    modifier onlyPayer(bytes memory _paymentRef) {
        require(
            msg.sender == invoiceMapping[_paymentRef].payer || msg.sender == disputeMapping[_paymentRef].payer,
            "MyEscrow: Only the payer can excecute this call or the escrow don't exists!"
            );
        _;
    }

    /// Events to notify when the escrow is Initiated or Completed
    event EscrowInitiated(bytes indexed paymentReference, uint256 amount, address payee, IERC20 paymentToken, uint256 feeAmount, address feeAddress);
    event EscrowCompleted(bytes indexed paymentReference, address payer, uint256 amount);
    event LockPeriodStarted(bytes indexed paymentReference, uint256 amount, address payee, address payer, IERC20 paymentToken, TokenTimelock tokentimelock);
    event LockPeriodEnded(bytes indexed paymentReference, uint256 amount, address payer, IERC20 paymentToken);
    
    ITestERC20FeeProxy public paymentProxy;
    TokenTimelock public tokentimelock;


    constructor(address payable _paymentProxyAddress) {
        paymentProxy = ITestERC20FeeProxy(_paymentProxyAddress);
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
            invoiceMapping[_paymentRef].amount == 0, 
            "MyEscrow: This paymentRef already exists, is this the correct paymentRef?"
        );

        invoiceMapping[_paymentRef] = Invoice(
        paymentToken, 
        amount,
        payee,
        msg.sender,
        feeAmount,
        feeAddress
        );
        
        _deposit(_paymentRef);

        emit EscrowInitiated(_paymentRef, invoiceMapping[_paymentRef].amount, invoiceMapping[_paymentRef].payee, invoiceMapping[_paymentRef].paymentToken, invoiceMapping[_paymentRef].feeAmount, invoiceMapping[_paymentRef].feeAddress);
    }


    /// Withdraw the funds of escrow from a given _paymentRef
    /// @param _paymentRef Reference of the payment related
    /// @dev require msg.sender to be the function executer
    function withdrawFunds(bytes calldata _paymentRef) public onlyPayer(_paymentRef) {
        require(invoiceMapping[_paymentRef].amount != 0, "MyEscrow: Payment reference does not exist");

        uint256 amount = invoiceMapping[_paymentRef].amount;
        
        /// Give approval to transfer from escrow => tokentimelock contract
        invoiceMapping[_paymentRef].paymentToken.approve(address(paymentProxy),  2**255);
        invoiceMapping[_paymentRef].amount = 0;


        // Pay the request and fees
        paymentProxy.transferFromWithReferenceAndFee(
            address(invoiceMapping[_paymentRef].paymentToken),
            invoiceMapping[_paymentRef].payee, 
            amount, 
            _paymentRef, 
            invoiceMapping[_paymentRef].feeAmount, 
            invoiceMapping[_paymentRef].feeAddress 
        );

        /// Delete the details in the invoiceMapping
        delete invoiceMapping[_paymentRef];

        emit EscrowCompleted(_paymentRef, invoiceMapping[_paymentRef].payer, amount);
    }


    /// Transfers paymentToken from payer to MyEscrow smartcontract  
    /// @param _paymentRef Reference of the Invoice related
    /// @dev   Internal function called from initAndDeposit
    function _deposit(bytes memory _paymentRef) internal {
        require(invoiceMapping[_paymentRef].paymentToken.transferFrom(
            invoiceMapping[_paymentRef].payer,
            address(this), 
            invoiceMapping[_paymentRef].amount + invoiceMapping[_paymentRef].feeAmount
        ), 
        "MyEscrow: Cannot lock tokens to Escrow as requested, did you approve CTBK?");
    }


    /// Return details of a given _paymentRef
    /// @param _paymentRef Reference of the Invoice related
    ///
    function getInvoice(bytes memory _paymentRef) public view returns
    (
        uint256 amount, 
        address payee,
        address payer
    )
    {
        require(
            invoiceMapping[_paymentRef].amount != 0,
            "MyEscrow: Payment reference does not exist!"
        );

        return (
            invoiceMapping[_paymentRef].amount,
            invoiceMapping[_paymentRef].payee,
            invoiceMapping[_paymentRef].payer
        );
    }


 /* --------- DISPUTES & LOCKPERIODS  --------- */


    /// Open dispute and lock funds for a year.
    /// @param _paymentRef Reference of the Invoice related.
    function initLockPeriod(bytes memory _paymentRef) public payable onlyPayer(_paymentRef) {
        require(invoiceMapping[_paymentRef].amount != 0, "MyEscrow: No Invoice found!");
        
        uint256 _duration = 31556926; 
        // FIX: For testing purposes
        uint256 _endtime = block.timestamp + 1 ; //+ _duration;
    
        tokentimelock = new TokenTimelock(IERC20(invoiceMapping[_paymentRef].paymentToken), address(this), _endtime); 
        
        disputeMapping[_paymentRef] = Dispute(
            _paymentRef,
            invoiceMapping[_paymentRef].paymentToken, 
            invoiceMapping[_paymentRef].amount,
            invoiceMapping[_paymentRef].payee,
            invoiceMapping[_paymentRef].payer,
            invoiceMapping[_paymentRef].feeAmount,
            invoiceMapping[_paymentRef].feeAddress,
            _duration,
            _endtime,
            tokentimelock
        );

        // Transfer form escrow contract => tokentimelock contract
        require(
            disputeMapping[_paymentRef].paymentToken.transfer(
                address(disputeMapping[_paymentRef].tokentimelock),
                disputeMapping[_paymentRef].amount),
                "MyEscrow: Transfer to tokentimelock contract failed!"
        );
        
        delete invoiceMapping[_paymentRef];

        emit LockPeriodStarted(_paymentRef, disputeMapping[_paymentRef].amount, disputeMapping[_paymentRef].payee, disputeMapping[_paymentRef].payer, disputeMapping[_paymentRef].paymentToken, disputeMapping[_paymentRef].tokentimelock);
    }




    // Transfer from tokentimelock contract => payer
    /// @param _paymentRef Reference of the Invoice related
    ///
    function withdrawLockedFunds(bytes memory _paymentRef) public onlyPayer(_paymentRef) {
        require(disputeMapping[_paymentRef].amount != 0, "MyEscrow: No Invoice found!");
        

        // close tokentimelock and transfer funds to payer through paymentProxy.transferFromWithReferenceAndFee.
        tokentimelock.release();
        
        uint256 _amount = disputeMapping[_paymentRef].amount;
        IERC20 _token = disputeMapping[_paymentRef].paymentToken;
        
        disputeMapping[_paymentRef].paymentToken.approve(address(paymentProxy),  2**255);
        disputeMapping[_paymentRef].amount = 0;

        // Pay the request and fees
        paymentProxy.transferFromWithReferenceAndFee(
            address(disputeMapping[_paymentRef].paymentToken),
            disputeMapping[_paymentRef].payer, 
            _amount, 
            _paymentRef, 
            disputeMapping[_paymentRef].feeAmount, 
            disputeMapping[_paymentRef].feeAddress
        );

        // delete paymentreference from disputeMapping
        delete disputeMapping[_paymentRef];
        
        emit LockPeriodEnded(_paymentRef, _amount, msg.sender, _token);
    }


    /// Return endTime of tokentimelock contract   
    /// @param _paymentRef Reference of the Invoice related
    function getLockPeriodEndTime(bytes memory _paymentRef) public view onlyPayer(_paymentRef) returns (uint256 time) {
        return disputeMapping[_paymentRef].tokentimelock.releaseTime();
    }


}