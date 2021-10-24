/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./lib/SafeERC20.sol";
import "./interfaces/ERC20FeeProxy.sol";

/**
 * @title   ERC20EscrowToPay
 * @notice  Request Invoice with Escrow.
 */
contract ERC20EscrowToPay {
    using SafeERC20 for IERC20;

    IERC20FeeProxy public paymentProxy;

    struct Request {
        IERC20 tokenAddress;
        address payee;
        address payer;
        uint256 amount;
        uint256 unlockDate;
        uint256 emergencyClaimDate;
        bool emergencyState;
        bool isFrozen;
    }

    /**
    * Mapping is used to store the Requests in escrow. 
    */
    mapping(bytes => Request) public requestMapping;

    /**
    * Modifier checks if msg.sender is the requestpayment payer.
    * @param _paymentRef Reference of the requestpayment related.
    * @dev It requires msg.sender to be equal to requestMapping[_paymentRef].payer. 
    */
    modifier OnlyPayer(bytes memory _paymentRef) {
        require(msg.sender == requestMapping[_paymentRef].payer, "Not Authorized.");
        _;
    }
    /**
    * Modifier checks if msg.sender is the requestpayment payee.
    * @param _paymentRef Reference of the requestpayment related.
    * @dev It requires msg.sender to be equal to requestMapping[_paymentRef].payee. 
    */
    modifier OnlyPayee(bytes memory _paymentRef) {
        require(msg.sender == requestMapping[_paymentRef].payee, "Not Authorized."); 
        _;
    }

    /**
    * Modifier checks that the request is not already is in escrow.
    * @param _paymentRef Reference of the payment related.
    * @dev It requires the requestMapping[_paymentRef].amount to be zero.
    */
    modifier IsNotInEscrow(bytes memory _paymentRef) {
        require(requestMapping[_paymentRef].amount == 0, "Already in Escrow.");
        _;
    }

    /**
    * Modifier checks if the request already is in escrow.
    * @param _paymentRef Reference of the payment related.
    * @dev It requires the requestMapping[_paymentRef].amount to have a value above zero.
    */
    modifier IsInEscrow(bytes memory _paymentRef) {
        require(requestMapping[_paymentRef].amount > 0, "Not in escrow.");
        _;
    }

    /**
    * Modifier checks if the request already is in emergencyState.
    * @param _paymentRef Reference of the payment related.
    * @dev It requires the requestMapping[_paymentRef].emergencyState to be false.
    */
    modifier IsNotInEmergencyState(bytes memory _paymentRef) {
        require(!requestMapping[_paymentRef].emergencyState, "In emergencyState");
        _;
    }

    /**
    * Modifier checks that the request is not frozen.
    * @param _paymentRef Reference of the payment related.
    * @dev It requires the requestMapping[_paymentRef].isFrozen to be false.
    */
    modifier IsNotFrozen(bytes memory _paymentRef) {
        require(!requestMapping[_paymentRef].isFrozen, "Request Frozen!");
        _;
    }

    /**
     * @notice Emitted when an new escrow is initiated.
     * @param paymentReference Reference of the payment related.
     */
    event RequestInEscrow(bytes indexed paymentReference);

    /**
     * @notice Emitted when a request has been withdraw.
     * @param paymentReference Reference of the payment related.
     */
    event RequestWithdrawnFromEscrow(bytes indexed paymentReference);

    /**
     * @notice Emitted when a request has been frozen.
     * @param paymentReference Reference of the payment related.
     */
    event RequestFrozen(bytes indexed paymentReference);
    
    /**
     * @notice Emitted when a frozen request has been refunded.
     * @param paymentReference Reference of the payment related.
     */
    event RefundedFrozenFunds(bytes indexed paymentReference);
 
    /**
     * @notice Emitted when an emergency claim is initiated by payee.
     * @param paymentReference Reference of the payment related.
     */
    event InitiatedEmergencyClaim(bytes indexed paymentReference);

    /**
     * @notice Emitted when an emergency claim is completed successfully.
     * @param paymentReference Reference of the payment related.
     */
    event EmergencyClaimComplete(bytes indexed paymentReference);

    /**
     * @notice Emitted when an emergency claim has been reverted by payer.
     * @param paymentReference Reference of the payment related.
     */
    event RevertedEmergencyClaim(bytes indexed paymentReference);

    /**
     * @notice Emitted when a delegatecall has been executed.
     * @param tokenAddress Address of the ERC20 token smart contract.
     * @param to Address to the payment issuer, alias payee.
     * @param amount Amount to transfer.
     * @param paymentReference Reference of the payment related.
     * @param feeAmount Amount of fee to be paid.
     * @param feeAddress Address to where the fees will be paid.
     */
    event TransferWithReferenceAndFee(
        address tokenAddress,
        address to,
        uint256 amount,
        bytes indexed paymentReference,
        uint256 feeAmount,
        address feeAddress
    );

    constructor(address _paymentProxyAddress) {
        paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }

    /**
     * @notice receive function reverts and returns the funds to the sender.
     */ 
    receive() external payable {
        revert("not payable receive");
    }

    /** 
    * @notice Stores the invoice details, and transfers funds to this Escrow contract.
    * @param _tokenAddress Address of the ERC20 token smart contract.
    * @param _to Address to the payment issuer, alias payee.
    * @param _amount Amount to transfer.
    * @param _paymentRef Reference of the payment related.
    * @param _feeAmount Amount of fee to be paid.
    * @param _feeAddress Address to where the fees will be paid.
    * @dev Uses modifier IsNotInEscrow.
    * @dev Uses transferFromWithReferenceAndFee() to transfer funds from the msg.sender, 
    * into the escrow and pay the fees.
    * @dev emergencyClaimDate is set with block.timestamp + six months.
    */
    function payEscrow(
        address _tokenAddress,
        address _to,
        uint256 _amount,
        bytes memory _paymentRef,
        uint256 _feeAmount,
        address _feeAddress
    )   
        external 
        IsNotInEscrow(_paymentRef)
    {   
        if (_amount == 0 || _feeAmount == 0) revert("Zero Value");

        requestMapping[_paymentRef] = Request(
            IERC20(_tokenAddress),
            _to,
            msg.sender,
            _amount,
            0,
            0,
            false,
            false
        );
        
        (bool status, ) = address(paymentProxy).delegatecall(
        abi.encodeWithSignature(
        "transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)",
            _tokenAddress,
            address(this),
            _amount,
            _paymentRef,
            _feeAmount,
            _feeAddress
            )
        );
        require(status, "transferFromWithReferenceAndFee failed");

        emit RequestInEscrow(_paymentRef);
    }
    
    /**
     * @notice Locks the request funds for 12 months and cancel any emergency claim.
     * @param _paymentRef Reference of the Invoice related.
     * @dev Uses modifiers OnlyPayer and IsNotFrozen.
     * @dev unlockDate is set with block.timestamp + twelve months..
     */
    function freezeRequest(bytes memory _paymentRef) 
        external
        OnlyPayer(_paymentRef)
        IsInEscrow(_paymentRef)
        IsNotFrozen(_paymentRef)
    {
        if (requestMapping[_paymentRef].emergencyState) 
        {
            requestMapping[_paymentRef].emergencyState = false;
            requestMapping[_paymentRef].emergencyClaimDate = 0;
            emit RevertedEmergencyClaim(_paymentRef);
        }

        requestMapping[_paymentRef].isFrozen = true; 
        requestMapping[_paymentRef].unlockDate = block.timestamp + 52 weeks;

        emit RequestFrozen(_paymentRef);
    }

    /**
     * @notice Closes an open escrow and pay the invoice request to payee.
     * @param _paymentRef Reference of the related Invoice.
     * @dev Uses modifiers IsInEscrow, IsNotFrozen and OnlyPayer.
     */
    function payRequestFromEscrow(bytes memory _paymentRef) 
        external 
        OnlyPayer(_paymentRef) 
        IsInEscrow(_paymentRef)
        IsNotInEmergencyState(_paymentRef)
        IsNotFrozen(_paymentRef) 
    {
        require(_withdraw(_paymentRef, requestMapping[_paymentRef].payee), "Withdraw Failed!");

        emit RequestWithdrawnFromEscrow(_paymentRef);  
    }

    /**
     * @notice Allows the payee to initiate an emergency claim after a six months lockperiod .
     * @param _paymentRef Reference of the related Invoice.
     * @dev Uses modifiers IsInEscrow, IsNotFrozen.
     */
    function initiateEmergencyClaim(bytes memory _paymentRef) 
        external
        OnlyPayee(_paymentRef)
        IsInEscrow(_paymentRef)
        IsNotInEmergencyState(_paymentRef)
        IsNotFrozen(_paymentRef)
    {
        requestMapping[_paymentRef].emergencyClaimDate = block.timestamp + 24 weeks;
        requestMapping[_paymentRef].emergencyState = true;

        emit InitiatedEmergencyClaim(_paymentRef);
    }

    /**
     * @notice Allows the payee claim funds after a six months emergency lockperiod .
     * @param _paymentRef Reference of the related Invoice.
     * @dev Uses modifiers IsInEscrow, IsNotFrozen.
     */
    function completeEmergencyClaim(bytes memory _paymentRef) 
        external
        OnlyPayee(_paymentRef)
        IsInEscrow(_paymentRef)
        IsNotFrozen(_paymentRef)
    {
        require(requestMapping[_paymentRef].emergencyState && 
            requestMapping[_paymentRef].emergencyClaimDate <= block.timestamp, 
            "Not yet!"
        );

        requestMapping[_paymentRef].emergencyState = false;
        requestMapping[_paymentRef].emergencyClaimDate = 0;

        require(_withdraw(_paymentRef, requestMapping[_paymentRef].payee), "Withdraw failed!");

        emit EmergencyClaimComplete(_paymentRef);
    }

     /**
     * @notice Reverts the emergencyState to false and cancels emergencyClaim.
     * @param _paymentRef Reference of the Invoice related.
     * @dev Uses modifiers OnlyPayer and IsNotFrozen.
     * @dev Resets emergencyState to false and emergencyClaimDate to zero.
     */
    function revertEmergencyClaim(bytes memory _paymentRef) 
        external
        OnlyPayer(_paymentRef)
        IsInEscrow(_paymentRef)
        IsNotFrozen(_paymentRef)
    {
        require(requestMapping[_paymentRef].emergencyState, "EmergencyClaim NOT initiated"); 
        requestMapping[_paymentRef].emergencyState = false;
        requestMapping[_paymentRef].emergencyClaimDate = 0;
        
        emit RevertedEmergencyClaim(_paymentRef);
    }

    /**
     * @notice Refunds to payer after twelve months and delete the escrow.
     * @param  _paymentRef Reference of the Invoice related.
     * @dev requires that the request .isFrozen = true and .unlockDate to
     * be lower or equal to block.timestamp.
     */
    function refundFrozenFunds(bytes memory _paymentRef) 
        external 
        IsInEscrow(_paymentRef)
        IsNotInEmergencyState(_paymentRef)
    {
        require(requestMapping[_paymentRef].isFrozen, "Not frozen!");
        require(requestMapping[_paymentRef].unlockDate <= block.timestamp, "Not Yet!");

        requestMapping[_paymentRef].isFrozen = false;
        
        require(_withdraw(_paymentRef, requestMapping[_paymentRef].payer), "Withdraw Failed!");

        emit RefundedFrozenFunds(_paymentRef);
    }
    
     /**
     * @notice Withdraw the funds from the escrow.  
     * @param _paymentRef Reference of the related Invoice.
     * @param _receiver Receiving address.
     * @dev Internal function to withdraw funds from escrow, to a given reciever.
     */
    function _withdraw(bytes memory _paymentRef, address _receiver)
        internal
        IsInEscrow(_paymentRef)
        IsNotInEmergencyState(_paymentRef)
        IsNotFrozen(_paymentRef)
        returns (bool result) 
    {
        require(_receiver != address(0), "Transfer to ZERO adddress");

        uint256 _amount = requestMapping[_paymentRef].amount;
        requestMapping[_paymentRef].amount = 0;
        
        requestMapping[_paymentRef].tokenAddress.safeTransfer(
            _receiver,
            _amount
        );
        
        delete requestMapping[_paymentRef];
        
        return true;
    } 

}