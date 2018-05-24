pragma solidity ^0.4.18;

import '../base/lifecycle/Pausable.sol';
import './RequestCore.sol';
import './RequestCollectInterface.sol';
import '../base/math/SafeMath.sol';
import '../base/math/SafeMathInt.sol';
import '../base/math/SafeMathUint8.sol';


/**
 * @title RequestCurrencyContractInterface
 *
 * @dev RequestCurrencyContractInterface is the currency contract managing the request in Ethereum
 * @dev The contract can be paused. In this case, nobody can create Requests anymore but people can still interact with them or withdraw funds.
 *
 * @dev Requests can be created by the Payee with createRequestAsPayee(), by the payer with createRequestAsPayer() or by the payer from a request signed offchain by the payee with broadcastSignedRequestAsPayer
 */
contract RequestCurrencyContractInterface is RequestCollectInterface {
	using SafeMath for uint256;
	using SafeMathInt for int256;
	using SafeMathUint8 for uint8;

	// RequestCore object
	RequestCore public requestCore;

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 */
	function RequestCurrencyContractInterface(address _requestCoreAddress, address _addressBurner) 
		RequestCollectInterface(_addressBurner)
		public
	{
		requestCore=RequestCore(_requestCoreAddress);
	}

    /*
     * @dev Base function for request creation
     *
     * @dev msg.sender will be the creator
     *
     * @param _payer Entity expected to pay
     * @param _payeesIdAddress array of payees address (the index 0 will be the payee - must be msg.sender - the others are subPayees)
     * @param _expectedAmounts array of Expected amount to be received by each payees
     * @param _data Hash linking to additional data on the Request stored on IPFS
     *
     * @return Returns the id of the request and the sum of the expected amounts
     */
	function createCoreRequestInternal(
		address 	_payer,
		address[] 	_payeesIdAddress,
		int256[] 	_expectedAmounts,
		string 		_data)
		internal
		whenNotPaused
		returns(bytes32 requestId, int256 totalExpectedAmounts)
	{
		totalExpectedAmounts = 0;
		for (uint8 i = 0; i < _expectedAmounts.length; i = i.add(1))
		{
			// all expected amounts must be positive
			require(_expectedAmounts[i]>=0);
			// compute the total expected amount of the request
			totalExpectedAmounts = totalExpectedAmounts.add(_expectedAmounts[i]);
		}

		// store request in the core
		requestId= requestCore.createRequest(msg.sender, _payeesIdAddress, _expectedAmounts, _payer, _data);
	}

    /*
     * @dev Function to accept a request
     *
     * @dev msg.sender must be _payer
     *
     * @param _requestId id of the request
     */
	function acceptAction(bytes32 _requestId)
		public
		whenNotPaused
		onlyRequestPayer(_requestId)
	{
		// only a created request can be accepted
		require(requestCore.getState(_requestId)==RequestCore.State.Created);

		// declare the acceptation in the core
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
	function cancelAction(bytes32 _requestId)
		public
		whenNotPaused
	{
		// payer can cancel if request is just created
		// payee can cancel when request is not canceled yet
		require((requestCore.getPayer(_requestId)==msg.sender && requestCore.getState(_requestId)==RequestCore.State.Created)
				|| (requestCore.getPayeeAddress(_requestId,0)==msg.sender && requestCore.getState(_requestId)!=RequestCore.State.Canceled));

		// impossible to cancel a Request with any payees balance != 0
		require(requestCore.areAllBalanceNull(_requestId));

		// declare the cancellation in the core
		requestCore.cancel(_requestId);
	}


    /*
     * @dev Function to declare additionals
     *
     * @dev msg.sender must be _payer
     * @dev the request must be accepted or created
     *
     * @param _requestId id of the request
     * @param _additionalAmounts amounts of additional to declare (index 0 is for main payee)
     */
	function additionalAction(bytes32 _requestId, uint256[] _additionalAmounts)
		public
		whenNotPaused
		onlyRequestPayer(_requestId)
	{

		// impossible to make additional if request is canceled
		require(requestCore.getState(_requestId)!=RequestCore.State.Canceled);

		// impossible to declare more additionals than the number of payees
		require(_additionalAmounts.length <= requestCore.getSubPayeesCount(_requestId).add(1));

		for(uint8 i = 0; i < _additionalAmounts.length; i = i.add(1)) {
			// no need to declare a zero as additional 
			if(_additionalAmounts[i] != 0) {
				// Store and declare the additional in the core
				requestCore.updateExpectedAmount(_requestId, i, _additionalAmounts[i].toInt256Safe());
			}
		}
	}

    /*
     * @dev Function to declare subtracts
     *
     * @dev msg.sender must be _payee
     * @dev the request must be accepted or created
     *
     * @param _requestId id of the request
     * @param _subtractAmounts amounts of subtract to declare (index 0 is for main payee)
     */
	function subtractAction(bytes32 _requestId, uint256[] _subtractAmounts)
		public
		whenNotPaused
		onlyRequestPayee(_requestId)
	{
		// impossible to make subtracts if request is canceled
		require(requestCore.getState(_requestId)!=RequestCore.State.Canceled);

		// impossible to declare more subtracts than the number of payees
		require(_subtractAmounts.length <= requestCore.getSubPayeesCount(_requestId).add(1));

		for(uint8 i = 0; i < _subtractAmounts.length; i = i.add(1)) {
			// no need to declare a zero as subtracts 
			if(_subtractAmounts[i] != 0) {
				// subtract must be equal or lower than amount expected
				require(requestCore.getPayeeExpectedAmount(_requestId,i) >= _subtractAmounts[i].toInt256Safe());
				// Store and declare the subtract in the core
				requestCore.updateExpectedAmount(_requestId, i, -_subtractAmounts[i].toInt256Safe());
			}
		}
	}
	// ----------------------------------------------------------------------------------------

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
	 * @dev Modifier to check if msg.sender is payer
	 * @dev Revert if msg.sender is not payer
	 * @param _requestId id of the request
	 */	
	modifier onlyRequestPayer(bytes32 _requestId)
	{
		require(requestCore.getPayer(_requestId)==msg.sender);
		_;
	}
}
