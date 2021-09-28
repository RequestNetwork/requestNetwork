/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "./interfaces/ERC20FeeProxy.sol";

/**
 * @title   ERC20EscrowToPayV1.
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
            msg.sender == disputeMapping[_paymentRef].payer,
            "ERC20EscrowToPay: Only payer can call this function."
        );
        _;
    }

    /// Errors
    error WithdrawFailed(string description);

    /**
     * @notice Emitted when an new escrow is initiated.
     * @param paymentReference Reference of the payment related.
     */
    event OpenEscrow(bytes indexed paymentReference);

    /**
     * @notice Emitted when an non-disputed escrow is completed successfully.
     * @param paymentReference Reference of the payment related.
     */
    event EscrowCompleted(bytes indexed paymentReference);

    /**
     * @notice Emitted when a new dispute is initiated.
     * @param paymentReference Reference of the payment related.
     */
    event DisputeOpened(bytes indexed paymentReference);

    /**
     * @notice Emitted when a dispute has been successfully resolved.
     * @param paymentReference Reference of the payment related.
     */
    event DisputeResolved(bytes indexed paymentReference);

    /**
     * @notice Emitted when a lockDisputedFunds function has been executed successfully.
     * @param paymentReference Reference of the payment related.
     * @param tokentimelock address of the new tokentimelock contract.
     * @param paymentToken address of the timelocked ERC20 token.
     */
    event LockPeriodStarted(bytes indexed paymentReference, TokenTimelock tokentimelock, IERC20 paymentToken);

    /**
     * @notice Emitted when a tokentimelock period is completed successfully.
     * @param paymentReference Reference of the payment related.
     */
    event LockPeriodEnded(bytes indexed paymentReference);
    
    constructor(address payable _paymentProxyAddress) {
        owner = payable(msg.sender);
        paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }

    /// @notice recieve function reverts and returns the funds to the sender.
    receive() external payable {
        revert("not payable receive");
    }

    /** 
     * @notice Stores the invoice details in struct, then transfers the funds to this Escrow contract.
     * @param _paymentRef Reference of the payment related.
     * @param _paymentToken Address of the ERC20 token to deposit.
     * @param _payee Transfer recipient.
     * @param _amount Amount to transfer.
     * @param _feeAmount The amount of fee to pay.
     * @param _feeAddress The fee recipient.
     * @dev The fees amount is transfered from the payer's account.
     * @return success if transaction successeded. 
     */
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
        returns (bool success)
    {
        require(invoiceMapping[_paymentRef].amount == 0, 
            "ERC20EscrowToPayV1: This invoice already exists, is this the correct paymentReference?"
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
        
        require(_deposit(_paymentRef),"OpenEscrow: Call to _deposit failed!");

        emit OpenEscrow(_paymentRef);
        return true;
    }
    
    /**
     * @notice Closes an open escrow and pays the invoice request to it's issuer.
     * @param _paymentRef Reference of the related Invoice.
     * @dev The fees is paid to the fee address at this point.
     */
    function closeEscrow(bytes memory _paymentRef) external {
        require(invoiceMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: Payment reference does not exist");
        require(msg.sender == invoiceMapping[_paymentRef].payer ||
            (msg.sender == invoiceMapping[_paymentRef].payee  &&
            invoiceMapping[_paymentRef].claimDate <= block.timestamp),
            "ERC20EscrowToPay: Only the payer or payee can excecute this call!"
        );
        require(_withdraw(_paymentRef, invoiceMapping[_paymentRef].payee), "CloseEscrow: Withdraw failed!");
        
        delete invoiceMapping[_paymentRef];

        emit EscrowCompleted(_paymentRef);  
    }
    
    /**
     * @notice Allaws the payer to initiate a dispute if they have an isssue with the payee.
     * @param _paymentRef Reference of the Invoice related.
     */
    function openDispute(bytes memory _paymentRef) external {
        require(msg.sender == invoiceMapping[_paymentRef].payer, 
            "ERC20EscrowToPay: You are not the valid payer. Only the valid payer can open a dispute!");
        require(invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No dispute found, Wrong payment reference?");
        require(disputeMapping[_paymentRef].amount == 0, "ERC20EscrowToPay: A dispute already exists, is this the correct paymentRef?");

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
            TokenTimelock(0x0000000000000000000000000000000000000000)
        );
        delete invoiceMapping[_paymentRef];

        emit DisputeOpened(_paymentRef);
    }

    /** 
     * @notice Closes an open dispute and pays the invoice request to it's issuer.
     * @param _paymentRef Reference of the related Invoice.
     * @dev The fees is paid to the fee address.
     */
    function resolveDispute(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        require(msg.sender == disputeMapping[_paymentRef].payer,
            "ERC20EscrowToPayV1: Only the payer can resolve an active dispute."
        );
        require(disputeMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPayV1: No open dispute found, wrong payment reference?"
        );
        require(_withdraw( _paymentRef, disputeMapping[_paymentRef].payee), 
            "ResolveDispute: call to _withdraw() Failed"
        ); 
        delete disputeMapping[_paymentRef];
        
        emit DisputeResolved(_paymentRef);
    }

    /**
     * @notice Creates a tokentimelock contract and returns the escrowed funds to the payer after 12 months.
     * @param _paymentRef Reference of the Invoice related.
     * @dev  The fees is paid to the fee address, disputed funds are locked in tokentimelock contract ith the payer as _beneficiary.
     * @return tokentimelock The TokenTimelock contract address.
     */
    function lockDisputedFunds(bytes memory _paymentRef) external OnlyPayer(_paymentRef) returns (address tokentimelock) {
        require(disputeMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: No dispute found, wrong paymentRef?");
        require(disputeMapping[_paymentRef].tokentimelock == TokenTimelock(0x0000000000000000000000000000000000000000), 
                "ERC20EscrowToPay: No timelock contract found!"
        );

        /// Tokentimelock _lockDuration is set to 12 months.
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
        require(_withdraw(_paymentRef, address(disputeMapping[_paymentRef].tokentimelock)),
        "lockDisputedFunds: Call to _withdraw failed!"
        );

        emit LockPeriodStarted(
            _paymentRef,
            disputeMapping[_paymentRef].tokentimelock,
            disputeMapping[_paymentRef].paymentToken
        );

        return address(disputeMapping[_paymentRef].tokentimelock);
    }

    /**
     * @notice Withdraw the locked funds from tokentimelock contract and transfer to payer.
     * @param  _paymentRef Reference of the Invoice related.
     */
    function withdrawTimeLockedFunds(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        require(disputeMapping[_paymentRef].tokentimelock != TokenTimelock(0x0000000000000000000000000000000000000000) 
            && disputeMapping[_paymentRef].amount != 0,
            "ERC20EscrowToPay: No timelock contract found!"
        );

        TokenTimelock _tokentimelock = disputeMapping[_paymentRef].tokentimelock;
        delete disputeMapping[_paymentRef];
        
        /// @dev Closes the tokentimelock and transfers the funds to the payer.
        _tokentimelock.release();
    
        emit LockPeriodEnded(_paymentRef);
    }
    
    /** 
     * @notice Returns the endTime of the tokentimelock contract.   
     * @param  _paymentRef Reference of the Invoice related.
     */
    function getLockPeriodEndTime(bytes memory _paymentRef) external view OnlyPayer(_paymentRef) returns (uint256 time) {
        return disputeMapping[_paymentRef].tokentimelock.releaseTime();
    }
    
    /**
     * @notice Transfers paymentToken from payer to MyEscrow smartcontract.  
     * @param _paymentRef Reference of the related Invoice.
     * @dev Internal function to execute transferFrom() payer.
     */
    function _deposit(bytes memory _paymentRef) internal returns (bool result){
        require(invoiceMapping[_paymentRef].paymentToken.transferFrom(
            invoiceMapping[_paymentRef].payer,
            address(this), 
            (invoiceMapping[_paymentRef].amount + invoiceMapping[_paymentRef].feeAmount)), 
            "_deposit: Can't _deposit tokens to Escrow, did you approve ERC20 token first?"
        );
        return true; 
    }

    /**
     * @notice Withdraw the funds from the escrow.  
     * @param _paymentRef Reference of the related Invoice.
     * @dev Internal function to pay fees and withdraw funds to a given reciever.
     */
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

    /**
     * @notice Used to change the feeAmount and feeAddress of any escrow.
     * @param _paymentRef Reference of the related Invoice.
     * @param _feeAmount The amount of fee to pay.
     * @param _feeAddress The fee recipient.
     */
    function changeFeeAndAddress(bytes memory _paymentRef, uint _feeAmount, address _feeAddress) 
        external 
        OnlyOwner()
        returns (bytes memory paymentRef, uint feeAmount, address feeAddress) 
    {
        require(invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: Can't find Invoice, wrong payment reference!"
        );
        
        invoiceMapping[_paymentRef].feeAmount = _feeAmount;
        invoiceMapping[_paymentRef].feeAddress = payable(_feeAddress);
        
        return (_paymentRef, invoiceMapping[_paymentRef].feeAmount, invoiceMapping[_paymentRef].feeAddress);  
    }
  
    /**
    * @notice ONLY for testnet purposes, removes the smartcontract from the blockchain. 
    * @dev OnlyOwner condition 
    */
    function removeContract() external OnlyOwner() {
      require( msg.sender == owner, "ERC20EscrowToPay: You are not the Owner, only the owner can execute this call!"); 
        selfdestruct(owner);
    }

}