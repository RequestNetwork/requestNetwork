pragma solidity 0.4.18;

import '../base/lifecycle/Pausable.sol';
import '../collect/RequestBurnManagerInterface.sol';

/**
 * @title Administrable
 * @dev Administrable is a base contract to manage the list of trustedContract
 */
contract Administrable is Pausable {

	// mapping of address of trusted contract
	mapping(address => uint8) public trustedCurrencyContracts;

	// contract managing the fees
	RequestBurnManagerInterface public trustedNewBurnManager;

	// Events of the system
	event NewTrustedContract(address newContract);
	event RemoveTrustedContract(address oldContract);
	event NewBurnManager(address newFeesManager);

	/**
	 * @dev add a trusted currencyContract 
	 *
	 * @param _newContractAddress The address of the currencyContract
	 */
	function adminAddTrustedCurrencyContract(address _newContractAddress)
		external
		onlyOwner
	{
		trustedCurrencyContracts[_newContractAddress] = 1;
		NewTrustedContract(_newContractAddress);
	}

	/**
	 * @dev remove a trusted currencyContract 
	 *
	 * @param _oldTrustedContractAddress The address of the currencyContract
	 */
	function adminRemoveTrustedCurrencyContract(address _oldTrustedContractAddress)
		external
		onlyOwner
	{
		require(trustedCurrencyContracts[_oldTrustedContractAddress] != 0);
		trustedCurrencyContracts[_oldTrustedContractAddress] = 0;
		RemoveTrustedContract(_oldTrustedContractAddress);
	}

	/**
	 * @dev update the fees manager contract
	 *
	 * @param _newBurnManager The address of the new fees manager
	 */
	function setBurnManager(address _newBurnManager)
		external
		onlyOwner
	{
		trustedNewBurnManager = RequestBurnManagerInterface(_newBurnManager);
		NewBurnManager(_newBurnManager);
	}

	/**
	 * @dev get the status of a trusted currencyContract 
	 *
	 * @param _contractAddress The address of the currencyContract
	 * @return The status of the currencyContract. If trusted 1, otherwise 0
	 */
	function getStatusContract(address _contractAddress)
		view
		external
		returns(uint8) 
	{
		return trustedCurrencyContracts[_contractAddress];
	}

	/**
	 * @dev check if a currencyContract is trusted
	 *
	 * @param _contractAddress The address of the currencyContract
	 * @return bool true if contract is trusted
	 */
	function isTrustedContract(address _contractAddress)
		public
		view
		returns(bool)
	{
		return trustedCurrencyContracts[_contractAddress] == 1;
	}
}