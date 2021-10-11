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

    struct Request {
        IERC20 tokenAddress;
        address _from;
        uint amount;
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
    event RequestFrozen(bytes indexed paymentReference);
    
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
    * @param _tokenAddress Address of the ERC20 token smart contract.
    * @param _amount Amount to transfer.
    * @param _paymentRef Reference of the payment related.
    * @param _feeAmount Amount of fee to be paid.
    * @param _feeAddress Address to where the fees will be paid.
    * @dev Uses transferFromWithReferenceAndFee() to pay to escrow and fees.
    */
    function payRequestToEscrow(
        address _tokenAddress,
        uint256 _amount,
        bytes memory _paymentRef,
        uint256 _feeAmount,
        address _feeAddress
    ) external {

        requestMapping[_paymentRef] = Request(
            IERC20(_tokenAddress),
            msg.sender,
            _amount,
            false,
            0
        );
        
        (bool status, ) = address(paymentProxy).delegatecall(
      abi.encodeWithSignature(
        "transferFromWithReferenceAndFee(address,address,uint256,bytes,uint256,address)",
        // payment currency
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
     * @notice Closes an open escrow and pays the invoice request to it's issuer.
     * @param _paymentRef Reference of the related Invoice.
     * @param _to Address of the receiver.
     * @dev Uses transferFromWithReferenceAndFee() to pay _to without fees.
     */
    function payRequestFromEscrow(bytes memory _paymentRef, address _to) 
        external
        IsInEscrow(_paymentRef) 
        OnlyPayer(_paymentRef) 
    {
        require(!requestMapping[_paymentRef].isFrozen, "Frozen request");

        _withdraw(_paymentRef, _to);

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
    function withdrawFrozenFunds(bytes memory _paymentRef) external OnlyPayer(_paymentRef) {
        require(requestMapping[_paymentRef].isFrozen, "Not frozen!");
        require(requestMapping[_paymentRef].unlockDate <= block.timestamp, "Not Yet!");

        requestMapping[_paymentRef].isFrozen = false;
        
       _withdraw(_paymentRef, msg.sender);

       emit FrozenRequestWithdrawn(_paymentRef);
    }
    
 
     /**
     * @notice Withdraw the funds from the escrow.  
     * @param _paymentRef Reference of the related Invoice.
     * @param _receiver Receiving address.
     * @dev Internal function to pay fees and withdraw funds to a given reciever.
     */
    function _withdraw(bytes memory _paymentRef, address _receiver) internal returns (bool result) {       
        uint256 _amount = requestMapping[_paymentRef].amount;
        requestMapping[_paymentRef].amount = 0;
        
        requestMapping[_paymentRef].tokenAddress.safeTransfer(
            _receiver,
            _amount
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