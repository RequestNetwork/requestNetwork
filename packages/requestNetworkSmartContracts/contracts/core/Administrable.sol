pragma solidity 0.4.18;

import '../base/lifecycle/Pausable.sol';
import '../collect/RequestBurnManagerInterface.sol';

/**
 * @title Administrable
 * @dev Administrable is a base contract to manage the list of trustedContract and the list of TrustedExtension
 */
contract Administrable is Pausable {

	// mapping of address of trusted contract
	mapping(address => uint8) public trustedCurrencyContracts;

	// mapping of address of trusted extensions
	mapping(address => uint8) public trustedExtensions;

	// contract managing the fees
	RequestBurnManagerInterface public trustedNewBurnManager;

	// Events of the system
	event NewTrustedContract(address newContract);
	event RemoveTrustedContract(address oldContract);
	event NewTrustedExtension(address newExtension);
	event RemoveTrustedExtension(address oldExtension);
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
	 * @dev add a trusted extension 
	 *
	 * @param _newExtension The address of the extension
	 */
	function adminAddTrustedExtension(address _newExtension)
		external
		onlyOwner
	{
		trustedExtensions[_newExtension] = 1;
		NewTrustedExtension(_newExtension);
	}

	/**
	 * @dev remove a trusted extension 
	 *
	 * @param _oldExtension The address of the extension
	 */
	function adminRemoveExtension(address _oldExtension)
		external
		onlyOwner
	{
		require(trustedExtensions[_oldExtension] != 0);
		trustedExtensions[_oldExtension] = 0;
		RemoveTrustedExtension(_oldExtension);
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
	 * @param _expectedAmount Expected amount of the request
	 * @param _currencyContract The address of the currencyContract
	 * @param _extension The address of the extension
	 * @return The status of the currencyContract. If trusted 1, otherwise 0
	 */
	function getCollectEstimation(int256 _expectedAmount, address _currencyContract, address _extension)
		view
		external
		returns(uint256) 
	{
		return trustedNewBurnManager.collectEstimation(_expectedAmount, _currencyContract, _extension);
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
	 * @dev get the status of a trusted extension 
	 *
	 * @param _extension The address of the extension
	 * @return The status of the extension. If trusted 1, otherwise 0
	 */
	function getStatusExtension(address _extension) 
		view
		external
		returns(uint8) 
	{
		return trustedExtensions[_extension];
	}

	/**
	 * @dev Modifier: check if a currencyContract is trusted
	 * @dev Revert if currencyContract status is not 1
	 *
	 * @param _contractAddress The address of the currencyContract
	 */
	modifier isTrustedContract(address _contractAddress) {
		require(trustedCurrencyContracts[_contractAddress] == 1);
		_;
	}

	/**
	 * @dev Modifier: check if the extension is trusted
	 * @dev Revert if extension status is not 1
	 *
	 * @param _extension The address of the extension
	 */
	modifier isTrustedExtension(address _extension) {
		require(_extension==0 || trustedExtensions[_extension]==1);
		_;
	}
}