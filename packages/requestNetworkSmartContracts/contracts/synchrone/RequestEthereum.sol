pragma solidity 0.4.18;

import '../core/RequestCore.sol';
import '../base/math/SafeMath.sol';
import '../base/math/SafeMathUint8.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestEthereum
 *
 * @dev RequestEthereum is the currency contract managing the request payed in Ethereum
 *
 * @dev Requests can be created by the Payee with createRequest() or by the payer from a request signed offchain by the payee with createQuickRequest
 */
contract RequestEthereum is Pausable {
	using SafeMath for uint256;
	using SafeMathUint8 for uint8;

	// RequestCore object
	RequestCore public requestCore;

	// Ethereum available to withdraw
	mapping(address => uint256) public ethToWithdraw;

	// payment addresses by requestId (optional)
    mapping(bytes32 => address[256]) public payeesPaymentAddress;
    mapping(bytes32 => address) public payerRefundAddress;

    /*
     *  Events 
     */
	event EtherAvailableToWithdraw(bytes32 indexed requestId, address indexed recipient, uint256 amount);

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 */  
	function RequestEthereum(address _requestCoreAddress) public
	{
		requestCore=RequestCore(_requestCoreAddress);
	}

	/*
	 * @dev Function to create a request as payee
	 *
	 * @dev msg.sender will be the payee
	 *
	 * @param _payeesIdAddress array of payees address (the position 0 will be the payee - must be msg.sender - the others are subPayees)
	 * @param _payeesPaymentAddress array of payees address for payment (optional)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payer Entity supposed to pay
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request 
	 */
	function createRequestAsPayee(address[] _payeesIdAddress, address[] _payeesPaymentAddress, int256[] _expectedAmounts, address _payer, address _payerRefundAddress, string _data)
		external
		payable
		whenNotPaused
		returns(bytes32 requestId)
	{
		require(msg.sender == _payeesIdAddress[0] && msg.sender != _payer && _payer != 0);

		requestId = createRequest(_payer, _payeesIdAddress, _payeesPaymentAddress, _expectedAmounts, _payerRefundAddress, _data);

		return requestId;
	}

	/*
	 * @dev Function to create a request as payer
	 *
	 * @dev msg.sender will be the payer
	 *
	 * @param _payeesIdAddress array of payees address (the position 0 will be the payee the others are subPayees)
	 * @param _payeesPaymentAddress array of payees address for payment (optional)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals array to increase the ExpectedAmount for payees
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request 
	 */
	function createRequestAsPayer(address[] _payeesIdAddress, address[] _payeesPaymentAddress, int256[] _expectedAmounts, address _payerRefundAddress, uint256[] _payeeAmounts, uint256[] _additionals, string _data)
		external
		payable
		whenNotPaused
		returns(bytes32 requestId)
	{
		require(msg.sender != _payeesIdAddress[0] && _payeesIdAddress[0] != 0);

		requestId = createRequest(msg.sender, _payeesIdAddress, _payeesPaymentAddress, _expectedAmounts, _payerRefundAddress, _data);

		acceptAndPay(requestId, _payeeAmounts, _additionals);

		return requestId;
	}


	/*
	 * @dev Function to broadcast and accept an offchain signed request (can be paid and additionals also)
	 *
	 * @dev msg.sender must be _payer
	 * @dev the _payer can additionals 
	 *
	 * @param _requestData nasty bytes containing : creator, payer, payees|expectedAmounts, data 
	 * @param _payeesPaymentAddress array of payees address for payment (optional)
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals array to increase the ExpectedAmount for payees
	 * @param _expirationDate timestamp after that the signed request cannot be broadcasted
	 * @param _signature ECDSA signature in bytes
	 *
	 * @return Returns the id of the request 
	 */
	function broadcastSignedRequestAsPayer(
		bytes _requestData, // gather data to avoid "stack too deep"
		address[] _payeesPaymentAddress,
		uint256[] _payeeAmounts, 
		uint256[] _additionals,
		uint256 _expirationDate, 
		bytes _signature)
		external
		payable
		whenNotPaused
		returns(bytes32)
	{
		// check expiration date
		require(_expirationDate >= block.timestamp);

		// check the signature
		require(checkRequestSignature(_requestData, _payeesPaymentAddress, _expirationDate, _signature));

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
	function createAcceptAndPayFromBytes(bytes _requestData, address[] _payeesPaymentAddress, uint256[] _payeeAmounts, uint256[] _additionals)
		internal
		returns(bytes32 requestId)
	{
		address firstPayee = extractAddress(_requestData, 41); 
		require(msg.sender != firstPayee && firstPayee != 0);  
		require( extractAddress(_requestData, 0) == firstPayee );

		uint8 payeesCount = uint8(_requestData[40]);
		for(uint8 i = 0; i < payeesCount; i++) {
		    require(isIntInBytesPositive(_requestData, 61+i*52));
		}

		requestId = requestCore.createRequestFromBytes(insertBytes20inBytes(_requestData, 20, bytes20(msg.sender)));

		// set payees payment addresses
		for (uint8 j = 0; j < _payeesPaymentAddress.length ; j = j.add(1)) {
			payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
		}

		acceptAndPay(requestId, _payeeAmounts, _additionals);

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
	 * @param _additionals Will increase the ExpectedAmount of the request right after its creation by adding additionals
	 * @param _payerRefundAddress payer refund address
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request 
	 */
	function createRequest(address _payer, address[] _payees, address[] _payeesPaymentAddress, int256[] _expectedAmounts, address _payerRefundAddress, string _data)
		internal
		returns(bytes32 requestId)
	{
		for (uint8 i = 0; i < _expectedAmounts.length; i = i.add(1))
		{
			require(_expectedAmounts[i]>=0);
		}

		requestId= requestCore.createRequest(msg.sender, _payees, _expectedAmounts, _payer, _data);

		// set payment addresses
		for (uint8 j = 0; j < _payeesPaymentAddress.length; j = j.add(1)) {
			payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
		}
		if(_payerRefundAddress != 0) {
			payerRefundAddress[requestId] = _payerRefundAddress;
		}

		return requestId;
	}

	/*
	 * @dev Internal function to accept, add additionals and pay a request as Payer
	 *
	 * @param _requestId id of the request 
	 * @param _payeesAmounts Amount to pay to payees (sum must be equals to msg.value)
	 * @param _additionals Will increase the ExpectedAmounts of payees
	 *
	 */	
	function acceptAndPay(bytes32 _requestId, uint256[] _payeeAmounts, uint256[] _additionals)
		internal
	{
		requestCore.accept(_requestId);
		
		additionalInternal(_requestId, _additionals);

		if(msg.value > 0) {
			paymentInternal(_requestId, _payeeAmounts, msg.value);
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
	 *
	 * @return true if the request is accepted, false otherwise
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
	 *
	 * @return true if the request is canceled
	 */
	function cancel(bytes32 _requestId)
		external
		whenNotPaused
	{
		require((requestCore.getPayer(_requestId)==msg.sender && requestCore.getState(_requestId)==RequestCore.State.Created)
				|| (requestCore.getPayeeAddress(_requestId,0)==msg.sender && requestCore.getState(_requestId)!=RequestCore.State.Canceled));

		// impossible to cancel a Request with any payees balance != 0
		require(requestCore.areAllBalanceNull(_requestId));

		requestCore.cancel(_requestId);
	}

	// ----------------------------------------------------------------------------------------


	// ---- CONTRACT FUNCTIONS ------------------------------------------------------------------------------------
	/*
	 * @dev Function PAYABLE to pay in ether a request
	 *
	 * @dev the request must be accepted if msg.sender!=payer
	 * @dev the request will be automatically accepted if msg.sender==payer
	 *
	 * @param _requestId id of the request
	 * @param _additionals amount of additionals in wei to declare 
	 */
	function paymentAction(bytes32 _requestId, uint256[] _payeeAmounts, uint256[] _additionalAmounts)
		external
		whenNotPaused
		payable
		condition(requestCore.getState(_requestId)!=RequestCore.State.Canceled)
		condition(_additionalAmounts.length == 0 || msg.sender == requestCore.getPayer(_requestId))
	{
		// automatically accept request
		if(requestCore.getState(_requestId)==RequestCore.State.Created && msg.sender == requestCore.getPayer(_requestId)) {
			requestCore.accept(_requestId);
		}

		additionalInternal(_requestId, _additionalAmounts);

		paymentInternal(_requestId, _payeeAmounts, msg.value);
	}

	/*
	 * @dev Function PAYABLE to pay back in ether a request to the payee
	 *
	 * @dev msg.sender must be _payer
	 * @dev the request must be accepted
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
	 * @param _subtractAmounts amounts of subtract in wei to declare (position 0 is for )
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
	 * @param _amount amounts of additional in wei to declare (position 0 is for )
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
	 *
	 * @return true if the payment is done, false otherwise
	 */
	function additionalInternal(bytes32 _requestId, uint256[] _additionalAmounts)
		internal
	{
		for(uint8 i = 0; i < _additionalAmounts.length; i = i.add(1)) {
			if(_additionalAmounts[i] != 0) {
				requestCore.updateExpectedAmount(_requestId, i, _additionalAmounts[i].toInt256Safe());
			}
		}
	}

	/*
	 * @dev Function internal to manage payment declaration
	 *
	 * @param _requestId id of the request
	 * @param _amount amount of payment in wei to declare 
	 *
	 * @return true if the payment is done, false otherwise
	 */
	function paymentInternal(bytes32 _requestId, uint256[] _payeeAmounts, uint256 _value) 
		internal
	{
		uint256 totalPayeeAmounts = 0;

		for(uint8 i = 0; i < _payeeAmounts.length; i = i.add(1)) {
			totalPayeeAmounts = totalPayeeAmounts.add(_payeeAmounts[i]);
			if(_payeeAmounts[i] != 0) {
				requestCore.updateBalance(_requestId, i, _payeeAmounts[i].toInt256Safe());

				// pay the payment address if given, the id address otherwise
				address addressToPay;
				if(payeesPaymentAddress[_requestId][i] == 0) {
					addressToPay = requestCore.getPayeeAddress(_requestId, i);
				} else {
					addressToPay = payeesPaymentAddress[_requestId][i];
				}

				// payment done, the money is ready to withdraw by the payee
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
	 * @param _amount amount of the refund in wei to declare 
	 *
	 * @return true if the refund is done, false otherwise
	 */
	function refundInternal(bytes32 _requestId, address _address, uint256 _amount) 
		condition(requestCore.getState(_requestId)!=RequestCore.State.Canceled)
		internal
	{
		// Check if the _address is a payeesId
		int16 position = requestCore.getPayeePosition(_requestId, _address);
		if(position < 0) { // not a payee from the core
			// maybe in the payee payments address1
	        for (uint8 i = 0; i < requestCore.getSubPayeesCount(_requestId)+1 && position == -1; i = i.add(1))
	        {
	            if(payeesPaymentAddress[_requestId][i] == _address) {
	                position = int16(i);
	            }
	        }
		}

		require(position >= 0); // address must be found
		// useless (subPayee size <256): require(position < 265); // avoid overflow for the uint8 cast
		requestCore.updateBalance(_requestId, uint8(position), -_amount.toInt256Safe());

		// pay the payment address if given, the id address otherwise
		address addressToPay = payerRefundAddress[_requestId];
		if(addressToPay == 0) {
			addressToPay = requestCore.getPayer(_requestId);
		}

		// payment done, the money is ready to withdraw by the payer
		fundOrderInternal(_requestId, addressToPay, _amount);
	}

	/*
	 * @dev Function internal to manage fund mouvement
	 *
	 * @param _requestId id of the request 
	 * @param _recipient adress where the wei has to me send to
	 * @param _amount amount in wei to send
	 *
	 * @return true if the fund mouvement is done, false otherwise
	 */
	function fundOrderInternal(bytes32 _requestId, address _recipient, uint256 _amount) 
		internal
	{
		// try to send the fund 
		if(!_recipient.send(_amount)) {
			// if sendding fail, the funds are availbale to withdraw
			ethToWithdraw[_recipient] = ethToWithdraw[_recipient].add(_amount);
			// spread the word that the money is not sent but available to withdraw
			EtherAvailableToWithdraw(_requestId, _recipient, _amount);
		}
	}

	/*
	 * @dev Function internal to calculate Keccak-256 hash of a request with specified parameters
	 *
	 * @param _payees array of payees address (the position 0 will be the payee the others are subPayees)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payer Entity supposed to pay.
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 * @param _expirationDate timestamp after that the signed request cannot be broadcasted
	 *
	 * @return Keccak-256 hash of a request
	 */
	function getRequestHash(
		bytes _requestData,
		address[] _payeesPaymentAddress,
		uint256 _expirationDate
		)
		internal
		view
		returns(bytes32)
	{
		return keccak256(this,_requestData, _payeesPaymentAddress, _expirationDate);
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
		uint8 v,
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

	function checkRequestSignature(
		bytes _requestData,
		address[] _payeesPaymentAddress,
		uint256 expirationDate,
		bytes signature)
		public
		view
		returns (bool)
	{
		bytes32 hash = getRequestHash(_requestData, _payeesPaymentAddress, expirationDate);

		// signature as "v, r, s"
		uint8 v = uint8(signature[64]);
		v = v < 27 ? v.add(27) : v;
		bytes32 r = extractBytes32(signature, 0);
		bytes32 s = extractBytes32(signature, 32);

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
	 * @dev Modifier to check if msg.sender is payee
	 * @dev Revert if msg.sender is not payee
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
    function insertBytes20inBytes(bytes data, uint offset, bytes20 b) public returns(bytes) {
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
        uint160 m = uint160(_data[offset]); // 2576 gas
        m = m*256 + uint160(_data[offset+1]);
        m = m*256 + uint160(_data[offset+2]);
        m = m*256 + uint160(_data[offset+3]);
        m = m*256 + uint160(_data[offset+4]);
        m = m*256 + uint160(_data[offset+5]);
        m = m*256 + uint160(_data[offset+6]);
        m = m*256 + uint160(_data[offset+7]);
        m = m*256 + uint160(_data[offset+8]);
        m = m*256 + uint160(_data[offset+9]);
        m = m*256 + uint160(_data[offset+10]);
        m = m*256 + uint160(_data[offset+11]);
        m = m*256 + uint160(_data[offset+12]);
        m = m*256 + uint160(_data[offset+13]);
        m = m*256 + uint160(_data[offset+14]);
        m = m*256 + uint160(_data[offset+15]);
        m = m*256 + uint160(_data[offset+16]);
        m = m*256 + uint160(_data[offset+17]);
        m = m*256 + uint160(_data[offset+18]);
        m = m*256 + uint160(_data[offset+19]);
        return address(m);
    }

    function extractBytes32(bytes _data, uint offset) public pure returns (bytes32) {
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

    function isIntInBytesPositive(bytes data, uint offset) internal pure returns(bool) {
        return int8(data[offset]) >= 0;
    }
}
