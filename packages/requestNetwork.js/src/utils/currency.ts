import requestArtifacts from 'requestnetworkartifacts';
import RequestBitcoinNodesValidationService from '../servicesContracts/requestBitcoinNodesValidation-service';
import RequestERC20Service from '../servicesContracts/requestERC20-service';
import RequestEthereumService from '../servicesContracts/requestEthereum-service';
import Erc20Service from '../servicesExternal/erc20-service';
import * as Types from '../types';

// Service containing methods for interacting with the Ethereum currency contract
let requestEthereumService: RequestEthereumService;

// Service containing methods for interacting with the ERC20 currency contract
let requestERC20Service: RequestERC20Service;

// Service containing methods for interacting with the bitcoin currency contract
let requestBitcoinNodesValidationService: RequestBitcoinNodesValidationService;

/**
 * Configuration for each currency. The objective is to regroup every information specific to each currency here.
 * It is currently a function to allow instanciation of the services and make a temporary singleton services hack.
 *
 * @param {Types.Currency} currency The currency to get the config for
 * @returns {erc20TokenAddresses: string|null, service: any} The configuration
 */
function getCurrencyConfig(currency: Types.Currency)
    : {erc20TokenAddresses: {private?: string, rinkeby?: string, main: string }|null, service: any} {
    // Hack until services are singletons
    if (!requestEthereumService) {
        requestEthereumService = RequestEthereumService.getInstance();
        requestERC20Service = RequestERC20Service.getInstance();
        requestBitcoinNodesValidationService = RequestBitcoinNodesValidationService.getInstance();
    }

    return {
        [Types.Currency.ETH as number]: {
            erc20TokenAddresses: null,
            service: requestEthereumService,
        },
        [Types.Currency.BTC as number]: {
            erc20TokenAddresses: null,
            service: requestBitcoinNodesValidationService,
        },
        [Types.Currency.REQ as number]: {
            erc20TokenAddresses: {
                private: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                rinkeby: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
                main: '0x8f8221afbb33998d8584a2b05749ba73c37a938a',
            },
            service: requestERC20Service,
        },
        [Types.Currency.KNC as number]: {
            erc20TokenAddresses: {
                main: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
            },
            service: requestERC20Service,
        },
        [Types.Currency.DGX as number]: {
            erc20TokenAddresses: {
                main: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
            },
            service: requestERC20Service,
        },
        [Types.Currency.DAI as number]: {
            erc20TokenAddresses: {
                main: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
            },
            service: requestERC20Service,
        },
        [Types.Currency.OMG as number]: {
            erc20TokenAddresses: {
                main: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
            },
            service: requestERC20Service,
        },
    }[currency];
}

// Set of tools to handle currencies. Designed to be the only place regrouping the currency tools and util functions.
export default {
    /**
     * Get the currency from the address of a currency contract.
     * Useful to know which currency was used to create a Request.
     *
     * @param {string} address Address of the currency contract
     * @returns {Types.Currency} Currency
     */
    currencyFromContractAddress(address: string): Types.Currency {
        // TODO: Consider merging with the currency config object
        const currencyMapping: { [index: string]: Types.Currency } = {
            'RequestEthereum': Types.Currency.ETH,
            'RequestBitcoinNodesValidation': Types.Currency.BTC,
            'RequestERC20-req': Types.Currency.REQ,

            // Test token on local
            'RequestERC20-test': Types.Currency.REQ,

            // Test token on rinkeby
            'RequestERC20-centralbank': Types.Currency.REQ,

            'RequestERC20-knc': Types.Currency.KNC,
            'RequestERC20-dgx': Types.Currency.DGX,
            'RequestERC20-dai': Types.Currency.DAI,
            'RequestERC20-omg': Types.Currency.OMG,
        };

        const currencyContractName = requestArtifacts.getContractNameForAddress(address.toLowerCase());
        return currencyMapping[currencyContractName];
    },

    /**
     * Get ERC20 token contract address of a currency
     *
     * @param {Types.Currency} currency The currency
     * @param {String} networkName The network name (private, rinkeby, main)
     * @returns {string} The address of the ERC20 token contract
     */
    erc20TokenAddress(currency: Types.Currency, networkName: string): string {
        const currencyContractAddresses = getCurrencyConfig(currency).erc20TokenAddresses;
        if (!currencyContractAddresses) {
            throw new Error(`${currency} is not an ERC20`);
        }

        const currencyContractAddress = (currencyContractAddresses as any)[networkName];
        if (!currencyContractAddress) {
            throw new Error(`${currency} is not available on ${networkName}`);
        }

        const erc20Token = new Erc20Service(currencyContractAddress);
        return erc20Token.getAddress();
    },

    /**
     * Get the Request service for a currency
     *
     * @param {Types.Currency} currency The currency
     * @returns {*} The service
     */
    serviceForCurrency(currency: Types.Currency): any {
        return getCurrencyConfig(currency).service;
    },

    /**
     * Is the currency an ERC20?
     *
     * @param {Types.Currency} currency The currency
     * @returns {boolean}
     */
    isErc20(currency: Types.Currency): boolean {
        return !!getCurrencyConfig(currency).erc20TokenAddresses;
    },
};
