pragma solidity 0.4.18;

import '../base/math/SafeMath.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestERC20Collect
 *
 * @dev RequestERC20Collect is a contract managing the fees for ERC20 currency contract
 */
contract RequestERC20Collect is Pausable {
	using SafeMath for uint256;

    struct Token {
        uint256 rateFeesNumerator;
        uint256 rateFeesDenominator;
        uint256 maxFees;
        bool whiteListed;
    }

	// information about tokens : rate, max fees and whiteList
	mapping(address => Token) public tokensWhiteList;

	// address of the contract that will burn req token (probably through Kyber)
	address public requestBurnerContract;

    /*
     *  Events 
     */
    event UpdateRateFees(address indexed token, uint256 rateFeesNumerator, uint256 rateFeesDenominator);
    event UpdateMaxFees(address indexed token, uint256 maxFees);

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
	 * @param _tokenAddress ERC20 token address of the request
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
	 * @dev set the fees rate
	 * @param _addressToken 			token address
	 * @param _rateFeesNumerator 		numerator rate
	 * @param _rateFeesDenominator 		denominator rate
	 * @return 
	 */  
	function setRateFees(address _addressToken, uint256 _rateFeesNumerator, uint256 _rateFeesDenominator)
		external
		onlyOwner
	{
		tokensWhiteList[_addressToken].rateFeesNumerator = _rateFeesNumerator;
		UpdateRateFees(_addressToken, _rateFeesNumerator, _rateFeesDenominator);
	}

	/*
	 * @dev set the maximum fees in wei
	 * @param _addressToken 			token address
	 * @param _newMax new max
	 * @return 
	 */  
	function setMaxCollectable(address _addressToken, uint256 _newMaxFees) 
		external
		onlyOwner
	{
		tokensWhiteList[_addressToken].maxFees = _newMaxFees;
		UpdateMaxFees(_addressToken, _newMaxFees);
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
	/*
	 * Check id a token is whitelisted
	 * @return true if token is whitelisted, false otherwise
	 */  
	function isTokenWhitelisted(address _addressToken)
		constant
		internal
		returns(bool)
	{
		return tokensWhiteList[_addressToken].whiteListed;
	}
	/*
	 * Whitelist or Blacklist a token
	 */ 
	function updateTokenWhitelist(address _addressToken, bool _state)
		external
		onlyOwner
	{
		tokensWhiteList[_addressToken].whiteListed = _state;
	}
	// -----------------------------------------------------------------------------

}
