pragma solidity ^0.4.18;

import '../core/RequestCore.sol';
import '../base/math/SafeMathUint8.sol';
import '../base/token/ERC20.sol';
import '../core/RequestCurrencyContractInterface.sol';

/**
 * @title RequestERC20
 *
 * @dev RequestERC20 is the currency contract managing the request in ERC20 token
 * @dev The contract can be paused. In this case, nobody can create Requests anymore but people can still interact with them or withdraw funds.
 *
 * @dev Requests can be created by the Payee with createRequestAsPayee(), by the payer with createRequestAsPayer() or by the payer from a request signed offchain by the payee with broadcastSignedRequestAsPayer
 */
contract RequestERC20 is RequestCurrencyContractInterface {
	using SafeMath for uint256;
	using SafeMathInt for int256;
	using SafeMathUint8 for uint8;

	// payment addresses by requestId (optional). We separate the Identity of the payee/payer (in the core) and the wallet address in the currency contract
	mapping(bytes32 => address[256]) public payeesPaymentAddress;
	mapping(bytes32 => address) public payerRefundAddress;

	// token address
	ERC20 public erc20Token;

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 * @param _requestBurnerAddress Request Burner contract address
     * @param _erc20Token ERC20 token contract handled by this currency contract
	 */
	function RequestERC20(address _requestCoreAddress, address _requestBurnerAddress, ERC20 _erc20Token) 
		RequestCurrencyContractInterface(_requestCoreAddress, _requestBurnerAddress)
		public
	{
		erc20Token = _erc20Token;
	}

	/*
	 * @dev Function to create a request as payee
	 *
	 * @dev msg.sender must be the main payee
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
	function createRequestAsPayeeAction(
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

		int256 totalExpectedAmounts;
		(requestId, totalExpectedAmounts) = createCoreRequestInternal(_payer, _payeesIdAddress, _expectedAmounts, _data);
		
		// compute and send fees
		uint256 fees = collectEstimation(totalExpectedAmounts);
		require(fees == msg.value && collectForREQBurning(fees));

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
	 * @dev Function to create a request as payer. The request is payed if _payeeAmounts > 0.
	 *
	 * @dev msg.sender will be the payer
	 * @dev If a contract is given as a payee make sure it is payable. Otherwise, the request will not be payable.
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
	function createRequestAsPayerAction(
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

		int256 totalExpectedAmounts;
		(requestId, totalExpectedAmounts) = createCoreRequestInternal(msg.sender, _payeesIdAddress, _expectedAmounts, _data);

		// set payment address for payer
		if(_payerRefundAddress != 0) {
			payerRefundAddress[requestId] = _payerRefundAddress;
		}

		// accept and pay the request with the value remaining after the fee collect
		acceptAndPay(requestId, _payeeAmounts, _additionals, totalExpectedAmounts);

		return requestId;
	}

	/*
	 * @dev Function to broadcast and accept an offchain signed request (the broadcaster can also pays and makes additionals )
	 *
	 * @dev msg.sender will be the _payer
	 * @dev only the _payer can make additionals
	 * @dev if _payeesPaymentAddress.length > _requestData.payeesIdAddress.length, the extra addresses will be stored but never used
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
	function broadcastSignedRequestAsPayerAction(
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
		// check expiration date
		require(_expirationDate >= block.timestamp);

		// check the signature
		require(checkRequestSignature(_requestData, _payeesPaymentAddress, _expirationDate, _signature));

		return createAcceptAndPayFromBytes(_requestData, _payeesPaymentAddress, _payeeAmounts, _additionals);
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
			// all expected amount must be positive
			require(expectedAmountTemp>0);
		}

		// compute and send fees
		uint256 fees = collectEstimation(totalExpectedAmounts);
		// check fees has been well received
		require(fees == msg.value && collectForREQBurning(fees));

		// insert the msg.sender as the payer in the bytes
		updateBytes20inBytes(_requestData, 20, bytes20(msg.sender));
		// store request in the core
		requestId = requestCore.createRequestFromBytes(_requestData);
		
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
		acceptAction(_requestId);
		
		additionalAction(_requestId, _additionals);

		if(_payeeAmountsSum > 0) {
			paymentInternal(_requestId, _payeeAmounts);
		}
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
			acceptAction(_requestId);
		}

		if (_additionalAmounts.length != 0) {
			additionalAction(_requestId, _additionalAmounts);
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
				fundOrderInternal(msg.sender, addressToPay, _payeeAmounts[i]);
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

        // get the number of payees
        uint8 payeesCount = requestCore.getSubPayeesCount(_requestId).add(1);

		if(payeeIndex < 0) {
			// if not ID addresses maybe in the payee payments addresses
			for (uint8 i = 0; i < payeesCount && payeeIndex == -1; i = i.add(1))
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
		fundOrderInternal(_address, addressToPay, _amount);
	}

	/*
	 * @dev Function internal to manage fund mouvement
     *
	 * @param _from address where the token will get from
	 * @param _recipient address where the token has to be sent to
	 * @param _amount amount in ERC20 token to send
	 */
	function fundOrderInternal(
		address _from,
		address _recipient,
		uint256 _amount)
		internal
	{	
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
		bytes 		_requestData,
		address[] 	_payeesPaymentAddress,
		uint256 	_expirationDate)
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
	function extractAddress(bytes _data, uint offset)
		internal
		pure
		returns (address m) 
	{
		require(offset >=0 && offset + 20 <= _data.length);
		assembly {
			m := and( mload(add(_data, add(20, offset))), 
					  0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
		}
	}

	/*
	 * @dev extract a bytes32 from a bytes
	 * @param data bytes from where the bytes32 will be extract
	 * @param offset position of the first byte of the bytes32
	 * @return address
	 */
	function extractBytes32(bytes _data, uint offset)
		public
		pure
		returns (bytes32 bs)
	{
		require(offset >=0 && offset + 32 <= _data.length);
		assembly {
			bs := mload(add(_data, add(32, offset)))
		}
	}

	/*
	 * @dev modify 20 bytes in a bytes
	 * @param data bytes to modify
	 * @param offset position of the first byte to modify
	 * @param b bytes20 to insert
	 * @return address
	 */
	function updateBytes20inBytes(bytes data, uint offset, bytes20 b)
		internal
		pure
	{
		require(offset >=0 && offset + 20 <= data.length);
		assembly {
			let m := mload(add(data, add(20, offset)))
			m := and(m, 0xFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000000000000)
			m := or(m, div(b, 0x1000000000000000000000000))
			mstore(add(data, add(20, offset)), m)
		}
	}
}
