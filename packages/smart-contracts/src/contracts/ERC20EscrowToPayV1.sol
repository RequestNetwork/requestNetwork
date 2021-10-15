/// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

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
        uint256 emergencyClaim;
        bool isFrozen;
        
    }

    /**
    * Mapping is used to store the Requests in escrow. 
    */
    mapping(bytes => Request) public requestMapping;

    /**
    * Modifier checks if msg.sender is one of the requestpayment payer or payee.
    * @param _paymentRef Reference of the requestpayment related.
    * @dev It requires msg.sender to be equal to requestMapping[_paymentRef].payer. 
    */
    modifier OnlyPayers(bytes memory _paymentRef) {
        require(msg.sender == requestMapping[_paymentRef].payer ||
            msg.sender == requestMapping[_paymentRef].payee &&
            block.timestamp >= requestMapping[_paymentRef].emergencyClaim, 
            "Not Authorized.");
        _;
    }

    /**
    * Modifier checks if the request already is in escrow.
    * @param _paymentRef Reference of the payment related.
    * @dev It requires the requestMapping[_paymentRef].amount to be zero.
    */
    modifier IsNotInEscrow(bytes memory _paymentRef) {
        require(requestMapping[_paymentRef].amount == 0, "Request already in Escrow.");
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
    
    
    constructor(address _paymentProxyAddress) {
        paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }

    /// @notice receive function reverts and returns the funds to the sender.
    receive() external payable {
        revert("not payable receive");
    }

    /** 
    * @notice Stores the invoice details in struct, then transfers the funds to this Escrow contract.
    * @param _tokenAddress Address of the ERC20 token smart contract.
    * @param _to Address to the payment issuer.
    * @param _amount Amount to transfer.
    * @param _paymentRef Reference of the payment related.
    * @param _feeAmount Amount of fee to be paid.
    * @param _feeAddress Address to where the fees will be paid.
    * @dev Uses modifier IsNotInEscrow.
    * @dev Uses transferFromWithReferenceAndFee() to transfer funds from the msg.sender, 
    * into the escrow and pay the fees.
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
        /// _emergencyClaim is set with block.timestamp + six months
        uint256 _emergencyClaim = block.timestamp + 15778458;
        
        requestMapping[_paymentRef] = Request(
            IERC20(_tokenAddress),
            _to,
            msg.sender,
            _amount,
            0,
            _emergencyClaim,
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
     * @notice Locks the request funds for 12 months.
     * @param _paymentRef Reference of the Invoice related.
     * @dev Uses modifiers OnlyPayer and IsNotFrozen.
     */
    function FreezeRequest(bytes memory _paymentRef) external OnlyPayers(_paymentRef) IsNotFrozen(_paymentRef) {
        requestMapping[_paymentRef].isFrozen = true;
        /// unlockDate is set with block.timestamp + twelve months. 
        requestMapping[_paymentRef].unlockDate = block.timestamp + 31556926;

        emit RequestFrozen(_paymentRef);
    }

    /**
     * @notice Closes an open escrow and pays the invoice request to it's payee.
     * @param _paymentRef Reference of the related Invoice.
     * @dev Uses modifiers IsInEscrow, IsNotFrozen and OnlyPayer.
     */
    function payRequestFromEscrow(bytes memory _paymentRef) 
        external 
        IsInEscrow(_paymentRef) 
        IsNotFrozen(_paymentRef) 
        OnlyPayers(_paymentRef) 
    {
        require(_withdraw(_paymentRef, requestMapping[_paymentRef].payee), "Withdraw Failed!");
        emit RequestWithdrawnFromEscrow(_paymentRef);  
    }

    /**
     * @notice Withdraw the locked funds from escow contract and transfers back to payer after 12 months.
     * @param  _paymentRef Reference of the Invoice related.
     * @dev requires that the request .isFrozen = true and .unlockDate to
     * be lower or equal to block.timestamp.
     */
    function refundFrozenFunds(bytes memory _paymentRef) external {
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
    function _withdraw(bytes memory _paymentRef, address _receiver) internal returns (bool result) {       
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