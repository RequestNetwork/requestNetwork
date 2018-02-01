pragma solidity 0.4.18;

interface RequestBurnManagerInterface {
	function collectForReqBurning(int256 _expectedAmount, address _currencyContract, address _extension) payable external returns(bool);
	function collectEstimation(int256 _expectedAmount, address _currencyContract, address _extension) public view returns(uint256);
}
