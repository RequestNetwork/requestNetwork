pragma solidity 0.4.18;

import '../base/math/SafeMath.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestCollectInterface
 *
 * @dev RequestCollectInterface is a contract managing the fees for currency contracts
 */
contract RequestCollectInterface is Pausable {
	using SafeMath for uint256;

    uint256 public rateFeesNumerator;
    uint256 public rateFeesDenominator;
    uint256 public maxFees;

	// address of the contract that will burn req token (through Kyber)
	address public requestBurnerContract;

    /*
     *  Events 
     */
    event UpdateRateFees(uint256 rateFeesNumerator, uint256 rateFeesDenominator);
    event UpdateMaxFees(uint256 maxFees);

	/*
	 * @dev Constructor
	 * @param _requestBurnerContract Address of the contract where to send the ethers. 
	 * This burner contract will have a function that can be called by anyone and will exchange ethers to req via Kyber and burn the REQ
	 */  
	function RequestCollectInterface(address _requestBurnerContract) 
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
	function collectEstimation(int256 _expectedAmount)
		public
		view
		returns(uint256)
	{
		if(_expectedAmount<0) return 0;

		uint256 computedCollect = uint256(_expectedAmount).mul(rateFeesNumerator);

		if(rateFeesDenominator != 0) {
			computedCollect = computedCollect.div(rateFeesDenominator);
		}

		return computedCollect < maxFees ? computedCollect : maxFees;
	}

	/*
	 * @dev set the fees rate
	 * @param _rateFeesNumerator 		numerator rate
	 * @param _rateFeesDenominator 		denominator rate
	 * @return 
	 */  
	function setRateFees(uint256 _rateFeesNumerator, uint256 _rateFeesDenominator)
		external
		onlyOwner
	{
		rateFeesNumerator = _rateFeesNumerator;
		UpdateRateFees(_rateFeesNumerator, _rateFeesDenominator);
	}

	/*
	 * @dev set the maximum fees in wei
	 * @param _newMax new max
	 * @return 
	 */  
	function setMaxCollectable(uint256 _newMaxFees) 
		external
		onlyOwner
	{
		maxFees = _newMaxFees;
		UpdateMaxFees(_newMaxFees);
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

}
