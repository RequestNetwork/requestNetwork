pragma solidity 0.4.18;

import '../core/RequestCore.sol';
import '../base/math/SafeMathUint8.sol';
import './RequestEthereumCollect.sol';

/**
 * @title RequestEthereum
 *
 * @dev RequestEthereum is the currency contract managing the request in Ethereum
 * @dev The contract can be paused. In this case, nobody can create Requests anymore but people can still interact with them or withdraw funds.
 *
 * @dev Requests can be created by the Payee with createRequestAsPayee(), by the payer with createRequestAsPayer() or by the payer from a request signed offchain by the payee with broadcastSignedRequestAsPayer()
 */
contract RequestEthereum is RequestEthereumCollect {
	using SafeMath for uint256;
	using SafeMathInt for int256;
	using SafeMathUint8 for uint8;

	// RequestCore object
	RequestCore public requestCore;

	// Ethereum available to withdraw (only in case of sending fail)
	mapping(address => uint256) public ethToWithdraw;

	// payment addresses by requestId (optional). We separate the Identity of the payee/payer (in the core) and the wallet address in the currency contract
    mapping(bytes32 => address[256]) public payeesPaymentAddress;
    mapping(bytes32 => address) public payerRefundAddress;

    /*
     *  Event sent when we send to fail. The ether will be avaialble for withdrawal.
     */
	event EtherAvailableToWithdraw(bytes32 indexed requestId, address indexed recipient, uint256 amount);

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 * @param _requestBurnerAddress Request Burner contract address
	 */
	function RequestEthereum(address _requestCoreAddress, address _requestBurnerAddress) RequestEthereumCollect(_requestBurnerAddress) public
	{
		requestCore=RequestCore(_requestCoreAddress);
	}

	/*
	 * @dev Function to create a request as payee
	 *
	 * @dev msg.sender will be the payee
	 * @dev if _payeesPaymentAddress.length > _payeesIdAddress.length, the extra addresses will be stored but never used
	 *
	 * @param _payeesIdAddress array of payees address (the index 0 will be the payee - must be msg.sender - the others are subPayees)
	 * @param _payeesPaymentAddress array of payees address for payment (optional)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payer Entity expected to pay
	 * @param _payerRefundAddress Address of refund for the payer (optional)
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request
	 */
	function createRequestAsPayee(
		address[] 	_payeesIdAddress,
		address[] 	_payeesPaymentAddress,
		int256[] 	_expectedAmounts,
		address 	_payer,
		address 	_payerRefundAddress,
		string 		_data)
		external
		payable
		whenNotPaused
		returns(bytes32 requestId)
	{
		require(msg.sender == _payeesIdAddress[0] && msg.sender != _payer && _payer != 0);

		uint256 fees;
		(requestId, fees) = createRequest(_payer, _payeesIdAddress, _payeesPaymentAddress, _expectedAmounts, _payerRefundAddress, _data);

		// check if the value send match exactly the fees (no under or over payment allowed)
		require(fees == msg.value);

		return requestId;
	}

	/*
	 * @dev Function to create a request as payer. The request is payed if _payeeAmounts > 0.
	 *
	 * @dev msg.sender will be the payer
	 *
	 * @param _payeesIdAddress array of payees address (the index 0 will be the payee the others are subPayees)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payerRefundAddress Address of refund for the payer (optional)
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals array to increase the ExpectedAmount for payees
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request
	 */
	function createRequestAsPayer(
		address[] 	_payeesIdAddress,
		int256[] 	_expectedAmounts,
		address 	_payerRefundAddress,
		uint256[] 	_payeeAmounts,
		uint256[] 	_additionals,
		string 		_data)
		external
		payable
		whenNotPaused
		returns(bytes32 requestId)
	{
		require(msg.sender != _payeesIdAddress[0] && _payeesIdAddress[0] != 0);

		// payeesPaymentAddress is not offered as argument here to avoid scam
		address[] memory emptyPayeesPaymentAddress = new address[](0);
		uint256 fees;
		(requestId, fees) = createRequest(msg.sender, _payeesIdAddress, emptyPayeesPaymentAddress, _expectedAmounts, _payerRefundAddress, _data);

		// accept and pay the request with the value remaining after the fee collect
		acceptAndPay(requestId, _payeeAmounts, _additionals, msg.value.sub(fees));

		return requestId;
	}


	/*
	 * @dev Function to broadcast and accept an offchain signed request (can be paid and additionals also)
	 *
	 * @dev _payer will be set msg.sender
	 * @dev if _payeesPaymentAddress.length > _requestData.payeesIdAddress.length, the extra addresses will be stored but never used
	 *
	 * @param _requestData nested bytes containing : creator, payer, payees, expectedAmounts, data
	 * @param _payeesPaymentAddress array of payees address for payment (optional) 
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals array to increase the ExpectedAmount for payees
	 * @param _expirationDate timestamp after that the signed request cannot be broadcasted
	 * @param _signature ECDSA signature in bytes
	 *
	 * @return Returns the id of the request
	 */
	function broadcastSignedRequestAsPayer(
		bytes 		_requestData, // gather data to avoid "stack too deep"
		address[] 	_payeesPaymentAddress,
		uint256[] 	_payeeAmounts,
		uint256[] 	_additionals,
		uint256 	_expirationDate,
		bytes 		_signature)
		external
		payable
		whenNotPaused
		returns(bytes32)
	{
		// check expiration date
		require(_expirationDate >= block.timestamp);

		// check the signature
		require(checkRequestSignature(_requestData, _payeesPaymentAddress, _expirationDate, _signature));

		// create accept and pay the request
		return createAcceptAndPayFromBytes(_requestData,  _payeesPaymentAddress, _payeeAmounts, _additionals);
	}

	/*
	 * @dev Internal function to create, accept, add additionals and pay a request as Payer
	 *
	 * @dev msg.sender must be _payer
	 *
	 * @param _requestData nasty bytes containing : creator, payer, payees|expectedAmounts, data
	 * @param _payeesPaymentAddress array of payees address for payment (optional)
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals Will increase the ExpectedAmount of the request right after its creation by adding additionals
	 *
	 * @return Returns the id of the request
	 */
	function createAcceptAndPayFromBytes(
		bytes 		_requestData,
		address[] 	_payeesPaymentAddress,
		uint256[] 	_payeeAmounts,
		uint256[] 	_additionals)
		internal
		returns(bytes32 requestId)
	{
		// extract main payee
		address mainPayee = extractAddress(_requestData, 41);
		require(msg.sender != mainPayee && mainPayee != 0);
		// creator must be the main payee
		require(extractAddress(_requestData, 0) == mainPayee);

		// extract the number of payees
		uint8 payeesCount = uint8(_requestData[40]);
		int256 totalExpectedAmounts = 0;
		for(uint8 i = 0; i < payeesCount; i++) {
			// extract the expectedAmount for the payee[i]
			int256 expectedAmountTemp = int256(extractBytes32(_requestData, uint256(i).mul(52).add(61)));
			// compute the total expected amount of the request
			totalExpectedAmounts = totalExpectedAmounts.add(expectedAmountTemp);
			// all expected amount must be positibe
			require(expectedAmountTemp>0);
		}

		// collect the fees
		uint256 fees = collectEstimation(totalExpectedAmounts);

		// check fees has been well received
		// do the action and assertion in one to save a variable
		require(collectForREQBurning(fees));

		// store request in the core, but first insert the msg.sender as the payer in the bytes
		requestId = requestCore.createRequestFromBytes(insertBytes20inBytes(_requestData, 20, bytes20(msg.sender)));

		// set payment addresses for payees
		for (uint8 j = 0; j < _payeesPaymentAddress.length; j = j.add(1)) {
			payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
		}

		// accept and pay the request with the value remaining after the fee collect
		acceptAndPay(requestId, _payeeAmounts, _additionals, msg.value.sub(fees));

		return requestId;
	}


	/*
	 * @dev Internal function to create a request
	 *
	 * @dev msg.sender is the creator of the request
	 *
	 * @param _payer Payer identity address
	 * @param _payees Payees identity address
	 * @param _payeesPaymentAddress Payees payment address
	 * @param _expectedAmounts Expected amounts to be received by payees
	 * @param _payerRefundAddress payer refund address
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request
	 */
	function createRequest(
		address 	_payer,
		address[] 	_payees,
		address[] 	_payeesPaymentAddress,
		int256[] 	_expectedAmounts,
		address 	_payerRefundAddress,
		string 		_data)
		internal
		returns(bytes32 requestId, uint256 fees)
	{
		int256 totalExpectedAmounts = 0;
		for (uint8 i = 0; i < _expectedAmounts.length; i = i.add(1))
		{
			// all expected amount must be positive
			require(_expectedAmounts[i]>=0);
			// compute the total expected amount of the request
			totalExpectedAmounts = totalExpectedAmounts.add(_expectedAmounts[i]);
		}

		// collect the fees
		fees = collectEstimation(totalExpectedAmounts);
		// check fees has been well received
		require(collectForREQBurning(fees));

		// store request in the core
		requestId= requestCore.createRequest(msg.sender, _payees, _expectedAmounts, _payer, _data);

		// set payment addresses for payees
		for (uint8 j = 0; j < _payeesPaymentAddress.length; j = j.add(1)) {
			payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
		}
		// set payment address for payer
		if(_payerRefundAddress != 0) {
			payerRefundAddress[requestId] = _payerRefundAddress;
		}
	}

	/*
	 * @dev Internal function to accept, add additionals and pay a request as Payer
	 *
	 * @param _requestId id of the request
	 * @param _payeesAmounts Amount to pay to payees (sum must be equals to _amountPaid)
	 * @param _additionals Will increase the ExpectedAmounts of payees
	 * @param _amountPaid amount in msg.value minus the fees
	 *
	 */	
	function acceptAndPay(
		bytes32 _requestId,
		uint256[] _payeeAmounts,
		uint256[] _additionals,
		uint256 _amountPaid)
		internal
	{
		requestCore.accept(_requestId);
		
		additionalInternal(_requestId, _additionals);

		if(_amountPaid > 0) {
			paymentInternal(_requestId, _payeeAmounts, _amountPaid);
		}
	}

	// ---- INTERFACE FUNCTIONS ------------------------------------------------------------------------------------

	/*
	 * @dev Function to accept a request
	 *
	 * @dev msg.sender must be _payer
	 * @dev A request can also be accepted by using directly the payment function on a request in the Created status
	 *
	 * @param _requestId id of the request
	 */
	function accept(bytes32 _requestId)
		external
		whenNotPaused
		condition(requestCore.getPayer(_requestId)==msg.sender)
		condition(requestCore.getState(_requestId)==RequestCore.State.Created)
	{
		requestCore.accept(_requestId);
	}

	/*
	 * @dev Function to cancel a request
	 *
	 * @dev msg.sender must be the _payer or the _payee.
	 * @dev only request with balance equals to zero can be cancel
	 *
	 * @param _requestId id of the request
	 */
	function cancel(bytes32 _requestId)
		external
		whenNotPaused
	{
		// payer can cancel if request is just created
		bool isPayerAndCreated = requestCore.getPayer(_requestId)==msg.sender && requestCore.getState(_requestId)==RequestCore.State.Created;

		// payee can cancel when request is not canceled yet
		bool isPayeeAndNotCanceled = requestCore.getPayeeAddress(_requestId,0)==msg.sender && requestCore.getState(_requestId)!=RequestCore.State.Canceled;

		require(isPayerAndCreated || isPayeeAndNotCanceled);

		// impossible to cancel a Request with any payees balance != 0
		require(requestCore.areAllBalanceNull(_requestId));

		requestCore.cancel(_requestId);
	}

	// ----------------------------------------------------------------------------------------


	// ---- CONTRACT FUNCTIONS ------------------------------------------------------------------------------------
	/*
	 * @dev Function PAYABLE to pay a request in ether.
	 *
	 * @dev the request will be automatically accepted if msg.sender==payer. 
	 *
	 * @param _requestId id of the request
	 * @param _payeesAmounts Amount to pay to payees (sum must be equal to msg.value) in wei
	 * @param _additionalsAmount amount of additionals per payee in wei to declare
	 */
	function paymentAction(
		bytes32 _requestId,
		uint256[] _payeeAmounts,
		uint256[] _additionalAmounts)
		external
		whenNotPaused
		payable
		condition(requestCore.getState(_requestId)!=RequestCore.State.Canceled)
		condition(_additionalAmounts.length == 0 || msg.sender == requestCore.getPayer(_requestId))
	{
		// automatically accept request if request is created and msg.sender is payer
		if(requestCore.getState(_requestId)==RequestCore.State.Created && msg.sender == requestCore.getPayer(_requestId)) {
			requestCore.accept(_requestId);
		}

		additionalInternal(_requestId, _additionalAmounts);

		paymentInternal(_requestId, _payeeAmounts, msg.value);
	}

	/*
	 * @dev Function PAYABLE to pay back in ether a request to the payee
	 *
	 * @dev msg.sender must be one of the payees
	 * @dev the request must be created or accepted
	 * @dev the payback must be lower than the amount already paid for the request
	 *
	 * @param _requestId id of the request
	 */
	function refundAction(bytes32 _requestId)
		external
		whenNotPaused
		payable
	{
		refundInternal(_requestId, msg.sender, msg.value);
	}

	/*
	 * @dev Function to declare a subtract
	 *
	 * @dev msg.sender must be _payee
	 * @dev the request must be accepted or created
	 *
	 * @param _requestId id of the request
	 * @param _subtractAmounts amounts of subtract in wei to declare (index 0 is for main payee)
	 */
	function subtractAction(bytes32 _requestId, uint256[] _subtractAmounts)
		external
		whenNotPaused
		condition(requestCore.getState(_requestId)!=RequestCore.State.Canceled)
		onlyRequestPayee(_requestId)
	{
		for(uint8 i = 0; i < _subtractAmounts.length; i = i.add(1)) {
			if(_subtractAmounts[i] != 0) {
				// subtract must be equal or lower than amount expected
				require(requestCore.getPayeeExpectedAmount(_requestId,i) >= _subtractAmounts[i].toInt256Safe());
				// store and declare the subtract in the core
				requestCore.updateExpectedAmount(_requestId, i, -_subtractAmounts[i].toInt256Safe());
			}
		}
	}

	/*
	 * @dev Function to declare an additional
	 *
	 * @dev msg.sender must be _payer
	 * @dev the request must be accepted or created
	 *
	 * @param _requestId id of the request
	 * @param _additionalAmounts amounts of additional in wei to declare (index 0 is for main payee)
	 */
	function additionalAction(bytes32 _requestId, uint256[] _additionalAmounts)
		public
		whenNotPaused
		condition(requestCore.getState(_requestId)!=RequestCore.State.Canceled)
		onlyRequestPayer(_requestId)
	{
		additionalInternal(_requestId, _additionalAmounts);
	}

	/*
	 * @dev Function to withdraw ether
	 */
	function withdraw()
		public
	{
		uint256 amount = ethToWithdraw[msg.sender];
		ethToWithdraw[msg.sender] = 0;
		msg.sender.transfer(amount);
	}
	// ----------------------------------------------------------------------------------------


	// ---- INTERNAL FUNCTIONS ------------------------------------------------------------------------------------
	/*
	 * @dev Function internal to manage additional declaration
	 *
	 * @param _requestId id of the request
	 * @param _additionalAmounts amount of additional to declare
	 */
	function additionalInternal(bytes32 _requestId, uint256[] _additionalAmounts)
		internal
	{
		// we cannot have more additional amounts declared than actual payees but we can have fewer
		require(_additionalAmounts.length <= requestCore.getSubPayeesCount(_requestId).add(1));

		for(uint8 i = 0; i < _additionalAmounts.length; i = i.add(1)) {
			if(_additionalAmounts[i] != 0) {
				// Store and declare the additional in the core
				requestCore.updateExpectedAmount(_requestId, i, _additionalAmounts[i].toInt256Safe());
			}
		}
	}

	/*
	 * @dev Function internal to manage payment declaration
	 *
	 * @param _requestId id of the request
	 * @param _payeesAmounts Amount to pay to payees (sum must be equals to msg.value)
	 * @param _value amount paid
	 */
	function paymentInternal(
		bytes32 	_requestId,
		uint256[] 	_payeeAmounts,
		uint256 	_value)
		internal
	{
		// we cannot have more amounts declared than actual payees
		require(_payeeAmounts.length <= requestCore.getSubPayeesCount(_requestId).add(1));

		uint256 totalPayeeAmounts = 0;

		for(uint8 i = 0; i < _payeeAmounts.length; i = i.add(1)) {
			if(_payeeAmounts[i] != 0) {
				// compute the total amount declared
				totalPayeeAmounts = totalPayeeAmounts.add(_payeeAmounts[i]);

				// Store and declare the payment to the core
				requestCore.updateBalance(_requestId, i, _payeeAmounts[i].toInt256Safe());

				// pay the payment address if given, the id address otherwise
				address addressToPay;
				if(payeesPaymentAddress[_requestId][i] == 0) {
					addressToPay = requestCore.getPayeeAddress(_requestId, i);
				} else {
					addressToPay = payeesPaymentAddress[_requestId][i];
				}

				//payment done, the money was sent
				fundOrderInternal(_requestId, addressToPay, _payeeAmounts[i]);
			}
		}

		// check if payment repartition match the value paid
		require(_value==totalPayeeAmounts);
	}

	/*
	 * @dev Function internal to manage refund declaration
	 *
	 * @param _requestId id of the request

	 * @param _fromAddress address from where the refund has been done
	 * @param _amount amount of the refund in wei to declare
	 *
	 * @return true if the refund is done, false otherwise
	 */
	function refundInternal(
		bytes32 _requestId,
		address _fromAddress,
		uint256 _amount)
		condition(requestCore.getState(_requestId)!=RequestCore.State.Canceled)
		internal
	{
		// Check if the _fromAddress is a payeesId
		// in16 to allow -1 value
		int16 payeeIndex = requestCore.getPayeeIndex(_requestId, _fromAddress);
		if(payeeIndex < 0) {
			// if not ID addresses maybe in the payee payments addresses
	        for (uint8 i = 0; i < requestCore.getSubPayeesCount(_requestId)+1 && payeeIndex == -1; i = i.add(1)) {
	            if(payeesPaymentAddress[_requestId][i] == _fromAddress) {
	            	// get the payeeIndex
	                payeeIndex = int16(i);
	            }
	        }
		}
		// the address must be found somewhere
		require(payeeIndex >= 0); 

		// Casting to uin8 doesn't lose bits because payeeIndex < 256. payeeIndex was declared int16 to allow -1
		requestCore.updateBalance(_requestId, uint8(payeeIndex), -_amount.toInt256Safe());

		// refund to the payment address if given, the id address otherwise
		address addressToPay = payerRefundAddress[_requestId];
		if(addressToPay == 0) {
			addressToPay = requestCore.getPayer(_requestId);
		}

		// refund declared, the money is ready to be sent to the payer
		fundOrderInternal(_requestId, addressToPay, _amount);
	}

	/*
	 * @dev Function internal to manage fund mouvement
	 * @dev We had to chose between a withdraw pattern, a send pattern or a send + withdraw pattern and chose the last. 
	 * @dev The withdraw pattern would have been a too big inconvenient for the UX. The send pattern would have allowed someone to lock a request. 
	 * @dev The send + withdraw pattern will have to be clearly explained to users. If the payee is a contract which can let a transfer fail, it will need to be able to call a withdraw function from Request. 
	 *
	 * @param _requestId id of the request
	 * @param _recipient address where the wei has to be sent to
	 * @param _amount amount in wei to send
	 *
	 */
	function fundOrderInternal(
		bytes32 _requestId,
		address _recipient,
		uint256 _amount)
		internal
	{
		// try to send the fund
		if(!_recipient.send(_amount)) {
			// if sendding fails, the funds are availbale to withdraw
			ethToWithdraw[_recipient] = ethToWithdraw[_recipient].add(_amount);
			// spread the word that the money is not sent but available to withdraw
			EtherAvailableToWithdraw(_requestId, _recipient, _amount);
		}
	}

	/*
	 * @dev Function internal to calculate Keccak-256 hash of a request with specified parameters
	 *
     * @param _data bytes containing all the data packed
	 * @param _payeesPaymentAddress array of payees payment addresses
	 * @param _expirationDate timestamp after what the signed request cannot be broadcasted
	 *
	 * @return Keccak-256 hash of (this,_requestData, _payeesPaymentAddress, _expirationDate)
	 */
	function getRequestHash(
		// _requestData is from the core
		bytes 		_requestData,

		// _payeesPaymentAddress and _expirationDate are not from the core but needs to be signed
		address[] 	_payeesPaymentAddress,
		uint256 	_expirationDate)
		internal
		view
		returns(bytes32)
	{
		return keccak256(this, _requestData, _payeesPaymentAddress, _expirationDate);
	}

	/*
	 * @dev Verifies that a hash signature is valid. 0x style
	 * @param signer address of signer.
	 * @param hash Signed Keccak-256 hash.
	 * @param v ECDSA signature parameter v.
	 * @param r ECDSA signature parameters r.
	 * @param s ECDSA signature parameters s.
	 * @return Validity of order signature.
	 */
	function isValidSignature(
		address signer,
		bytes32 hash,
		uint8 	v,
		bytes32 r,
		bytes32 s)
		public
		pure
		returns (bool)
	{
		return signer == ecrecover(
			keccak256("\x19Ethereum Signed Message:\n32", hash),
			v,
			r,
			s
		);
	}

	/*
	 * @dev Check the validity of a signed request & the expiration date
     * @param _data bytes containing all the data packed :
            address(creator)
            address(payer)
            uint8(number_of_payees)
            [
                address(main_payee_address)
                int256(main_payee_expected_amount)
                address(second_payee_address)
                int256(second_payee_expected_amount)
                ...
            ]
            uint8(data_string_size)
            size(data)
	 * @param _payeesPaymentAddress array of payees payment addresses (the index 0 will be the payee the others are subPayees)
	 * @param _expirationDate timestamp after that the signed request cannot be broadcasted
  	 * @param _signature ECDSA signature containing v, r and s as bytes
  	 *
	 * @return Validity of order signature.
	 */	
	function checkRequestSignature(
		bytes 		_requestData,
		address[] 	_payeesPaymentAddress,
		uint256 	_expirationDate,
		bytes 		_signature)
		public
		view
		returns (bool)
	{
		bytes32 hash = getRequestHash(_requestData, _payeesPaymentAddress, _expirationDate);

		// extract "v, r, s" from the signature
		uint8 v = uint8(_signature[64]);
		v = v < 27 ? v.add(27) : v;
		bytes32 r = extractBytes32(_signature, 0);
		bytes32 s = extractBytes32(_signature, 32);

		// check signature of the hash with the creator address
		return isValidSignature(extractAddress(_requestData, 0), hash, v, r, s);
	}

	//modifier
	modifier condition(bool c)
	{
		require(c);
		_;
	}

	/*
	 * @dev Modifier to check if msg.sender is payer
	 * @dev Revert if msg.sender is not payer
	 * @param _requestId id of the request
	 */	
	modifier onlyRequestPayer(bytes32 _requestId)
	{
		require(requestCore.getPayer(_requestId)==msg.sender);
		_;
	}
	
	/*
	 * @dev Modifier to check if msg.sender is the main payee
	 * @dev Revert if msg.sender is not the main payee
	 * @param _requestId id of the request
	 */	
	modifier onlyRequestPayee(bytes32 _requestId)
	{
		require(requestCore.getPayeeAddress(_requestId, 0)==msg.sender);
		_;
	}

    /*
     * @dev modify 20 bytes in a bytes
     * @param data bytes to modify
     * @param offset position of the first byte to modify
     * @param b bytes20 to insert
     * @return address
     */
    function insertBytes20inBytes(bytes data, uint offset, bytes20 b) internal pure returns(bytes) {
        for(uint8 j = 0; j <20; j++) {
            data[offset+j] = b[j];
        }
    	return data;
    }

    /*
     * @dev extract an address in a bytes
     * @param data bytes from where the address will be extract
     * @param offset position of the first byte of the address
     * @return address
     */
    function extractAddress(bytes _data, uint offset) internal pure returns (address) {
        // for pattern to reduce contract size
        uint160 m = uint160(_data[offset]);
        for(uint8 i = 1; i < 20; i++) {
        	m = m*256 + uint160(_data[offset+i]);
        }
        return address(m);
    }

    /*
     * @dev extract a bytes32 from a bytes
     * @param data bytes from where the bytes32 will be extract
     * @param offset position of the first byte of the bytes32
     * @return address
     */ 
    function extractBytes32(bytes _data, uint offset) public pure returns (bytes32) {
        // no "for" pattern to optimize gas cost
        uint256 m = uint256(_data[offset]); // 3930
        m = m*256 + uint256(_data[offset+1]);
        m = m*256 + uint256(_data[offset+2]);
        m = m*256 + uint256(_data[offset+3]);
        m = m*256 + uint256(_data[offset+4]);
        m = m*256 + uint256(_data[offset+5]);
        m = m*256 + uint256(_data[offset+6]);
        m = m*256 + uint256(_data[offset+7]);
        m = m*256 + uint256(_data[offset+8]);
        m = m*256 + uint256(_data[offset+9]);
        m = m*256 + uint256(_data[offset+10]);
        m = m*256 + uint256(_data[offset+11]);
        m = m*256 + uint256(_data[offset+12]);
        m = m*256 + uint256(_data[offset+13]);
        m = m*256 + uint256(_data[offset+14]);
        m = m*256 + uint256(_data[offset+15]);
        m = m*256 + uint256(_data[offset+16]);
        m = m*256 + uint256(_data[offset+17]);
        m = m*256 + uint256(_data[offset+18]);
        m = m*256 + uint256(_data[offset+19]);
        m = m*256 + uint256(_data[offset+20]);
        m = m*256 + uint256(_data[offset+21]);
        m = m*256 + uint256(_data[offset+22]);
        m = m*256 + uint256(_data[offset+23]);
        m = m*256 + uint256(_data[offset+24]);
        m = m*256 + uint256(_data[offset+25]);
        m = m*256 + uint256(_data[offset+26]);
        m = m*256 + uint256(_data[offset+27]);
        m = m*256 + uint256(_data[offset+28]);
        m = m*256 + uint256(_data[offset+29]);
        m = m*256 + uint256(_data[offset+30]);
        m = m*256 + uint256(_data[offset+31]);
        return bytes32(m);
    }
}
