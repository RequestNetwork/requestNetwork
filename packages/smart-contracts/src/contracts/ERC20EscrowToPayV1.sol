/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "./interfaces/ERC20FeeProxy.sol";

/**
 * @title   ERC20EscrowToPay.
 * @author  Ivo Garofalo.
 * @notice  Request Invoice with Escrow.
 */
contract ERC20EscrowToPayV1 {
    IERC20FeeProxy paymentProxy;
    address payable owner;

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

    mapping(bytes => Invoice) public invoiceMapping;
    mapping(bytes => Dispute) public disputeMapping;

    modifier OnlyOwner {
        require(
            msg.sender == owner,
            "ERC20EscrowToPay: Only owner can call this function."
        );
        _;
    }
    modifier OnlyPayer(bytes memory _paymentRef) {
        require(
            msg.sender == invoiceMapping[_paymentRef].payer || 
            msg.sender == disputeMapping[_paymentRef].payer,
            "ERC20EscrowToPay: Only payer can call this function."
        );
        _;
    }

    /// Errors
    error WithdrawFailed(string description);

    /// @notice Emitted when an new escrow is initiated.
    /// @param paymentReference Reference of the payment related.
    event OpenEscrow(bytes indexed paymentReference);

    /// @notice Emitted when an non-disputed escrow is completed successfully.
    /// @param paymentReference Reference of the payment related.
    event EscrowCompleted(bytes indexed paymentReference);

    /// @notice Emitted when a new dispute is initiated.
    /// @param paymentReference Reference of the payment related.
    event DisputeOpened(bytes indexed paymentReference);

    /// @notice Emitted when a dispute has been successfully resolved.
    /// @param paymentReference Reference of the payment related.
    event DisputeResolved(bytes indexed paymentReference);

    /// @notice Emitted when a lockDisputedFunds function has been executed successfully.
    /// @param paymentReference Reference of the payment related.
    /// @param tokentimelock address of the new tokentimelock contract.
    /// @param paymentToken address of the timelocked ERC20 token.  
    event LockPeriodStarted(bytes indexed paymentReference, TokenTimelock tokentimelock, IERC20 paymentToken);

    /// @notice Emitted when a tokentimelock period is completed successfully.
    /// @param paymentReference Reference of the payment related.
    event LockPeriodEnded(bytes indexed paymentReference);
    
    constructor(address payable _paymentProxyAddress) {
        owner = payable(msg.sender);
        paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }

    /// @notice recieve function reverts and returns the funds to the sender.
    receive() external payable {
        revert("not payable receive");
    }

    /// @notice Stores the invoice details in struct, then transfers the funds to this Escrow contract.
    /// @param _paymentRef Reference of the payment related
    /// @param _paymentToken Address of the ERC20 token smart contract
    /// @param _payee Transfer recipient
    /// @param _amount Amount to transfer
    /// @param _feeAmount The amount of the payment fee
    /// @param _feeAddress The fee recipient
    function openEscrow(
        bytes memory _paymentRef,
        IERC20 _paymentToken,
        uint256 _amount,
        address _payee,
        uint256 _feeAmount,
        address _feeAddress
    ) 
        external
        payable
    {
        require(invoiceMapping[_paymentRef].amount == 0, 
            "ERC20EscrowToPayV1: This invoice already exists, is this the correct paymentReference?"
        ); 
        require(_deposit(_paymentRef),
            "ERC20EscrowToPayV1: Couldn't transfer the funds, transaction failed!"
        );

        uint256 sixMonths = 15778458;
        // claimDate is used to set a timestamp on when the payee can execute closeEscrow.
        uint256 _claimDate = block.timestamp + sixMonths;
        
        invoiceMapping[_paymentRef] = Invoice(
        _paymentToken, 
        _amount,
        _payee,
        msg.sender,
        _feeAmount,
        _feeAddress,
        _claimDate
        );

        emit OpenEscrow(_paymentRef);
        return;
    }
    /// @notice Close a dispute and transfer the funds to the payee account.
    /// @dev Executes a call to release() on the tokentimelock contract.
    /// @param _paymentRef Reference of the related Invoice. 
    function resolveDispute(bytes memory _paymentRef) external {
        require(msg.sender == disputeMapping[_paymentRef].payer,"ERC20EscrowToPayV1: Only the payer can resolve an active dispute.");
        require(disputeMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: No active dispute found, wrong payment reference?");

        _withdraw( _paymentRef, disputeMapping[_paymentRef].payee); 

        // delete paymentreference from disputeMapping
        delete disputeMapping[_paymentRef];

        emit DisputeResolved(_paymentRef);
    }

    /// Withdraw the funds of escrow from a given _paymentRef.
    /// @param  _paymentRef Reference of the payment related.
    /// @dev    require payer is msg.sender.
    function closeEscrow(bytes memory _paymentRef) external {
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

        emit EscrowCompleted(_paymentRef);  
    }

    /// @notice Used to change the feeAmount and feeAddress of any escrow.
    function changeFeeAndAddress(bytes memory _paymentRef, uint _feeAmount, address _feeAddress) 
        external 
        OnlyOwner()
        returns (bytes memory paymentRef, uint feeAmount, address feeAddress) 
    {
        require(invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: Can't find Invoice, wrong payment reference!");
        
        invoiceMapping[_paymentRef].feeAmount = _feeAmount;
        invoiceMapping[_paymentRef].feeAddress = payable(_feeAddress);
        
        return (_paymentRef, invoiceMapping[_paymentRef].feeAmount, invoiceMapping[_paymentRef].feeAddress);  
    }

    /// @notice Opens a dispute.
    /// @param _paymentRef Reference of the Invoice related.
    function openDispute(bytes memory _paymentRef) public payable OnlyPayer(_paymentRef) {
        require(msg.sender == invoiceMapping[_paymentRef].payer, 
            "ERC20EscrowToPay: You are not the valid payer. Only the valid payer can open a dispute!");
        require(invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No dispute found, Wrong payment reference?");
        require(disputeMapping[_paymentRef].amount == 0, 
            "ERC20EscrowToPay: A dispute already exists, is this the correct paymentRef?");

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
            "0x"
        );

        /// Deletes the invoiceMapping
        delete invoiceMapping[_paymentRef];

        emit DisputeOpened(_paymentRef);
    }

    /// @notice Creates a tokentimelock contract and returns the escrowed funds to the payer after 12 months.
    /// @dev Pays the fees and transferes funds to timelockcontract.
    function lockDisputedFunds(bytes memory _paymentRef) public OnlyPayer(_paymentRef) returns (address) {
        require(disputeMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: No dispute found, wrong paymentRef?");
        require(disputeMapping[_paymentRef].tokentimelock == "0x", 
        "ERC20EscrowToPay: No timelock contract found!");

        /// Tokentimelock duration is set to 12 months
        uint256 _lockDuration = 31556926; 

        uint256 _endtime = block.timestamp + _lockDuration;

        /// Initiate a new tokentimelock contract
        TokenTimelock _tokentimelock = new TokenTimelock(
            IERC20(disputeMapping[_paymentRef].paymentToken),
            disputeMapping[_paymentRef].payer,
            _endtime
        ); 
        
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

        return address(disputeMapping[_paymentRef].tokentimelock);
    }

    /// @notice Transfer funds from tokentimelock contract => payer.
    /// @param  _paymentRef Reference of the Invoice related.
    function withdrawLockedFunds(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        require(
            disputeMapping[_paymentRef].tokentimelock != "0x" &&
            disputeMapping[_paymentRef].amount != 0,
            "ERC20EscrowToPay: No timelock contract found!"
        );

        // close tokentimelock contract and return the escrowed funds to the payer.
        disputeMapping[_paymentRef].tokentimelock.release();
        
        // delete paymentreference from disputeMapping.
        delete disputeMapping[_paymentRef];
        
        emit LockPeriodEnded(_paymentRef);
    }

    /// @notice Transfers paymentToken from payer to MyEscrow smartcontract.  
    /// @param  _paymentRef Reference of the related Invoice.
    /// @dev    Internal function called by openEscrow.
    function _deposit(bytes memory _paymentRef) internal returns (bool result){
        require(invoiceMapping[_paymentRef].paymentToken.transferFrom(
            invoiceMapping[_paymentRef].payer,
            address(this), 
            (invoiceMapping[_paymentRef].amount + invoiceMapping[_paymentRef].feeAmount)), 
            "ERC20EscrowToPay: Can't transfer tokens to Escrow, did you approve ERC20 token first?"
        );
        return true; 
    }


    /// @notice Withdraw the funds from the escrow.  
    /// @param  _paymentRef Reference of the related Invoice.
    /// @dev    Internal function to withdraw funds to a given reciever.
    function _withdraw(bytes memory _paymentRef, address _receiver) internal returns (bool result) {
        /// Normal flow, funds are transfered to payee.
        if (invoiceMapping[_paymentRef].amount != 0 ) {
            uint256 _amount = invoiceMapping[_paymentRef].amount;
            
            invoiceMapping[_paymentRef].amount = 0;

            /// Give approval to transfer from ERC20EscrowToPayV1 => ERC20FeeProxy contract.
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
            return true;
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
            return true;
        }

        revert WithdrawFailed("Withdraw FAILED");  
    } 

  
    /// @notice Returns the endTime of the tokentimelock contract.   
    /// @param  _paymentRef Reference of the Invoice related.
    function getLockPeriodEndTime(bytes memory _paymentRef) external view OnlyPayer(_paymentRef) returns (uint256 time) {
        return disputeMapping[_paymentRef].tokentimelock.releaseTime();
    }


    /// @notice ONLY for testnet purposes, removes the smartcontract from the blockchain. 
    function removeContract() external OnlyOwner() {
      require(owner == msg.sender, "ERC20EscrowToPay: You are not the Owner, only the owner can execute this call!"); 
        selfdestruct(owner);
    }

}