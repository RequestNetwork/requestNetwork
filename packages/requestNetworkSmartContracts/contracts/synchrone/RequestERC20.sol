pragma solidity 0.4.18;

import '../core/RequestCore.sol';
import '../base/math/SafeMathUint8.sol';
import '../base/token/ERC20.sol';
import './RequestCurrencyContractInterface.sol';
import './RequestERC20Collect.sol';

/**
 * @title RequestERC20
 *
 * @dev RequestERC20 is the currency contract managing the request in ERC20 token
 * @dev The contract can be paused. In this case, nobody can create Requests anymore but people can still interact with them or withdraw funds.
 *
 * @dev Requests can be created by the Payee with createRequestAsPayee(), by the payer with createRequestAsPayer() or by the payer from a request signed offchain by the payee with broadcastSignedRequestAsPayer
 */
contract RequestERC20 is RequestCurrencyContractInterface, RequestERC20Collect {
	using SafeMath for uint256;
	using SafeMathInt for int256;
	using SafeMathUint8 for uint8;

	// payment addresses by requestId (optional). We separate the Identity of the payee/payer (in the core) and the wallet address in the currency contract
	mapping(bytes32 => address[256]) public payeesPaymentAddress;
	mapping(bytes32 => address) public payerRefundAddress;

	// token addresses
	mapping(bytes32 => address) public requestTokens;

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 * @param _requestBurnerAddress Request Burner contract address
	 */
	function RequestERC20(address _requestCoreAddress, address _requestBurnerAddress) 
			RequestCurrencyContractInterface(_requestCoreAddress)
			RequestERC20Collect(_requestBurnerAddress)
			public
	{
		// nothing to do
	}

	/*
	 * @dev Function to create a request as payee
	 *
	 * @dev msg.sender must be the main payee
	 * @dev _addressToken must be a whitelisted token
	 * @dev if _payeesPaymentAddress.length > _payeesIdAddress.length, the extra addresses will be stored but never used
	 *
	 * @param _addressToken address of the erc20 token used for this request
	 * @param _payeesIdAddress array of payees address (the index 0 will be the payee - must be msg.sender - the others are subPayees)
	 * @param _payeesPaymentAddress array of payees address for payment (optional)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payer Entity expected to pay
	 * @param _payerRefundAddress Address of refund for the payer (optional)
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request
	 */
	function createRequestAsPayeeAction(
		address 	_addressToken,
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
		require(isTokenWhitelisted(_addressToken));
		require(msg.sender == _payeesIdAddress[0] && msg.sender != _payer && _payer != 0);

		int256 totalExpectedAmounts;
		(requestId, totalExpectedAmounts) = createCoreRequestInternal(_payer, _payeesIdAddress, _expectedAmounts, _data);
		
		// compute and send fees
		uint256 fees = collectEstimation(_addressToken, totalExpectedAmounts);
		require(fees == msg.value && collectForREQBurning(fees));

		// store the token used
		requestTokens[requestId] = _addressToken;

		// set payment addresses for payees
		for (uint8 j = 0; j < _payeesPaymentAddress.length; j = j.add(1)) {
			payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
		}
		// set payment address for payer
		if(_payerRefundAddress != 0) {
			payerRefundAddress[requestId] = _payerRefundAddress;
		}

		return requestId;
	}

	/*
	 * @dev Function to broadcast and accept an offchain signed request (the broadcaster can also pays and makes additionals )
	 *
	 * @dev msg.sender vill be the _payer
	 * @dev _addressToken must be a whitelisted token
	 * @dev only the _payer can additionals
	 * @dev if _payeesPaymentAddress.length > _requestData.payeesIdAddress.length, the extra addresses will be stored but never used
	 *
	 * @param _addressToken address of the erc20 token used for this request
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
		address 	_addressToken,
		bytes 		_requestData, // gather data to avoid "stack too deep"
		address[] 	_payeesPaymentAddress,
		uint256[] 	_payeeAmounts,
		uint256[] 	_additionals,
		uint256 	_expirationDate,
		bytes 		_signature)
		external
		payable
		whenNotPaused
		returns(bytes32 requestId)
	{
		require(isTokenWhitelisted(_addressToken));

		// check expiration date
		require(_expirationDate >= block.timestamp);

		// check the signature
		require(checkRequestSignature(_requestData, _addressToken, _payeesPaymentAddress, _expirationDate, _signature));

		return createAcceptAndPayFromBytes(_requestData, _addressToken, _payeesPaymentAddress, _payeeAmounts, _additionals);
	}

	/*
	 * @dev Internal function to create, accept, add additionals and pay a request as Payer
	 *
	 * @dev msg.sender must be _payer
	 *
	 * @param _requestData nasty bytes containing : creator, payer, payees|expectedAmounts, data
	 * @param _addressToken address of the erc20 token used for this request
	 * @param _payeesPaymentAddress array of payees address for payment (optional)
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals Will increase the ExpectedAmount of the request right after its creation by adding additionals
	 *
	 * @return Returns the id of the request
	 */
	function createAcceptAndPayFromBytes(
		bytes 		_requestData,
		address 	_addressToken,
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
			// all expected amount must be positive
			require(expectedAmountTemp>0);
		}

		// compute and send fees
		uint256 fees = collectEstimation(_addressToken, totalExpectedAmounts);
		// check fees has been well received
		require(fees == msg.value && collectForREQBurning(fees));

		// store request in the core, but first insert the msg.sender as the payer in the bytes
		requestId = requestCore.createRequestFromBytes(insertBytes20inBytes(_requestData, 20, bytes20(msg.sender)));

		// store the token used
		requestTokens[requestId] = _addressToken;
		
		// set payment addresses for payees
		for (uint8 j = 0; j < _payeesPaymentAddress.length; j = j.add(1)) {
			payeesPaymentAddress[requestId][j] = _payeesPaymentAddress[j];
		}

		// accept and pay the request with the value remaining after the fee collect
		acceptAndPay(requestId, _payeeAmounts, _additionals, totalExpectedAmounts);

		return requestId;
	}

	/*
	 * @dev Internal function to accept, add additionals and pay a request as Payer
	 *
	 * @param _requestId id of the request
	 * @param _payeesAmounts Amount to pay to payees (sum must be equals to _amountPaid)
	 * @param _additionals Will increase the ExpectedAmounts of payees
	 * @param _payeeAmountsSum total of amount token send for this transaction
	 *
	 */	
	function acceptAndPay(
		bytes32 _requestId,
		uint256[] _payeeAmounts,
		uint256[] _additionals,
		int256 _payeeAmountsSum)
		internal
	{
		// requestCore.accept(_requestId);
		acceptInternal(_requestId);
		
		additionalInternal(_requestId, _additionals);

		if(_payeeAmountsSum > 0) {
			paymentInternal(_requestId, _payeeAmounts);
		}
	}

	/*
	 * @dev Function to accept a request
	 *
	 * @dev msg.sender must be _payer
	 * @dev A request can also be accepted by using directly the payment function on a request in the Created status
	 *
	 * @param _requestId id of the request
	 */
	function acceptAction(bytes32 _requestId)
		external
	{
		acceptInternal(_requestId);
	}

	/*
	 * @dev Function to cancel a request
	 *
	 * @dev msg.sender must be the _payer or the _payee.
	 * @dev only request with balance equals to zero can be cancel
	 *
	 * @param _requestId id of the request
	 */
	function cancelAction(bytes32 _requestId)
		external
	{
		cancelInternal(_requestId);
	}

	/*
	 * @dev Function PAYABLE to pay a request in ether.
	 *
	 * @dev the request will be automatically accepted if msg.sender==payer. 
	 *
	 * @param _requestId id of the request
	 * @param _payeesAmounts Amount to pay to payees (sum must be equal to msg.value) in wei
	 * @param _additionalsAmount amount of additionals per payee in wei to declare
	 */
	function additionalAction(bytes32 _requestId, uint256[] _additionalAmounts)
		public
	{
		additionalInternal(_requestId, _additionalAmounts);
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
	{
		subtractInternal(_requestId, _subtractAmounts);
	}

	/*
	 * @dev Function to pay a request in ERC20 token
	 *
	 * @dev msg.sender must have a balance of the token higher or equal to the sum of _payeeAmounts
	 * @dev msg.sender must have approved an amount of the token higher or equal to the sum of _payeeAmounts to the current contract
	 * @dev the request will be automatically accepted if msg.sender==payer. 
	 *
	 * @param _requestId id of the request
	 * @param _payeeAmounts Amount to pay to payees (sum must be equal to msg.value) in wei
	 * @param _additionalAmounts amount of additionals per payee in wei to declare
	 */
	function paymentAction(
		bytes32 _requestId,
		uint256[] _payeeAmounts,
		uint256[] _additionalAmounts)
		external
		whenNotPaused
	{
		// automatically accept request if request is created and msg.sender is payer
		if (requestCore.getState(_requestId)==RequestCore.State.Created && msg.sender == requestCore.getPayer(_requestId)) {
			acceptInternal(_requestId);
		}

		if (_additionalAmounts.length != 0) {
			additionalInternal(_requestId, _additionalAmounts);
		}

		paymentInternal(_requestId, _payeeAmounts);
	}


	/*
	 * @dev Function to pay back in ERC20 token a request to the payees
	 *
	 * @dev msg.sender must have a balance of the token higher or equal to _amountToRefund
	 * @dev msg.sender must have approved an amount of the token higher or equal to _amountToRefund to the current contract
	 * @dev msg.sender must be one of the payees or one of the payees payment address
	 * @dev the request must be created or accepted
	 *
	 * @param _requestId id of the request
	 */
	function refundAction(bytes32 _requestId, uint256 _amountToRefund)
		external
		whenNotPaused
	{
		refundInternal(_requestId, msg.sender, _amountToRefund);
	}


	// ---- INTERNAL FUNCTIONS ----------------------------------------------------------------
	/*
	 * @dev Function internal to manage payment declaration
	 *
	 * @param _requestId id of the request
	 * @param _payeesAmounts Amount to pay to payees (sum must be equals to msg.value)
	 */
	function paymentInternal(
		bytes32 	_requestId,
		uint256[] 	_payeeAmounts)
		internal
	{
		require(requestCore.getState(_requestId)!=RequestCore.State.Canceled);

		// we cannot have more amounts declared than actual payees
		require(_payeeAmounts.length <= requestCore.getSubPayeesCount(_requestId).add(1));

		for(uint8 i = 0; i < _payeeAmounts.length; i = i.add(1)) {
			if(_payeeAmounts[i] != 0) {
				// Store and declare the payment to the core
				requestCore.updateBalance(_requestId, i, _payeeAmounts[i].toInt256Safe());

				// pay the payment address if given, the id address otherwise
				address addressToPay;
				if(payeesPaymentAddress[_requestId][i] == 0) {
					addressToPay = requestCore.getPayeeAddress(_requestId, i);
				} else {
					addressToPay = payeesPaymentAddress[_requestId][i];
				}

				// payment done, the token need to be sent
				fundOrderInternal(_requestId, msg.sender, addressToPay, _payeeAmounts[i]);
			}
		}
	}


	/*
	 * @dev Function internal to manage refund declaration
	 *
	 * @param _requestId id of the request
	 * @param _address address from where the refund has been done
	 * @param _amount amount of the refund in ERC20 token to declare
	 */
	function refundInternal(
		bytes32 _requestId,
		address _address,
		uint256 _amount)
		internal
	{
		require(requestCore.getState(_requestId)!=RequestCore.State.Canceled);

		// Check if the _address is a payeesId
		int16 payeeIndex = requestCore.getPayeeIndex(_requestId, _address);
		if(payeeIndex < 0) {
			// if not ID addresses maybe in the payee payments addresses
			for (uint8 i = 0; i < requestCore.getSubPayeesCount(_requestId)+1 && payeeIndex == -1; i = i.add(1))
			{
				if(payeesPaymentAddress[_requestId][i] == _address) {
					// get the payeeIndex
					payeeIndex = int16(i);
				}
			}
		}
		// the address must be found somewhere
		require(payeeIndex >= 0); 

		// useless (subPayee size <256): require(payeeIndex < 265);
		requestCore.updateBalance(_requestId, uint8(payeeIndex), -_amount.toInt256Safe());

		// refund to the payment address if given, the id address otherwise
		address addressToPay = payerRefundAddress[_requestId];
		if(addressToPay == 0) {
			addressToPay = requestCore.getPayer(_requestId);
		}

		// refund declared, the money is ready to be sent to the payer
		fundOrderInternal(_requestId, _address, addressToPay, _amount);
	}

	/*
	 * @dev Function internal to manage fund mouvement
	 * @dev We had to chose between a withdraw pattern, a send pattern or a send + withdraw pattern and chose the last. 
	 * @dev The withdraw pattern would have been a too big inconvenient for the UX. The send pattern would have allow someone to lock a request. 
	 * @dev The send + withdraw pattern will have to be clearly explained to users. If the payee is a contract which can let a transfer fail, it will need to be able to call a withdraw function from Request. 
	 *
	 * @param _requestId id of the request
	 * @param _recipient address where the token will get from
	 * @param _recipient address where the token has to be sent to
	 * @param _amount amount in ERC20 token to send
	 */
	function fundOrderInternal(
		bytes32 _requestId,
		address _from,
		address _recipient,
		uint256 _amount)
		internal
	{
		ERC20 erc20Token = ERC20(requestTokens[_requestId]);		
		require(erc20Token.transferFrom(_from, _recipient, _amount));
	}
	// -----------------------------------------------------------------------------

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
	 * @param _addressToken address of the erc20 token used for this request
	 * @param _payeesPaymentAddress array of payees payment addresses (the index 0 will be the payee the others are subPayees)
	 * @param _expirationDate timestamp after that the signed request cannot be broadcasted
  	 * @param _signature ECDSA signature containing v, r and s as bytes
  	 *
	 * @return Validity of order signature.
	 */	
	function checkRequestSignature(
		bytes 		_requestData,
		address		_addressToken,
		address[] 	_payeesPaymentAddress,
		uint256 	_expirationDate,
		bytes 		_signature)
		public
		view
		returns (bool)
	{
		bytes32 hash = getRequestHash(_requestData, _addressToken, _payeesPaymentAddress, _expirationDate);

		// extract "v, r, s" from the signature
		uint8 v = uint8(_signature[64]);
		v = v < 27 ? v.add(27) : v;
		bytes32 r = extractBytes32(_signature, 0);
		bytes32 s = extractBytes32(_signature, 32);

		// check signature of the hash with the creator address
		return isValidSignature(extractAddress(_requestData, 0), hash, v, r, s);
	}

	/*
	 * @dev Function internal to calculate Keccak-256 hash of a request with specified parameters
	 *
	 * @param _data bytes containing all the data packed
	 * @param _addressToken address of the erc20 token used for this request
	 * @param _payeesPaymentAddress array of payees payment addresses
	 * @param _expirationDate timestamp after what the signed request cannot be broadcasted
	 *
	 * @return Keccak-256 hash of (this,_requestData, _payeesPaymentAddress, _expirationDate)
	 */
	function getRequestHash(
		bytes 		_requestData,
		address		_addressToken,
		address[] 	_payeesPaymentAddress,
		uint256 	_expirationDate)
		internal
		view
		returns(bytes32)
	{
		return keccak256(this,_requestData, _addressToken, _payeesPaymentAddress, _expirationDate);
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
}
