/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ERC20FeeProxy.sol";

/**
 * @title   ERC20EscrowToPayV2.
 * @notice  Request Invoice with Escrow.
 */
contract ERC20EscrowToPayV2 {
    IERC20FeeProxy paymentProxy;
    address private owner;
    address public feeAddress;

    struct Request {
        IERC20 tokenAddress;
        address _from;
        uint256 amount;
        bool isFrozen;
        uint unlockDate;
    }

    mapping(bytes => Request) public requestMapping;

    modifier OnlyPayer(bytes memory _paymentRef) {
        require(msg.sender == requestMapping[_paymentRef]._from, "Not Authorized.");
        _;
    }
    modifier IsNotInEscrow(bytes memory _paymentRef) {
        require(requestMapping[_paymentRef].amount == 0,
            "Request already in escrow.");
        _;
    }
    modifier IsInEscrow(bytes memory _paymentRef) {
        require(requestMapping[_paymentRef].amount != 0 && requestMapping[_paymentRef].unlockDate >= 0, 
            "Not in escrow.");
        _;
    }

    /// Errors
    error WithdrawFailed();
    error RequestFrozen(string description);

    /**
     * @notice Emitted when an new escrow is initiated.
     * @param paymentReference Reference of the payment related.
     */
    event RequestInEscrow(bytes indexed paymentReference);

    /**
     * @notice Emitted when a lockDisputedFunds function has been executed successfully.
     * @param paymentReference Reference of the payment related.
     */
    event RequestPaidFromEscrow(bytes indexed paymentReference);

    /**
     * @notice Emitted when a tokentimelock period is completed successfully.
     * @param paymentReference Reference of the payment related.
     */
    event RequestFreezed(bytes indexed paymentReference);
    
    /**
     * @notice Emitted when selfDestruct() is called on this contract.
     * @dev OnlyOwner autorization needed. Removes the contract functionality from the blockchain.
     */
    event ContractRemoved();
    
    constructor(address _paymentProxyAddress, address _feeAddress) {
        owner = msg.sender;
        feeAddress = _feeAddress;
        paymentProxy = IERC20FeeProxy(_paymentProxyAddress);
    }

    /// @notice recieve function reverts and returns the funds to the sender.
    receive() external payable {
        revert("not payable receive");
    }

    /** 
    * @notice Stores the invoice details in struct, then transfers the funds to this Escrow contract.
    * @param _tokenAddress Address of the ERC20 token smart contract.
    * @param _amount Amount to transfer.
    * @param _paymentRef Reference of the payment related.
    * @param _feeAmount The amount of the payment fee.
    * @dev Uses transferFromWithReferenceAndFee() to pay to escrow and fees.
    */
    function PayRequestToEscrow(address _tokenAddress, uint256 _amount, bytes memory _paymentRef, uint256 _feeAmount) external {

        requestMapping[_paymentRef] = Request(
            IERC20(_tokenAddress),
            msg.sender,
            _amount,
            false,
            0
        );
        
        _deposit(_paymentRef, _feeAmount);
        emit RequestInEscrow(_paymentRef);
    }
    
    /**
     * @notice Closes an open escrow and pays the invoice request to it's issuer.
     * @param _paymentRef Reference of the related Invoice.
     * @param _to Address of the receiver.
     * @dev Uses transferFromWithReferenceAndFee() to pay _to without fees.
     */
    function payRequestFromEscrow(bytes memory _paymentRef, address _to, uint256 _feeAmount) 
        external
        IsInEscrow(_paymentRef) 
        OnlyPayer(_paymentRef) 
    {
        /// Give approval to transfer from ERC20EscrowToPayV1 => ERC20FeeProxy contract.
        IERC20(requestMapping[_paymentRef].tokenAddress).approve(address(paymentProxy), 2 ** 255);
        
        
        uint256 _amount = requestMapping[_paymentRef].amount;
        requestMapping[_paymentRef].amount = 0;
        // Pay the request to escrow, fee is already paid.
        paymentProxy.transferFromWithReferenceAndFee(
            address(requestMapping[_paymentRef].tokenAddress),
            _to,
            _amount, 
            _paymentRef, 
            _feeAmount, 
            feeAddress
        );  
        delete requestMapping[_paymentRef];
        emit RequestPaidFromEscrow(_paymentRef);  
    }
   
    /**
     * @notice Lockes the request funds for 12 months.
     * @param _paymentRef Reference of the Invoice related.
     */
    function FreezeRequest(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        if(requestMapping[_paymentRef].isFrozen) revert RequestFrozen("failed!");
        requestMapping[_paymentRef].isFrozen = true;
        /// unlockDate is set to block.timestamp + twelve months. 
        requestMapping[_paymentRef].unlockDate = block.timestamp + 31556926;
    }

    /**
     * @notice Withdraw the locked funds from escow contract and transfer to payer.
     * @param  _paymentRef Reference of the Invoice related.
     */
    function withdrawTimeLockedFunds(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        //if(!requestMapping[_paymentRef].isFrozen) revert RequestFrozen("failed!");
        require(requestMapping[_paymentRef].unlockDate >= block.timestamp);
        requestMapping[_paymentRef].isFrozen = false;
        uint _amount = requestMapping[_paymentRef].amount;
        IERC20(requestMapping[_paymentRef].tokenAddress).transferFrom(
            address(this), requestMapping[_paymentRef]._from, _amount
        );   
    }
    
    /**
     * @notice Transfers paymentToken from payer to MyEscrow smartcontract.  
     * @param _paymentRef Reference of the related Invoice.
     * @dev Internal function to execute transferFrom() payer.
     */
    function _deposit(bytes memory _paymentRef, uint256 _feeAmount) internal returns (bool result){
        
        // Pay the invoice request and fees
            requestMapping[_paymentRef].tokenAddress.transferFrom(
                requestMapping[_paymentRef]._from,
                address(this),
                (requestMapping[_paymentRef].amount+_feeAmount)
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
        if (requestMapping[_paymentRef].amount != 0 ) {
            
            uint256 _amount = requestMapping[_paymentRef].amount;
            requestMapping[_paymentRef].amount = 0;
           
            /// Give approval to transfer from ERC20EscrowToPayV1 => ERC20FeeProxy contract.
            requestMapping[_paymentRef].tokenAddress.approve(address(paymentProxy), 2**255);
    
            // Pay the invoice request and fees
            paymentProxy.transferFromWithReferenceAndFee(
                address(requestMapping[_paymentRef].tokenAddress),
                _receiver,
                _amount, 
                _paymentRef, 
                0, 
                address(0)
            );  
            return true;
        }
        revert WithdrawFailed();  
    } 

    /**
    * @notice ONLY for testnet purposes, removes the smartcontract from the blockchain. 
    * @dev OnlyOwner condition
    * @dev Housekeeping. 
    */
    function removeContract() external {
      require( msg.sender == owner, "ERC2OnlyOwner"); 
        selfdestruct(payable(owner));
        emit ContractRemoved();
    }

}