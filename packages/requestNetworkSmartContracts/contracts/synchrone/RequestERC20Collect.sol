pragma solidity 0.4.18;

import '../base/math/SafeMath.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestERC20Collect
 *
 * @dev RequestERC20Collect is a contract managing the fees for ethereum currency contract
 */
contract RequestERC20Collect is Pausable {
	using SafeMath for uint256;

    struct Token {
        uint256 rateFeesNumerator;
        uint256 rateFeesDenominator;
        uint256 maxFees;
        bool whiteListed;
    }

	// fees rate per token
	mapping(address => Token) public tokensWhiteList;

	// address of the contract that will burn req token (probably through Kyber)
	address public requestBurnerContract;

	/*
	 * @dev Constructor
	 * @param _requestBurnerContract Address of the contract where to send the ethers. 
	 * This burner contract will have a function that can be called by anyone and will exchange ethers to req via Kyber and burn the REQ
	 */  
	function RequestERC20Collect(address _requestBurnerContract) 
		public
	{
		requestBurnerContract = _requestBurnerContract;
	}

	/*
	 * @dev send fees to the request burning address
	 * @param _amount amount to send to the burning address
	 */  
	function collectForREQBurning(uint256 _amount)
		internal
		returns(bool)
	{
		return requestBurnerContract.send(_amount);
	}

	/*
	 * @dev compute the fees
	 * @param _expectedAmount amount expected for the request
	 * @return 
	 */  
	function collectEstimation(address _tokenAddress, int256 _expectedAmount)
		public
		view
		returns(uint256)
	{
		if(_expectedAmount<0) return 0;

		uint256 maxFees = tokensWhiteList[_tokenAddress].maxFees;
		uint256 computedCollect = uint256(_expectedAmount).mul(tokensWhiteList[_tokenAddress].rateFeesNumerator);

		uint256 rateFeesDenominator = tokensWhiteList[_tokenAddress].rateFeesDenominator;
		if(rateFeesDenominator != 0) {
			computedCollect = computedCollect.div(rateFeesDenominator);
		}

		return computedCollect < maxFees ? computedCollect : maxFees;
	}

	/*
	 * @dev set the fees numerator rate
	 * @param _newRate new rate
	 * @param _newRate new rate
	 * @return 
	 */  
	function setRateFeesNumerator(address _addressToken, uint256 _rateFeesNumerator)
		external
		onlyOwner
	{
		tokensWhiteList[_addressToken].rateFeesNumerator = _rateFeesNumerator;
	}

	/*
	 * @dev set the fees denominator rate
	 * @param _newRate new rate
	 * @param _newRate new rate
	 * @return 
	 */  
	function setRateFeesDenominator(address _addressToken, uint256 _rateFeesDenominator)
		external
		onlyOwner
	{
		tokensWhiteList[_addressToken].rateFeesDenominator = _rateFeesDenominator;
	}

	/*
	 * @dev set the maximum fees in wei
	 * @param _newMax new max
	 * @return 
	 */  
	function setMaxCollectable(address _addressToken, uint256 _newMaxFees) 
		external
		onlyOwner
	{
		tokensWhiteList[_addressToken].maxFees = _newMaxFees;
	}

	/*
	 * @dev set the request burner address
	 * @param _requestBurnerContract address of the contract that will burn req token (probably through Kyber)
	 * @return 
	 */  
	function setRequestBurnerContract(address _requestBurnerContract) 
		external
		onlyOwner
	{
		requestBurnerContract=_requestBurnerContract;
	}

		// -----------------------------------------------------------------------------
	// Function for token Whitelist ------------------------------------------------
	function isTokenWhitelisted(address _addressToken)
		constant
		internal
		returns(bool)
	{
		return tokensWhiteList[_addressToken].whiteListed;
	}

	function updateTokenWhitelist(address _addressToken, bool _state)
		external
		onlyOwner
	{
		tokensWhiteList[_addressToken].whiteListed = _state;
	}
	// -----------------------------------------------------------------------------

}
