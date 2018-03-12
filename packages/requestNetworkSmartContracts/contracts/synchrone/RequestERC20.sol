pragma solidity 0.4.18;

import '../core/RequestCore.sol';
import '../base/math/SafeMathUint8.sol';
import '../base/token/ERC20.sol';
import './RequestCurrencyContractInterface.sol';
import './RequestERC20Collect.sol';

/**
 * @title RequestERC20
 *
 * @dev RequestERC20 is the currency contract managing the request in Ethereum
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
	 * @dev Function to declare an additional
	 *
	 * @dev msg.sender must be _payer
	 * @dev the request must be accepted or created
	 *
	 * @param _requestId id of the request
	 * @param _additionalAmounts amounts of additional in wei to declare (index 0 is for )
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
	 * @dev Function PAYABLE to pay in ether a request.
	 *
	 * @dev the request will be automatically accepted if msg.sender==payer. 
	 *
	 * @param _requestId id of the request
	 * @param _payeesAmounts Amount to pay to payees (sum must be equals to msg.value)
	 * @param _additionalsAmount amount of additionals per payee in wei to declare
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
			acceptInternal(_requestId); // TODO more costy than just call requestCore
			// requestCore.accept(_requestId);
		}

		if (_additionalAmounts.length != 0) {
			additionalInternal(_requestId, _additionalAmounts);
		}

		paymentInternal(_requestId, _payeeAmounts);
	}

	/*
	 * @dev Function to pay back in ether a request to the payee
	 *
	 * @dev msg.sender must be one of the payees
	 * @dev the request must be created or accepted
	 * @dev the payback must be lower than the amount already paid for the request
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
	 * @param _value amount paid
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
	 * @param _address address from where the refund have been done
	 *
	 * @return true if the refund is done, false otherwise
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
	 * @param _amount amount in wei to send
	 *
	 * @return true if the fund mouvement is done, false otherwise
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
}
