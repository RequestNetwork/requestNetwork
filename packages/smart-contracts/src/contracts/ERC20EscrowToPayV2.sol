/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./lib/SafeERC20.sol";
import "./interfaces/ERC20FeeProxy.sol";

/**
 * @title   ERC20EscrowToPayV2.
 * @notice  Request Invoice with Escrow.
 */
contract ERC20EscrowToPayV2 {
    using SafeERC20 for IERC20;

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
        require(requestMapping[_paymentRef].amount == 0, "Request already in escrow.");
        _;
    }
    modifier IsInEscrow(bytes memory _paymentRef) {
        require(
            requestMapping[_paymentRef].amount > 0,
            "Not in escrow."
        );
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
    event RequestFreezed(bytes indexed paymentReference);
    
    /**
     * @notice Emitted when a frozen request has been withdrawn successfully.
     * @param paymentReference Reference of the payment related.
     */
    event FrozenRequestWithdrawn(bytes indexed paymentReference);
    
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
    * @dev Uses transferFromWithReferenceAndFee() to pay to escrow and fees.
    */
    function payRequestToEscrow(
        address _tokenAddress,
        uint256 _amount,
        bytes memory _paymentRef,
        uint256 _feeAmount
    ) external {

        requestMapping[_paymentRef] = Request(
            IERC20(_tokenAddress),
            msg.sender,
            _amount,
            false,
            0
        );
        
        _deposit(_paymentRef, _feeAmount);
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
        require(!requestMapping[_paymentRef].isFrozen, "Frozen request");

        _withdraw(_paymentRef, _to, _feeAmount);

        delete requestMapping[_paymentRef];

        emit RequestWithdrawnFromEscrow(_paymentRef);  
    }
   
    /**
     * @notice Lockes the request funds for 12 months.
     * @param _paymentRef Reference of the Invoice related.
     */
    function FreezeRequest(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        require(!requestMapping[_paymentRef].isFrozen, "Is frozen");

        requestMapping[_paymentRef].isFrozen = true;

        /// unlockDate is set to block.timestamp + twelve months. 
        requestMapping[_paymentRef].unlockDate = block.timestamp + 31556926;

        emit RequestFreezed(_paymentRef);
    }

    /**
     * @notice Withdraw the locked funds from escow contract and transfer to payer.
     * @param  _paymentRef Reference of the Invoice related.
     */
    function withdrawFrozenFunds(bytes memory _paymentRef, uint256 _feeAmount) external OnlyPayer(_paymentRef) {
        require(requestMapping[_paymentRef].isFrozen, "Not frozen!");
        require(requestMapping[_paymentRef].unlockDate <= block.timestamp, "Not Yet!");

        requestMapping[_paymentRef].isFrozen = false;
        
       _withdraw(_paymentRef, msg.sender, _feeAmount);

       emit FrozenRequestWithdrawn(_paymentRef);
    }
    
    /**
     * @notice Transfers paymentToken from payer to MyEscrow smartcontract.  
     * @param _paymentRef Reference of the related Invoice.
     * @dev Internal function to execute transferFrom() payer.
     */
    function _deposit(bytes memory _paymentRef, uint256 _feeAmount) internal returns (bool result){
        // transfer from payer to Escrow
        requestMapping[_paymentRef].tokenAddress.safeTransferFrom(
            requestMapping[_paymentRef]._from,
            address(this),
            (requestMapping[_paymentRef].amount + _feeAmount)
        );  
        
        emit RequestInEscrow(_paymentRef);

        return true; 
    }
  
     /**
     * @notice Withdraw the funds from the escrow.  
     * @param _paymentRef Reference of the related Invoice.
     * @param _receiver Receiving address.
     * @dev Internal function to pay fees and withdraw funds to a given reciever.
     */
    function _withdraw(bytes memory _paymentRef, address _receiver, uint256 _feeAmount) internal returns (bool result) {       
        uint256 _amount = requestMapping[_paymentRef].amount;
        requestMapping[_paymentRef].amount = 0;
        
        IERC20 erc20 = IERC20(requestMapping[_paymentRef].tokenAddress);
        uint256 max = 2**256 - 1;
        erc20.safeApprove(address(paymentProxy), max);

        // Pay the invoice request and fees
        paymentProxy.transferFromWithReferenceAndFee(
            address(erc20),
            _receiver,
            _amount, 
            _paymentRef, 
            _feeAmount, 
            feeAddress
        );  

        return true;
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