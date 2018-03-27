pragma solidity 0.4.18;

import '../base/lifecycle/Pausable.sol';
import '../core/RequestCore.sol';
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
contract RequestCurrencyContractInterface is Pausable {
	using SafeMath for uint256;
	using SafeMathInt for int256;
	using SafeMathUint8 for uint8;

	// RequestCore object
	RequestCore public requestCore;

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 */
	function RequestCurrencyContractInterface(address _requestCoreAddress) 
		public
	{
		requestCore=RequestCore(_requestCoreAddress);
	}

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
			// all expected amount must be positive
			require(_expectedAmounts[i]>=0);
			// compute the total expected amount of the request
			totalExpectedAmounts = totalExpectedAmounts.add(_expectedAmounts[i]);
		}

		// store request in the core
		requestId= requestCore.createRequest(msg.sender, _payeesIdAddress, _expectedAmounts, _payer, _data);
	}

	function acceptInternal(bytes32 _requestId)
		internal
		whenNotPaused
		onlyRequestPayer(_requestId)
	{
		// only a created request can be accepted
		require(requestCore.getState(_requestId)==RequestCore.State.Created);

		// declare the acceptation in the core
		requestCore.accept(_requestId);
	}

	function cancelInternal(bytes32 _requestId)
		internal
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

	function additionalInternal(bytes32 _requestId, uint256[] _additionalAmounts)
		internal
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

	function subtractInternal(bytes32 _requestId, uint256[] _subtractAmounts)
		internal
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
