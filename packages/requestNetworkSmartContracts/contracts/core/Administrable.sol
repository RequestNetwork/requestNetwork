pragma solidity ^0.4.18;

import "../base/lifecycle/Pausable.sol";


/**
 * @title Administrable
 * @notice Base contract for the administration of Core. Handles whitelisting of currency contracts
 */
contract Administrable is Pausable {

    // mapping of address of trusted contract
    mapping(address => uint8) public trustedCurrencyContracts;

    // Events of the system
    event NewTrustedContract(address newContract);
    event RemoveTrustedContract(address oldContract);

    /**
     * @notice Adds a trusted currencyContract.
     *
     * @param _newContractAddress The address of the currencyContract
     */
    function adminAddTrustedCurrencyContract(address _newContractAddress)
        external
        onlyOwner
    {
        trustedCurrencyContracts[_newContractAddress] = 1; //Using int instead of boolean in case we need several states in the future.
        emit NewTrustedContract(_newContractAddress);
    }

    /**
     * @notice Removes a trusted currencyContract.
     *
     * @param _oldTrustedContractAddress The address of the currencyContract
     */
    function adminRemoveTrustedCurrencyContract(address _oldTrustedContractAddress)
        external
        onlyOwner
    {
        require(trustedCurrencyContracts[_oldTrustedContractAddress] != 0, "_oldTrustedContractAddress should not be 0");
        trustedCurrencyContracts[_oldTrustedContractAddress] = 0;
        emit RemoveTrustedContract(_oldTrustedContractAddress);
    }

    /**
     * @notice Gets the status of a trusted currencyContract .
     * @dev Not used today, useful if we have several states in the future.
     *
     * @param _contractAddress The address of the currencyContract
     * @return The status of the currencyContract. If trusted 1, otherwise 0
     */
    function getStatusContract(address _contractAddress)
        external
        view
        returns(uint8) 
    {
        return trustedCurrencyContracts[_contractAddress];
    }

    /**
     * @notice Checks if a currencyContract is trusted.
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
