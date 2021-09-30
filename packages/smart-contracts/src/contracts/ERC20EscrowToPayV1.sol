/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "./interfaces/ERC20FeeProxy.sol";

/**
 * @title   ERC20EscrowToPayV1.
 * @notice  Request Invoice with Escrow.
 */
contract ERC20EscrowToPayV1 {
    IERC20FeeProxy paymentProxy;
    address owner;

    struct Request {
        IERC20 paymentToken; 
        uint256 amount;
        address payee;
        address payer;
        uint256 feeAmount;
        address feeAddress;
        uint256 claimDate;
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
        address tokentimelock;
    }

    mapping(bytes => Request) public requestMapping;
    mapping(bytes => Dispute) public disputeMapping;

    modifier OnlyOwner {
        require(msg.sender == owner, "ERC20EscrowToPay: Not Authorized.");
        _;
    }
    modifier OnlyPayer(bytes memory _paymentRef) {
        require(msg.sender == disputeMapping[_paymentRef].payer, "ERC20EscrowToPay: Not Authorized.");
        _;
    }

    /// Errors
    error WithdrawFailed();

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
    event LockPeriodStarted(bytes indexed paymentReference, address tokentimelock, IERC20 paymentToken);

    /**
     * @notice Emitted when a tokentimelock period is completed successfully.
     * @param paymentReference Reference of the payment related.
     */
    event LockPeriodEnded(bytes indexed paymentReference);
    
    /**
     * @notice Emitted when selfDestruct() is called on this contract.
     * @dev OnlyOwner autorization needed. Removes the contract functionality from the blockchain.
     */
    event ContractRemoved();
    
    constructor(address _paymentProxyAddress) {
        owner = msg.sender;
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
     * @return Success if transaction successeded. 
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
        returns (bool Success)
    {
        require(requestMapping[_paymentRef].amount == 0); 
        // claimDate is used to set a timestamp on when the payee is allowed to execute closeEscrow.
        uint256 _claimDate = block.timestamp + 15778458;
        
        requestMapping[_paymentRef] = Request(
            _paymentToken, 
            _amount,
            _payee,
            msg.sender,
            _feeAmount,
            _feeAddress,
            _claimDate
        );
        
        require(_deposit(_paymentRef));

        emit OpenEscrow(_paymentRef);
        return true;
    }
    
    /**
     * @notice Closes an open escrow and pays the invoice request to it's issuer.
     * @param _paymentRef Reference of the related Invoice.
     * @dev The fees is paid to the fee address at this point.
     */
    function closeEscrow(bytes memory _paymentRef) external {
        require(requestMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No Request found.");
        require(msg.sender == requestMapping[_paymentRef].payer ||
            (msg.sender == requestMapping[_paymentRef].payee  &&
            requestMapping[_paymentRef].claimDate <= block.timestamp),
            "ERC20EscrowToPay: Not authorized!");
        require(_withdraw(_paymentRef, requestMapping[_paymentRef].payee));
        
        delete requestMapping[_paymentRef];

        emit EscrowCompleted(_paymentRef);  
    }
    
    /**
     * @notice Allaws the payer to initiate a dispute if they have an isssue with the payee.
     * @param _paymentRef Reference of the Invoice related.
     */
    function openDispute(bytes memory _paymentRef) external {
        require(msg.sender == requestMapping[_paymentRef].payer, 
            "ERC20EscrowToPay: Not Auhorized!");
        require(requestMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No Request found");
        require(disputeMapping[_paymentRef].amount == 0, 
            "ERC20EscrowToPay: Request is already Frozen");

        disputeMapping[_paymentRef] = Dispute(
            _paymentRef,
            requestMapping[_paymentRef].paymentToken, 
            requestMapping[_paymentRef].amount,
            requestMapping[_paymentRef].payee,
            requestMapping[_paymentRef].payer,
            requestMapping[_paymentRef].feeAmount,
            requestMapping[_paymentRef].feeAddress,
            0,
            0,
            0x0000000000000000000000000000000000000000
        );
        delete requestMapping[_paymentRef];

        emit DisputeOpened(_paymentRef);
    }

    /** 
     * @notice Closes an open dispute and pays the invoice request to it's issuer.
     * @param _paymentRef Reference of the related Invoice.
     * @dev The fees is paid to the fee address.
     */
    function resolveDispute(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        require(msg.sender == disputeMapping[_paymentRef].payer,"ERC20EscrowToPay: Not Authorized.");
        require(disputeMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: Not found.");
        require(_withdraw( _paymentRef, disputeMapping[_paymentRef].payee));
        delete disputeMapping[_paymentRef];
        emit DisputeResolved(_paymentRef);
    }

    /**
     * @notice Creates a tokentimelock contract and returns the escrowed funds to the payer after 12 months.
     * @param _paymentRef Reference of the Invoice related.
     * @dev  The fees are paid to the fee address, disputed funds are locked in tokentimelock contract it the payer as _beneficiary.
     * @return tokentimelock The TokenTimelock contract address.
     */
    function lockDisputedFunds(bytes memory _paymentRef) external OnlyPayer(_paymentRef) returns (address tokentimelock) {
        require(disputeMapping[_paymentRef].amount != 0 && disputeMapping[_paymentRef].tokentimelock == 0x0000000000000000000000000000000000000000);

        /// Tokentimelock endtime is set to block.timestamp + twelve months. 
        uint256 _endtime = block.timestamp + 31556926;

        /// Initiate a new TokenTimelock contract
        TokenTimelock _tokentimelock = new TokenTimelock(
            disputeMapping[_paymentRef].paymentToken,
            disputeMapping[_paymentRef].payer,
            _endtime
        ); 

        disputeMapping[_paymentRef].tokentimelock = address(_tokentimelock);
        // withdraw the funds and pay the fees, using _withdraw(_paymentRef, _receiver).
        require(_withdraw(_paymentRef, disputeMapping[_paymentRef].tokentimelock));

        emit LockPeriodStarted(
            _paymentRef,
            disputeMapping[_paymentRef].tokentimelock,
            disputeMapping[_paymentRef].paymentToken
        );

        return disputeMapping[_paymentRef].tokentimelock;
    }

    /**
     * @notice Withdraw the locked funds from tokentimelock contract and transfer to payer.
     * @param  _paymentRef Reference of the Invoice related.
     */
    function withdrawTimeLockedFunds(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        require(disputeMapping[_paymentRef].tokentimelock != 0x0000000000000000000000000000000000000000 
            && disputeMapping[_paymentRef].amount != 0);

        TokenTimelock _tokentimelock  = TokenTimelock(disputeMapping[_paymentRef].tokentimelock);
        delete disputeMapping[_paymentRef];
        
        /// @dev Closes the tokentimelock and transfers the funds to the beneficiary.
        _tokentimelock.release();
    
        emit LockPeriodEnded(_paymentRef);
    }
    
    /** 
     * @notice Returns the endTime of the tokentimelock contract.   
     * @param  _paymentRef Reference of the Invoice related.
     */
    function getLockPeriodEndTime(bytes memory _paymentRef) external view OnlyPayer(_paymentRef) returns (uint256 time) {
        return TokenTimelock(disputeMapping[_paymentRef].tokentimelock).releaseTime();
    }
    
    /**
     * @notice Transfers paymentToken from payer to MyEscrow smartcontract.  
     * @param _paymentRef Reference of the related Invoice.
     * @dev Internal function to execute transferFrom() payer.
     */
    function _deposit(bytes memory _paymentRef) internal returns (bool result){
        require(requestMapping[_paymentRef].paymentToken.transferFrom(
            requestMapping[_paymentRef].payer,
            address(this), 
            (requestMapping[_paymentRef].amount + requestMapping[_paymentRef].feeAmount)), 
            "ERC20EscrowToPay: Deposit failed, did you approve ERC20 token first?"
        );
        return true; 
    }

    /**
     * @notice Withdraw the funds from the escrow.  
     * @param _paymentRef Reference of the related Invoice.
     * @param _receiver Receiving address.
     * @dev Internal function to pay fees and withdraw funds to a given reciever.
     */
    function _withdraw(bytes memory _paymentRef, address _receiver) internal returns (bool result) {
        /// Normal flow, funds are transfered to receiver.
        if (requestMapping[_paymentRef].amount != 0 ) {
            uint256 _amount = requestMapping[_paymentRef].amount;
            requestMapping[_paymentRef].amount = 0;
            /// Give approval to transfer from ERC20EscrowToPayV1 => ERC20FeeProxy contract.
            requestMapping[_paymentRef].paymentToken.approve(address(paymentProxy), _amount + requestMapping[_paymentRef].feeAmount);
    
            // Pay the invoice request and fees
            paymentProxy.transferFromWithReferenceAndFee(
                address(requestMapping[_paymentRef].paymentToken),
                _receiver,
                _amount, 
                _paymentRef, 
                requestMapping[_paymentRef].feeAmount, 
                requestMapping[_paymentRef].feeAddress
            );  
            return true;
        }
        /// Resolve dispute flow, Escrowed funds are transfered to receiver.
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
                disputeMapping[_paymentRef].feeAddress
            );
            return true;
        }

        revert WithdrawFailed();  
    } 

    /**
     * @notice Used to change the feeAmount and feeAddress of any escrow.
     * @param _paymentRef Reference of the related Invoice.
     * @param _feeAmount The amount of fee to pay.
     * @param _feeAddress The fee recipient.
     * @dev OnlyOwner This is for Housekeeping.
     */
    function changeFeeAndAddress(bytes memory _paymentRef, uint _feeAmount, address _feeAddress) 
        external 
        OnlyOwner()
        returns (bytes memory paymentRef, uint feeAmount, address feeAddress) 
    {
        require(requestMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No Request found."
        );
        
        requestMapping[_paymentRef].feeAmount = _feeAmount;
        requestMapping[_paymentRef].feeAddress = _feeAddress;
        
        return (_paymentRef, requestMapping[_paymentRef].feeAmount, requestMapping[_paymentRef].feeAddress);  
    }
  
    /**
    * @notice ONLY for testnet purposes, removes the smartcontract from the blockchain. 
    * @dev OnlyOwner condition
    * @dev Housekeeping. 
    */
    function removeContract() external OnlyOwner() {
      require( msg.sender == owner, "ERC20EscrowToPay: Only the owner can remove this contract."); 
        selfdestruct(payable(owner));
        emit ContractRemoved();
    }

}