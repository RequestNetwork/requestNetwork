pragma solidity ^0.4.18;

import '../base/math/SafeMath.sol';
import '../base/lifecycle/Pausable.sol';

/**
 * @title RequestEthereumCollect
 *
 * @dev RequestEthereumCollect is a contract managing the fees for ethereum currency contract
 */
contract RequestEthereumCollect is Pausable {
	using SafeMath for uint256;

	// fees percentage (per 10 000)
	uint256 public feesPer10000;

	// maximum fees in wei
	uint256 public maxFees;

	// address of the contract that will burn req token (probably through Kyber)
	address public requestBurnerContract;

	/*
	 * @dev Constructor
	 * @param _requestBurnerContract Address of the contract where to send the ethers. 
	 * This burner contract will have a function that can be called by anyone and will exchange ethers to req via Kyber and burn the REQ
	 */  
	function RequestEthereumCollect(address _requestBurnerContract) 
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
	 * @return the expected amount of fees in wei
	 */  
	function collectEstimation(int256 _expectedAmount)
		public
		view
		returns(uint256)
	{
		// Force potential negative number to 0
		if (_expectedAmount <= 0) {
			return 0;
		}
		uint256 computedCollect = uint256(_expectedAmount).mul(feesPer10000).div(10000);
		return computedCollect < maxFees ? computedCollect : maxFees;
	}

	/*
	 * @dev set the fees rate (per 10 000)
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
	 * @dev set the maximum fees in wei
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
