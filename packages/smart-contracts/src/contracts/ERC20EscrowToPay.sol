/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "./interfaces/ERC20FeeProxy.sol";


/// @title Escrow based invoice
contract ERC20EscrowToPay {
    
    IERC20FeeProxy public paymentProxy;
    TokenTimelock public tokentimelock;
    address payable private owner;
    
    struct Invoice {
        IERC20 paymentToken; 
        uint256 amount;
        address payee;
        address payer;
        uint feeAmount;
        uint256 claimDate;
    }

    struct Dispute {
        bytes paymentReference;
        IERC20 paymentToken; 
        uint256 amount;
        address payee;
        address payer;
        uint feeAmount;
        uint256 duration;
        uint256 endTime;
        TokenTimelock tokentimelock;
    }

    // Stores the Invoice details according to the payment reference.
    mapping(bytes => Invoice) public invoiceMapping;
    mapping(bytes => Dispute) public disputeMapping;

    // Modifier
    modifier onlyPayers(bytes memory _paymentRef) {
        require(
            msg.sender == invoiceMapping[_paymentRef].payer || 
            msg.sender == disputeMapping[_paymentRef].payer || 
            msg.sender == invoiceMapping[_paymentRef].payee || 
            msg.sender == disputeMapping[_paymentRef].payee,
            "MyEscrow: Only the payer or payee can excecute this call!"
            );
        _;
    }

    /// Events
    event OpenEscrow(
        bytes indexed paymentReference,
        IERC20 paymentToken,
        uint256 amount,
        address payee,
        uint feeAmount,
        uint256 claimDate
    );
    event LockPeriodStarted(
        bytes indexed paymentReference,
        TokenTimelock tokentimelock,
        IERC20 paymentToken,
        uint256 amount,
        address payee,
        address payer
    );
    event EscrowCompleted(
        bytes indexed paymentReference,
        uint256 amount,
        uint feeAmount,
        address feeAddress
    );
    event LockPeriodEnded(bytes indexed paymentReference, uint feeAmount);
    

    constructor(address payable _paymentProxyAddress) {
        owner = payable(msg.sender);
        paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }


    /// Store the payment details in struct, then transfers the funds to the Escrow contract
    /// @param _paymentRef Reference of the Invoice related
    /// @param amount Amount to transfer
    /// @param payee address of the reciever/ beneficiary of the escrow funds
    function openEscrow(bytes memory _paymentRef, IERC20 paymentToken,uint256 amount, address payee) 
        public
        payable
        returns (bytes memory, uint256)
    {
        require(
            invoiceMapping[_paymentRef].amount == 0, 
            "MyEscrow: This paymentRef already exists, is this the correct paymentRef?"
        );
        
        /// feeAmount is 1% of the invoice amount.
        uint feeAmount = amount *1/100;
        
        uint256 sixMonths = 15778458;
        uint256 claimDate = block.timestamp + sixMonths;
        
        invoiceMapping[_paymentRef] = Invoice(
        paymentToken, 
        amount,
        payee,
        msg.sender,
        feeAmount,
        claimDate
        );
        
        _deposit(_paymentRef);

        emit OpenEscrow(
            _paymentRef,
            invoiceMapping[_paymentRef].paymentToken,
            invoiceMapping[_paymentRef].amount,
            invoiceMapping[_paymentRef].payee,
            invoiceMapping[_paymentRef].feeAmount,
            invoiceMapping[_paymentRef].claimDate
        );
        
        return (_paymentRef, claimDate);
    }


    /// Withdraw the funds of escrow from a given _paymentRef.
    /// @param  _paymentRef Reference of the payment related.
    /// @dev    require msg.sender to be the function executer.
    function closeEscrow(bytes calldata _paymentRef) public onlyPayers(_paymentRef) {
        require(invoiceMapping[_paymentRef].amount != 0, "MyEscrow: Payment reference does not exist");

        //TODO: remove hardcoded feeAddress
        address _feeAddress = 0xdD870fA1b7C4700F2BD7f44238821C26f7392148;
        
        uint256 _amount = invoiceMapping[_paymentRef].amount;
        uint _feeAmount = invoiceMapping[_paymentRef].feeAmount;
        
        /// Give approval to transfer from escrow => tokentimelock contract.
        invoiceMapping[_paymentRef].paymentToken.approve(address(paymentProxy),  2**255);
        invoiceMapping[_paymentRef].amount = 0;


        // Pay the request and fees.
        paymentProxy.transferFromWithReferenceAndFee(
            address(invoiceMapping[_paymentRef].paymentToken),
            invoiceMapping[_paymentRef].payee, 
            _amount, 
            _paymentRef, 
            _feeAmount,
            _feeAddress
        );

        /// Delete the details in the invoiceMapping.
        delete invoiceMapping[_paymentRef];

        emit EscrowCompleted(
            _paymentRef,
            _amount,
            _feeAmount,
            _feeAddress
        );
        
    }


    /// @notice Transfers paymentToken from payer to MyEscrow smartcontract.  
    /// @param  _paymentRef Reference of the related Invoice.
    /// @dev    Internal function called by openEscrow.
    function _deposit(bytes memory _paymentRef) internal {
        require(invoiceMapping[_paymentRef].paymentToken.transferFrom(
            invoiceMapping[_paymentRef].payer,
            address(this), 
            invoiceMapping[_paymentRef].amount + invoiceMapping[_paymentRef].feeAmount
        ), 
        "MyEscrow: Cannot transfer tokens to Escrow as requested, did you approve ERC20 token?");
    }


    /// @notice Return Invoice details from _paymentRef.
    /// @param  _paymentRef Reference of the related Invoice.
    function getInvoice(bytes memory _paymentRef) public view returns
    (
        uint256 amount, 
        address payee,
        address payer,
        uint256 feeAmount
    )
    {
        require(
            invoiceMapping[_paymentRef].amount != 0,
            "MyEscrow: Payment reference does not exist!"
        );

        return (
            invoiceMapping[_paymentRef].amount,
            invoiceMapping[_paymentRef].payee,
            invoiceMapping[_paymentRef].payer,
            invoiceMapping[_paymentRef].feeAmount
        );
    }


 /* --------- DISPUTES & LOCKPERIODS  --------- */


    /// Open dispute and lock funds for a year.
    /// @param _paymentRef Reference of the Invoice related.
    function openDispute(bytes memory _paymentRef) public payable onlyPayers(_paymentRef) {
        require(invoiceMapping[_paymentRef].amount != 0, "MyEscrow: No Invoice found!");
        
        // duration is set to 12 months
        uint256 _lockDuration = 31556926; 

        // FIX: For testing purposes
        uint256 _endtime = block.timestamp + 1 ; //+ _lockDuration;
    
        tokentimelock = new TokenTimelock(IERC20(invoiceMapping[_paymentRef].paymentToken), address(this), _endtime); 
        
        disputeMapping[_paymentRef] = Dispute(
            _paymentRef,
            invoiceMapping[_paymentRef].paymentToken, 
            invoiceMapping[_paymentRef].amount,
            invoiceMapping[_paymentRef].payee,
            invoiceMapping[_paymentRef].payer,
            invoiceMapping[_paymentRef].feeAmount,
            _lockDuration,
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

        emit LockPeriodStarted(
            _paymentRef,
            disputeMapping[_paymentRef].tokentimelock,
            disputeMapping[_paymentRef].paymentToken,
            disputeMapping[_paymentRef].amount,
            disputeMapping[_paymentRef].payee,
            disputeMapping[_paymentRef].payer
        );
    }


    /// @notice Transfer funds from tokentimelock contract => payer.
    /// @param  _paymentRef Reference of the Invoice related.
    function withdrawLockedFunds(bytes memory _paymentRef) public onlyPayers(_paymentRef) {
        require(disputeMapping[_paymentRef].amount != 0, "MyEscrow: No Invoice found!");
        
        //TODO: remove hardcoded feeAddress
        address _feeAddress = 0xdD870fA1b7C4700F2BD7f44238821C26f7392148;

        // close tokentimelock and transfer funds to payer through paymentProxy.transferFromWithReferenceAndFee.
        tokentimelock.release();
        
        // Subtract the feeAmount from the invoice amount.
        uint256 _amount = disputeMapping[_paymentRef].amount;
        uint _feeAmount = disputeMapping[_paymentRef].feeAmount;
        
        disputeMapping[_paymentRef].paymentToken.approve(address(paymentProxy),  2**255);
        disputeMapping[_paymentRef].amount = 0;

        // Pay the request and fees
        paymentProxy.transferFromWithReferenceAndFee(
            address(disputeMapping[_paymentRef].paymentToken),
            disputeMapping[_paymentRef].payer, 
            _amount, 
            _paymentRef, 
            uint256(_feeAmount), 
            _feeAddress
        );

        // delete paymentreference from disputeMapping
        delete disputeMapping[_paymentRef];
        
        emit LockPeriodEnded(_paymentRef, _feeAmount);
    }


    /// @notice Returns the endTime of the tokentimelock contract.   
    /// @param  _paymentRef Reference of the Invoice related.
    function getLockPeriodEndTime(bytes memory _paymentRef) public view onlyPayers(_paymentRef) returns (uint256 time) {
        return disputeMapping[_paymentRef].tokentimelock.releaseTime();
    }


    /// @notice Removes the ERC20EscrowToPay smartcontract from the blockchain. 
    function remove() public {
      require(owner == msg.sender, "ERC20EscrowToPay: You are not the Owner, only the owner can execute this call!"); 
        selfdestruct(owner);
    }

}