pragma solidity 0.4.18;

import './RequestBurnManagerInterface.sol';
import '../base/math/SafeMath.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestBurnManagerSimple
 *
 * @dev RequestBurnManagerSimple is a contract managing the fees in the most simple way (percentage of the expected amount)
 */
contract RequestBurnManagerSimple is RequestBurnManagerInterface, Pausable {
	using SafeMath for uint256;

	// fees percentage (per 10 000)
	uint256 public feesPer10000;

	uint256 public maxFees = 0.002 ether;

	// address of the contract that will burn req token (probably through Kyber)
	address public reqBurnerContract;

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 */  
	function RequestBurnManagerSimple(address _reqBurnerContract) 
		public
	{
		reqBurnerContract = _reqBurnerContract;
	}

	/*
	 * @dev collect Fees
	 * @param _requestId Request id
	 */  
	function collectForReqBurning(int256 _expectedAmount, address _currencyContract, address _extension)
		external
		payable
		returns(bool)
	{
		if(collectEstimation(_expectedAmount,_currencyContract,_extension)==msg.value) {
			return reqBurnerContract.send(msg.value);
		} else {
			return false;
		}
	}

	/*
	 * @dev computeFees
	 * @param _requestId Request id
	 * @return 
	 */  
	function collectEstimation(int256 _expectedAmount, address _currencyContract, address _extension)
		public
		view
		returns(uint256)
	{
		if(_expectedAmount<0) return 0;
		uint256 computedCollect = uint256(_expectedAmount).mul(feesPer10000).div(10000);
		return computedCollect < maxFees ? computedCollect : maxFees;
	}


	/*
	 * @dev computeFees
	 * @param _newRate new rate
	 * @return 
	 */  
	function setFeesPerTenThousand(uint256 _newRate) 
		external
		onlyOwner
	{
		feesPer10000=_newRate;
	}

	/*
	 * @dev setMaxCollectable
	 * @param _newMax new max
	 * @return 
	 */  
	function setMaxCollectable(uint256 _newMax) 
		external
		onlyOwner
	{
		maxFees=_newMax;
	}


	/*
	 * @dev setReqBurnerContract
	 * @param _reqBurnerContract address of the contract that will burn req token (probably through Kyber)
	 * @return 
	 */  
	function setReqBurnerContract(address _reqBurnerContract) 
		external
		onlyOwner
	{
		reqBurnerContract=_reqBurnerContract;
	}
}
