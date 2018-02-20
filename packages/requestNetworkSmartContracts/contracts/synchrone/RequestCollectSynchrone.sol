pragma solidity 0.4.18;

import '../base/math/SafeMath.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestCollectSynchrone
 *
 * @dev RequestCollectSynchrone is a contract managing the fees for ethereum currency contract
 */
contract RequestCollectSynchrone is Pausable {
	using SafeMath for uint256;

	// fees percentage (per 10 000)
	uint256 public feesPer10000 = 0;

	uint256 public maxFees = 0.002 ether;

	// address of the contract that will burn req token (probably through Kyber)
	address public requestBurnerContract;

	/*
	 * @dev Constructor
	 * @param _requestCoreAddress Request Core address
	 */  
	function RequestCollectSynchrone(address _requestBurnerContract) 
		public
	{
		requestBurnerContract = _requestBurnerContract;
	}

	/*
	 * @dev collect Fees
	 * @param _requestId Request id
	 */  
	function collectForREQBurning(uint256 _amount)
		internal
		returns(bool)
	{
		return requestBurnerContract.send(_amount);
	}

	/*
	 * @dev computeFees
	 * @param _requestId Request id
	 * @return 
	 */  
	function collectEstimation(int256 _expectedAmount)
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
	 * @dev setrequestBurnerContract
	 * @param _requestBurnerContract address of the contract that will burn req token (probably through Kyber)
	 * @return 
	 */  
	function setrequestBurnerContract(address _requestBurnerContract) 
		external
		onlyOwner
	{
		requestBurnerContract=_requestBurnerContract;
	}
}
