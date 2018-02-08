pragma solidity 0.4.18;

import '../core/RequestCore.sol';
import '../base/math/SafeMath.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestEthereum
 *
 * @dev RequestEthereum is the currency contract managing the request payed in Ethereum
 *
 * @dev Requests can be created by the Payee with createRequest() or by the payer from a request signed offchain by the payee with createQuickRequest
 * @dev Requests don't have extension for now
 */

contract RequestEthereum is Pausable {
	using SafeMath for uint256;

	// RequestCore object
	RequestCore public requestCore;

	// Ethereum available to withdraw
	mapping(address => uint256) public ethToWithdraw;

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
	 * @param _payees array of payees address (the position 0 will be the payee - must be msg.sender - the others are subPayees)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payer Entity supposed to pay
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request 
	 */
	function createRequestAsPayee(address[] _payees, int256[] _expectedAmounts, address _payer, string _data)
		external
		payable
		whenNotPaused
		returns(bytes32 requestId)
	{
		require(msg.sender == _payees[0] && msg.sender != _payer && _payer != 0);

		// TODO: overflow possible (?)
        for (uint8 i = 1; i < _expectedAmounts.length; i++)
        {
        	require(_expectedAmounts[i]>=0);
        }

		requestId= requestCore.createRequest(msg.sender, _payees, _expectedAmounts, _payer, 0, _data);

		return requestId;
	}


	/*
	 * @dev Function to create a request as payer
	 *
	 * @dev msg.sender will be the payer
	 *
	 * @param _payees array of payees address (the position 0 will be the payee the others are subPayees)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals array to increase the ExpectedAmount for payees
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request 
	 */
	function createRequestAsPayer(address[] _payees, int256[] _expectedAmounts, uint256[] _payeeAmounts, uint256[] _additionals, string _data)
		external
		payable
		whenNotPaused
		returns(bytes32 requestId)
	{
		return createAcceptAndPay(msg.sender, _payees, _expectedAmounts, _payeeAmounts, _additionals, _data);
	}


	/*
	 * @dev Function to broadcast and accept an offchain signed request (can be paid and additionals also)
	 *
	 * @dev msg.sender must be _payer
	 * @dev the _payer can additionals 
	 *
	 * @param _payees array of payees address (the position 0 will be the payee the others are subPayees)
	 * @param _expectedAmounts array of Expected amount to be received by each payees
	 * @param _payeeAmounts array of amount repartition for the payment
	 * @param _additionals array to increase the ExpectedAmount for payees
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 * @param _expirationDate timestamp after that the signed request cannot be broadcasted
	 * @param v ECDSA signature parameter v.  TODO REPLACE IN ONE BYTES to avoid stack too deep
	 * @param r ECDSA signature parameters r. TODO REPLACE IN ONE BYTES to avoid stack too deep
	 * @param s ECDSA signature parameters s. TODO REPLACE IN ONE BYTES to avoid stack too deep
	 *
	 * @return Returns the id of the request 
	 */
	function broadcastSignedRequestAsPayer(address[] _payees, int256[] _expectedAmounts, uint256[] _payeeAmounts, uint256[] _additionals, string _data, uint256 _expirationDate, bytes signature)
		external
		payable
		whenNotPaused
		returns(bytes32)
	{
		// check expiration date
		require(_expirationDate >= block.timestamp);

		// check the signature
		require(checkRequestSignature(_payees, _expectedAmounts, 0, _data, _expirationDate, signature));

		return createAcceptAndPay(_payees[0], _payees, _expectedAmounts, _payeeAmounts, _additionals, _data);
	}



	/*
	 * @dev Internal function to create,accept and pay a request as Payer
	 *
	 * @dev msg.sender will be the payer
	 *
	 * @param _creator Entity which create the request
	 * @param _payee Entity which will receive the payment
	 * @param _expectedAmount Expected amount to be received
	 * @param _additionals Will increase the ExpectedAmount of the request right after its creation by adding additionals
	 * @param _data Hash linking to additional data on the Request stored on IPFS
	 *
	 * @return Returns the id of the request 
	 */
	function createAcceptAndPay(address _creator, address[] _payees, int256[] _expectedAmounts, uint256[] _payeeAmounts, uint256[] _additionals, string _data)
		internal
		returns(bytes32 requestId)
	{
		require(msg.sender != _payees[0] && _payees[0] != 0);

		// TODO: overflow possible (?)
        for (uint8 i = 1; i < _expectedAmounts.length; i++)
        {
        	require(_expectedAmounts[i]>=0);
        }

		requestId= requestCore.createRequest(_creator, _payees, _expectedAmounts, msg.sender, 0, _data);

		requestCore.accept(requestId);
		
		additionalInternal(requestId, _additionals);

		if(msg.value > 0) {
			paymentInternal(requestId, _payeeAmounts, msg.value);
		}

		return requestId;
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
		condition(requestCore.getPayer(_requestId)==msg.sender && requestCore.getState(_requestId)==RequestCore.State.Created)
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

		// impossible to cancel a Request with a balance != 0
		require(requestCore.getBalance(_requestId) == 0);

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
		condition(requestCore.getState(_requestId)==RequestCore.State.Accepted || (requestCore.getState(_requestId)==RequestCore.State.Created && requestCore.getPayer(_requestId)==msg.sender))
		condition(_additionalAmounts.length == 0 || msg.sender == requestCore.getPayer(_requestId))
	{
		// automatically accept request
		if(requestCore.getState(_requestId)==RequestCore.State.Created) {
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
		condition(requestCore.getState(_requestId)==RequestCore.State.Accepted || requestCore.getState(_requestId)==RequestCore.State.Created)

		onlyRequestPayee(_requestId)
	{
		// TODO overflow possible on i++
		for(uint8 i = 0; i < _subtractAmounts.length; i++) {
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
		condition(requestCore.getState(_requestId)==RequestCore.State.Accepted || requestCore.getState(_requestId)==RequestCore.State.Created)
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
		// TODO overflow possible on i++
		for(uint8 i = 0; i < _additionalAmounts.length; i++) {
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

		// TODO overflow possible on i++
		for(uint8 i = 0; i < _payeeAmounts.length; i++) {
			totalPayeeAmounts = totalPayeeAmounts.add(_payeeAmounts[i]);
			if(_payeeAmounts[i] != 0) {
				requestCore.updateBalance(_requestId, i, _payeeAmounts[i].toInt256Safe());
				// payment done, the money is ready to withdraw by the payee
				fundOrderInternal(_requestId, requestCore.getPayeeAddress(_requestId, i), _payeeAmounts[i]);
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
		condition(requestCore.getState(_requestId)==RequestCore.State.Accepted)
		internal
	{
		int16 position = requestCore.getPayeePosition(_requestId, _address);
		require(position >= 0); // same as onlyRequestPayeeOrSubPayees(_requestId, msg.sender)
		// TODO overflow int16 => uint8
		requestCore.updateBalance(_requestId, uint8(position), -_amount.toInt256Safe());
		// payment done, the money is ready to withdraw by the payee
		fundOrderInternal(_requestId, requestCore.getPayer(_requestId), _amount);
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
		address[] _payees,
		int256[] _expectedAmounts,
		address _payer,
		string _data,
		uint256 _expirationDate)
		internal
		view
		returns(bytes32)
	{
		return keccak256(this,_payees,_expectedAmounts,_payer,_data,_expirationDate);
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
		address[] payees,
		int256[] expectedAmounts,
		address payer,
		string data,
		uint256 expirationDate,
		bytes signature)
		public
		view
		returns (bool)
	{
		bytes32 hash = getRequestHash(payees,expectedAmounts,payer,data,expirationDate);

		// signature as "v, r, s"
		uint8 v = uint8(signature[64]);
		v = v < 27 ? v + 27 : v;
		bytes32 r = bytesToBytes32(signature, 0);
		bytes32 s = bytesToBytes32(signature, 32);

		return isValidSignature(payees[0], hash, v, r, s);
	}

  	function bytesToBytes32(bytes b, uint offset) private pure returns (bytes32) {
      bytes32 out;
    
      for (uint i = 0; i < 32; i++) {
        out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
      }
      return out;
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
	 * @dev Modifier to check if msg.sender is payee or subPayee
	 * @dev Revert if msg.sender is not payee
	 * @param _requestId id of the request 
	 */	
	modifier onlyRequestPayeeOrSubPayees(bytes32 _requestId, address _address) 
	{
		require(requestCore.getPayeePosition(_requestId, _address) != -1);
		_;
	}

	/*
	 * @dev Modifier to check if msg.sender is payee or payer
	 * @dev Revert if msg.sender is not payee or payer
	 * @param _requestId id of the request 
	 */
	modifier onlyRequestPayeeOrPayer(bytes32 _requestId) 
	{
		require(requestCore.getPayeeAddress(_requestId, 0)==msg.sender || requestCore.getPayer(_requestId)==msg.sender);
		_;
	}

	/*
	 * @dev Modifier to check if request is in a specify state
	 * @dev Revert if request not in a specify state
	 * @param _requestId id of the request 
	 * @param _state state to check
	 */
	modifier onlyRequestState(bytes32 _requestId, RequestCore.State _state) 
	{
		require(requestCore.getState(_requestId)==_state);
		_;
	}
}
