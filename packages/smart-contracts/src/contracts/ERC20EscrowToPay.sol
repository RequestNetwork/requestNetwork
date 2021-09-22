/// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/TokenTimelock.sol";
import "./interfaces/ERC20FeeProxy.sol";


/// @title Escrow based invoice
contract ERC20EscrowToPay {
    
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
    mapping(bytes => Invoice) private invoiceMapping;
    mapping(bytes => Dispute) private disputeMapping;

    // Modifier
    modifier OnlyPayers(bytes memory _paymentRef) {
        require(
            msg.sender == invoiceMapping[_paymentRef].payer || 
            msg.sender == disputeMapping[_paymentRef].payer || 
            msg.sender == invoiceMapping[_paymentRef].payee || 
            msg.sender == disputeMapping[_paymentRef].payee,
            "ERC20EscrowToPay: Only the payer or payee can excecute this call!"
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

    error WithdrawFailed(string description);

    /// Events
    event OpenEscrow(
        bytes indexed paymentReference,
        IERC20 paymentToken,
        uint256 amount,
        address payee,
        uint256 feeAmount,
        address feeAddress,
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
    event EscrowCompleted(bytes indexed paymentReference);
    event LockPeriodEnded(bytes indexed paymentReference, uint feeAmount);
    
    constructor() {
        owner = payable(msg.sender);
        // TODO: remove locally deployed ERC20FeeProxy address.
        paymentProxy = IERC20FeeProxy(payable(0xD177da9Bc48017370f80dFa41df8B2E3e21232F5));
    }


    /// Store the payment details in struct, then transfers the funds to the Escrow contract
    /// @param _paymentRef Reference of the Invoice related
    /// @param amount Amount to transfer
    /// @param payee address of the reciever/ beneficiary of the escrow funds
    function openEscrow(bytes memory _paymentRef, IERC20 paymentToken,uint256 amount, address payee, uint256 feeAmount, address feeAddress) 
        public
        payable
        returns (bytes memory, uint256)
    {
        require(
            invoiceMapping[_paymentRef].amount == 0, 
            "MyEscrow: This paymentRef already exists, is this the correct paymentRef?"
        );
        
        
        uint256 sixMonths = 15778458;
        // Variable claimDate is used to set a timestamp on when the payee can execute closeEscrow().
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

        emit OpenEscrow(
            _paymentRef,
            paymentToken,
            amount,
            payee,
            feeAmount,
            feeAddress,
            claimDate
        );
        
        return (_paymentRef, claimDate);
    }


    /// Withdraw the funds of escrow from a given _paymentRef.
    /// @param  _paymentRef Reference of the payment related.
    /// @dev    require msg.sender to be the function executer.
    function closeEscrow(bytes memory _paymentRef) public {
        require(invoiceMapping[_paymentRef].amount != 0, "MyEscrow: Payment reference does not exist");
        require(
            msg.sender == invoiceMapping[_paymentRef].payer ||
            (msg.sender == invoiceMapping[_paymentRef].payee && invoiceMapping[_paymentRef].claimDate <= block.timestamp),
            "ERC20EscrowToPay: You are not a valid payer, only a valid payer can closeEscrow()!"
        );


        /// withdraw the invoice funds from Escrow
        require(
            _withdraw( _paymentRef, invoiceMapping[_paymentRef].payee), 
            "ERC20EscrowToPay: FAILED to Withdraw from ESCROW!"
        );        

        /// Delete the invoiceMapping[_paymentRef] data.
        delete invoiceMapping[_paymentRef];

        emit EscrowCompleted(
            _paymentRef
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


    /// @notice Withdraw the funds from the escrow.  
    /// @param  _paymentRef Reference of the related Invoice.
    /// @dev    Internal function to withdraw funds to a given reciever.
    function _withdraw(bytes memory _paymentRef, address _receiver) internal returns (bool Success) {
        IERC20 _token;
        uint _amount;
        uint _feeAmount;
        address _feeAddress;

        /// Normal flow, funds are transfered to payee.
        if (invoiceMapping[_paymentRef].amount != 0 ) {
            _token = invoiceMapping[_paymentRef].paymentToken;
            _amount = invoiceMapping[_paymentRef].amount;
            
            invoiceMapping[_paymentRef].amount = 0;
            
            _feeAmount = invoiceMapping[_paymentRef].feeAmount;
            _feeAddress = invoiceMapping[_paymentRef].feeAddress;
        
            /// Give approval to transfer from ERC20EscrowToPay => ERC20FeeProxy contract.
            _token.approve(address(paymentProxy),  2**255);
    
            // Pay the invoice request and fees
            paymentProxy.transferFromWithReferenceAndFee(
                address(_token),
                _receiver,
                _amount, 
                _paymentRef, 
                _feeAmount, 
                payable(_feeAddress)
            );  

            return true;
        }
        
        /// Resolve dispute flow, funds are transfered to payee.
        if (disputeMapping[_paymentRef].amount != 0) {
              // transfers the timelocked funds back to this ERC20EscrowToPay contract.
            require(
                disputeMapping[_paymentRef].tokentimelock.release(),
                "ERC20EscrowToPay: Transfer from tokentimelock contract to ERC20EscrowToPay failed!"
            );
            
            _token = disputeMapping[_paymentRef].paymentToken;
            _amount = disputeMapping[_paymentRef].amount;
            
            disputeMapping[_paymentRef].amount = 0;

            _feeAmount = disputeMapping[_paymentRef].feeAmount;
            _feeAddress = disputeMapping[_paymentRef].feeAddress;
            
            disputeMapping[_paymentRef].paymentToken.approve(address(paymentProxy),  2**255);
            disputeMapping[_paymentRef].amount = 0;

            // Pay the request and fees
            paymentProxy.transferFromWithReferenceAndFee(
                address(_token),
                _receiver, 
                _amount, 
                _paymentRef, 
                _feeAmount, 
                payable(_feeAddress)
            );
            
            return true;
        }
        
        revert WithdrawFailed("Withdraw FAILED");
        
    } 


    /// @notice Return Invoice details from _paymentRef.
    /// @param  _paymentRef Reference of the related Invoice.
    function getInvoice(bytes memory _paymentRef) public view returns
    (
        uint256 amount, 
        address payee,
        address payer,
        uint256 feeAmount,
        address feeAddress
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
            invoiceMapping[_paymentRef].feeAmount,
            invoiceMapping[_paymentRef].feeAddress
        );
    }



    /// @notice Used to change the feeAmount and feeAddress of the contract.
    function addFeeAndAddress(bytes memory _paymentRef, uint _feeAmount, address _feeAddress) external OnlyOwner() returns 
    (
        bytes memory paymentRef,
        uint feeAmount,
        address feeAddress
    ) 
    {
        require(
            invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: Can't find Invoice, wrong payment reference!"
        );
        
        invoiceMapping[_paymentRef].feeAmount = _feeAmount;
        invoiceMapping[_paymentRef].feeAddress = payable(_feeAddress);
        
        return (_paymentRef, invoiceMapping[_paymentRef].feeAmount, invoiceMapping[_paymentRef].feeAddress);
        
    }


    /// Open dispute and lock funds for a year.
    /// @param _paymentRef Reference of the Invoice related.
    function openDispute(bytes memory _paymentRef) public payable OnlyPayers(_paymentRef) returns (TokenTimelock) {
        require(
            invoiceMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No Invoice found, Wrong payment reference?"
        );
        require(
            disputeMapping[_paymentRef].amount == 0, 
            "ERC20EscrowToPay: A dispute already exists, is this the correct paymentRef?"
        );

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
            invoiceMapping[_paymentRef].feeAddress,
            _lockDuration,
            _endtime,
            tokentimelock
        );

        // Transfer form escrow contract => tokentimelock contract
        require(
            disputeMapping[_paymentRef].paymentToken.transfer(
                address(disputeMapping[_paymentRef].tokentimelock),
                disputeMapping[_paymentRef].amount),
                "ERC20EscrowToPay: Transfer to tokentimelock contract failed!"
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
        
        return disputeMapping[_paymentRef].tokentimelock;
    }


    /// @notice Close a dispute and transfer the funds to the payee account.
    /// @dev Executes a call to release() on the tokentimelock contract.
    /// @param _paymentRef Reference of the related Invoice. 
    /// @return String description if successfully executed.
    function resolveDispute(bytes memory _paymentRef) external returns (string memory) {
        require(
            disputeMapping[_paymentRef].amount != 0, 
            "ERC20EscrowToPay: No Invoice or Dispute found, wrong payment reference?"
        );
        require(
            msg.sender == disputeMapping[_paymentRef].payer,
            "ERC20EscrowToPay: Only the Payer can call this function!"
        );

        require(
            _withdraw( _paymentRef, disputeMapping[_paymentRef].payee), 
            "ERC20EscrowToPay: FAILED to Withdraw from ESCROW!"
        );        


        // delete paymentreference from disputeMapping
        delete disputeMapping[_paymentRef];

        return "Dispute is resolved and funds is tranfered to the payee account";
    }


    /// @notice Transfer funds from tokentimelock contract => payer.
    /// @param  _paymentRef Reference of the Invoice related.
    function withdrawLockedFunds(bytes memory _paymentRef) public OnlyPayers(_paymentRef) {
        require(disputeMapping[_paymentRef].amount != 0, "ERC20EscrowToPay: No Invoice found!");
        
        // close tokentimelock and transfer funds to payer through paymentProxy.transferFromWithReferenceAndFee.
        disputeMapping[_paymentRef].tokentimelock.release();
        
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
            _feeAmount, 
            disputeMapping[_paymentRef].feeAddress
        );

        // delete paymentreference from disputeMapping
        delete disputeMapping[_paymentRef];
        
        emit LockPeriodEnded(_paymentRef, _feeAmount);
    }


    /// @notice Returns the endTime of the tokentimelock contract.   
    /// @param  _paymentRef Reference of the Invoice related.
    function getLockPeriodEndTime(bytes memory _paymentRef) public view OnlyPayers(_paymentRef) returns (uint256 time) {
        return disputeMapping[_paymentRef].tokentimelock.releaseTime();
    }


    /// @notice Removes the ERC20EscrowToPay smartcontract from the blockchain. 
    function remove() public OnlyOwner() {
      require(owner == msg.sender, "ERC20EscrowToPay: You are not the Owner, only the owner can execute this call!"); 
        selfdestruct(owner);
    }

}