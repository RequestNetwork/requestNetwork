/// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "./interfaces/ERC20FeeProxy.sol";


/// @title Escrow based invoice
contract ERC20EscrowToPayV1 {

    IERC20FeeProxy private paymentProxy;
    TokenTimelock private tokentimelock;
    address payable private owner;
    
    struct Invoice {
        IERC20 paymentToken; 
        uint256 amount;
        address payee;
        address payer;
        uint feeAmount;
        address feeAddress;
        uint256 claimDate;
    }

    struct Dispute {
        bytes paymentReference;
        IERC20 paymentToken; 
        uint256 amount;
        address payee;
        address payer;
        uint feeAmount;
        address feeAddress;
        uint256 duration;
        uint256 endTime;
        TokenTimelock tokentimelock;
    }

    // Stores the Invoice details according to the payment reference.
    mapping(bytes => Invoice) public invoiceMapping;
    mapping(bytes => Dispute) public disputeMapping;

    // Modifiers
    modifier OnlyPayer(bytes memory _paymentRef) {
        require(
            msg.sender == invoiceMapping[_paymentRef].payer || 
            msg.sender == disputeMapping[_paymentRef].payer,
            "ERC20EscrowToPay: Only the payer can excecute this call!"
        );
        _;
    }
    modifier OnlyOwner() {
        require(
            msg.sender == owner,
            "ERC20EscrowToPay: Only the owner can excecute this call!"
        );
        _;
    }

    /// Errors
    error WithdrawFailed(string description);

    /// Events
    event OpenEscrow(bytes indexed paymentReference);
    event EscrowCompleted(bytes indexed paymentReference);
    event DisputeOpened(bytes indexed paymentReference);
    event DisputeResolved(bytes indexed paymentReference);
    event LockPeriodStarted(
        bytes indexed paymentReference,
        TokenTimelock tokentimelock,
        IERC20 paymentToken
    );
    event LockPeriodEnded(bytes indexed paymentReference);
    
    constructor(address payable _paymentProxyAddress) {
        owner = payable(msg.sender);
        paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }


    // Fallback function returns funds to the sender
    receive() external payable {
        revert("not payable receive");
    }


    /// Stores the invoice details in struct, then transfers the funds to this Escrow contract.
    /// @param _paymentRef Reference of the Invoice related.
    /// @param amount Amount to transfer.
    /// @param payee address of the reciever/ beneficiary of the escrow funds.
    function openEscrow(
        bytes memory _paymentRef,
        IERC20 paymentToken,
        uint256 amount,
        address payee,
        uint256 feeAmount,
        address feeAddress
    ) 
        public
        payable
    {
        require(
            invoiceMapping[_paymentRef].amount == 0, 
            "MyEscrow: This paymentRef already exists, is this the correct paymentRef?"
        );
        
        uint256 sixMonths = 15778458;
        // Variable claimDate is used to set a timestamp on when the payee can execute closeEscrow
        uint256 claimDate = block.timestamp + sixMonths;
        
        invoiceMapping[_paymentRef] = Invoice(
        paymentToken, 
        amount,
        payee,
        msg.sender,
        feeAmount,
        feeAddress,
        claimDate
        );
        
        _deposit(_paymentRef);

        emit OpenEscrow(_paymentRef );
        
    }


    /// Withdraw the funds of escrow from a given _paymentRef.
    /// @param  _paymentRef Reference of the payment related.
    /// @dev    require payer is msg.sender.
    function closeEscrow(bytes memory _paymentRef) public {
        require(invoiceMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: Payment reference does not exist");
        require(
            msg.sender == invoiceMapping[_paymentRef].payer ||
            (msg.sender == invoiceMapping[_paymentRef].payee  &&
            invoiceMapping[_paymentRef].claimDate <= block.timestamp),
            "ERC20EscrowToPay: Only the payer or payee can excecute this call!"
        );
        /// withdraw the funds from Escrow. 
        _withdraw(_paymentRef, invoiceMapping[_paymentRef].payee);


        /// Delete the invoiceMapping[_paymentRef] data.
        delete invoiceMapping[_paymentRef];

        emit EscrowCompleted(
            _paymentRef
        );
        
    }

  
    /// @notice Used to change the feeAmount and feeAddress of any escrow.
    function changeFeeAndAddress(
        bytes memory _paymentRef,
        uint _feeAmount, 
        address _feeAddress
    ) 
        external 
        OnlyOwner()
        returns (bytes memory paymentRef, uint feeAmount, address feeAddress) 
    {
        require(
            invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: Can't find Invoice, wrong payment reference!"
        );
        
        invoiceMapping[_paymentRef].feeAmount = _feeAmount;
        invoiceMapping[_paymentRef].feeAddress = payable(_feeAddress);
        
        return (_paymentRef, invoiceMapping[_paymentRef].feeAmount, invoiceMapping[_paymentRef].feeAddress);
        
    }


    /// @notice Opens a dispute.
    /// @param _paymentRef Reference of the Invoice related.
    function openDispute(bytes memory _paymentRef) public payable OnlyPayer(_paymentRef) {
        require(
            msg.sender == invoiceMapping[_paymentRef].payer, 
            "ERC20EscrowToPay: You are not the valid payer. Only the valid payer can open a dispute!"
        );
        require(
            invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No Invoice found, Wrong payment reference?"
        );
        require(
            disputeMapping[_paymentRef].amount == 0, 
            "ERC20EscrowToPay: A dispute already exists, is this the correct paymentRef?"
        );

        
        disputeMapping[_paymentRef] = Dispute(
            _paymentRef,
            invoiceMapping[_paymentRef].paymentToken, 
            invoiceMapping[_paymentRef].amount,
            invoiceMapping[_paymentRef].payee,
            invoiceMapping[_paymentRef].payer,
            invoiceMapping[_paymentRef].feeAmount,
            invoiceMapping[_paymentRef].feeAddress,
            0,
            0,
            tokentimelock
        );

        /// Deletes the invoiceMapping
        delete invoiceMapping[_paymentRef];

        emit DisputeOpened(_paymentRef);
    }


    /// @notice Close a dispute and transfer the funds to the payee account.
    /// @dev Executes a call to release() on the tokentimelock contract.
    /// @param _paymentRef Reference of the related Invoice. 
    function resolveDispute(bytes memory _paymentRef) external {
        require(
            msg.sender == disputeMapping[_paymentRef].payer,
            "ERC20EscrowToPay: Only the Payer can resolve the dispute!"
        );
        require(
            disputeMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No Dispute found, wrong payment reference?"
        );

        _withdraw( _paymentRef, disputeMapping[_paymentRef].payee); 

        // delete paymentreference from disputeMapping
        delete disputeMapping[_paymentRef];

        emit DisputeResolved(_paymentRef);
    }


    /// @notice Creates a tokentimelock contract and returns the escrowed funds to the payer after 12 months.
    /// @dev Pays the fees and transferes funds to timelockcontract.
    function lockDisputedFunds(bytes memory _paymentRef) public OnlyPayer(_paymentRef) {
        require(disputeMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: No dispute found, worng paymentRef?");
        /// duration is set to 12 months
        uint256 _lockDuration = 31556926; 

        /// TODO: For testing purposes, remember to remove _lockDuration.
        uint256 _endtime = block.timestamp + 1 ; //+ _lockDuration;

        /// Initiate a new tokentimelock contract
        TokenTimelock _tokentimelock = new TokenTimelock(IERC20(disputeMapping[_paymentRef].paymentToken), disputeMapping[_paymentRef].payer , _endtime); 
        
        disputeMapping[_paymentRef].duration = _lockDuration;
        disputeMapping[_paymentRef].endTime = _endtime;
        disputeMapping[_paymentRef].tokentimelock = _tokentimelock;

        // withdraw the funds and pay the fees, using _withdraw(_paymentRef, _receiver).
        _withdraw(_paymentRef, address(disputeMapping[_paymentRef].tokentimelock));

        
        emit LockPeriodStarted(
            _paymentRef,
            disputeMapping[_paymentRef].tokentimelock,
            disputeMapping[_paymentRef].paymentToken
        );
    }


    /// @notice Transfer funds from tokentimelock contract => payer.
    /// @param  _paymentRef Reference of the Invoice related.
    function withdrawLockedFunds(bytes memory _paymentRef) public OnlyPayer(_paymentRef) {
        require(address(disputeMapping[_paymentRef].tokentimelock) != 0x0000000000000000000000000000000000000000, 
        "ERC20EscrowToPay: No timelockcontract found!");
        
        // close tokentimelock and returns the escrowed funds to the payer.
        disputeMapping[_paymentRef].tokentimelock.release();
        
        // delete paymentreference from disputeMapping.
        delete disputeMapping[_paymentRef];
        
        emit LockPeriodEnded(_paymentRef);
    }


    /// @notice Transfers paymentToken from payer to MyEscrow smartcontract.  
    /// @param  _paymentRef Reference of the related Invoice.
    /// @dev    Internal function called by openEscrow.
    function _deposit(bytes memory _paymentRef) internal {
        require(invoiceMapping[_paymentRef].paymentToken.transferFrom(
            invoiceMapping[_paymentRef].payer,
            address(this), 
            (invoiceMapping[_paymentRef].amount + invoiceMapping[_paymentRef].feeAmount)
        ), 
        "ERC20EscrowToPay: Can't transfer tokens to Escrow, did you approve ERC20 token first?");
    }


    /// @notice Withdraw the funds from the escrow.  
    /// @param  _paymentRef Reference of the related Invoice.
    /// @dev    Internal function to withdraw funds to a given reciever.
    function _withdraw(bytes memory _paymentRef, address _receiver) internal returns
    (
        bool, 
        string memory
    )
    {
        /// Normal flow, funds are transfered to payee.
        if (invoiceMapping[_paymentRef].amount != 0 ) {
            uint256 _amount = invoiceMapping[_paymentRef].amount;
            
            invoiceMapping[_paymentRef].amount = 0;

            /// Give approval to transfer from ERC20EscrowToPay => ERC20FeeProxy contract.
             invoiceMapping[_paymentRef].paymentToken.approve(address(paymentProxy), _amount + invoiceMapping[_paymentRef].feeAmount);
    
            // Pay the invoice request and fees
            paymentProxy.transferFromWithReferenceAndFee(
                address(invoiceMapping[_paymentRef].paymentToken),
                _receiver,
                _amount, 
                _paymentRef, 
                invoiceMapping[_paymentRef].feeAmount, 
                payable(invoiceMapping[_paymentRef].feeAddress)
            );  

            return (true, "Escrow is completed and funds are paid to the payee.");
        }
        /// Resolve dispute flow, Escrowed funds are transfered to payee.
        if (disputeMapping[_paymentRef].amount != 0) {
            uint256 _amount = disputeMapping[_paymentRef].amount;

            /// reset the amount to prevent reentrency attack.
            disputeMapping[_paymentRef].amount = 0;
            
            disputeMapping[_paymentRef].paymentToken.approve(address(paymentProxy), _amount + disputeMapping[_paymentRef].feeAmount);

            // Pay the request and fees
            paymentProxy.transferFromWithReferenceAndFee(
                address(disputeMapping[_paymentRef].paymentToken),
                _receiver, 
                _amount, 
                _paymentRef, 
                disputeMapping[_paymentRef].feeAmount,
                payable(disputeMapping[_paymentRef].feeAddress)
            );
            
            return (true, "Dispute is resolved and funds are tranfered to the payee.");
        }
        revert WithdrawFailed("Withdraw FAILED");  
    } 

  
    /// @notice Returns the endTime of the tokentimelock contract.   
    /// @param  _paymentRef Reference of the Invoice related.
    function getLockPeriodEndTime(bytes memory _paymentRef) public view OnlyPayer(_paymentRef) returns (uint256 time) {
        return disputeMapping[_paymentRef].tokentimelock.releaseTime();
    }


    /// @notice Removes the ERC20EscrowToPay smartcontract from the blockchain. 
    function removeContract() public OnlyOwner() {
      require(owner == msg.sender, "ERC20EscrowToPay: You are not the Owner, only the owner can execute this call!"); 
        selfdestruct(owner);
    }

}