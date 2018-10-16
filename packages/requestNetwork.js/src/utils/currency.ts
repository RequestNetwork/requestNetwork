import requestArtifacts from 'requestnetworkartifacts';
import RequestBitcoinNodesValidationService from '../servicesContracts/requestBitcoinNodesValidation-service';
import RequestERC20Service from '../servicesContracts/requestERC20-service';
import RequestEthereumService from '../servicesContracts/requestEthereum-service';
import Erc20Service from '../servicesExternal/erc20-service';
import * as Types from '../types';

/**
 * Configuration for each currency. The objective is to regroup every information specific to each currency here.
 *
 * @param {Types.Currency} currency The currency to get the config for
 * @returns {erc20TokenAddresses: string|null, service: any} The configuration
 */
function getCurrencyConfig(currency: Types.Currency)
    : { erc20TokenAddresses: { private?: string, rinkeby?: string, main: string } | null, service: any, decimals: number } {
    const currencyConfig = {
        [Types.Currency.ETH as number]: {
            erc20TokenAddresses: null,
            service: RequestEthereumService.getInstance(),
            decimals: 18,
        },
        [Types.Currency.BTC as number]: {
            erc20TokenAddresses: null,
            service: RequestBitcoinNodesValidationService.getInstance(),
            decimals: 8,
        },
        [Types.Currency.REQ as number]: {
            erc20TokenAddresses: {
                private: '0x345ca3e014aaf5dca488057592ee47305d9b3e10',
                rinkeby: '0x995d6a8c21f24be1dd04e105dd0d83758343e258',
                main: '0x8f8221afbb33998d8584a2b05749ba73c37a938a',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.KNC as number]: {
            erc20TokenAddresses: {
                main: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.DGX as number]: {
            erc20TokenAddresses: {
                main: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 9,
        },
        [Types.Currency.DAI as number]: {
            erc20TokenAddresses: {
                main: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.OMG as number]: {
            erc20TokenAddresses: {
                main: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.KIN as number]: {
            erc20TokenAddresses: {
                main: '0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.ZRX as number]: {
            erc20TokenAddresses: {
                main: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.BAT as number]: {
            erc20TokenAddresses: {
                main: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.BNB as number]: {
            erc20TokenAddresses: {
                main: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
        [Types.Currency.LINK as number]: {
            erc20TokenAddresses: {
                main: '0x514910771af9ca656af840dff83e8264ecf986ca',
            },
            service: RequestERC20Service.getInstance(),
            decimals: 18,
        },
    }[currency];

    if (!currencyConfig) {
        // Create an error message that shows available currencies
        let errorMessage = 'Currency ' + currency.toString() + ' not supported. Supported currencies: ';

        const currencyOptions = Object.keys(Types.Currency)
            .filter((key: any) => !isNaN(Number(Types.Currency[key])))
            .reduce((accumulator: string, currentValue: any) => accumulator += `${Types.Currency[currentValue]}:${currentValue} `, '')
            .concat('\n');

        errorMessage += currencyOptions;

        throw new Error(errorMessage);
    }

    return currencyConfig;
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
            'RequestERC20-kin': Types.Currency.KIN,
            'RequestERC20-zrx': Types.Currency.ZRX,
            'RequestERC20-bat': Types.Currency.BAT,
            'RequestERC20-bnb': Types.Currency.BNB,
            'RequestERC20-link': Types.Currency.LINK,
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

    /**
     * Return the number of decimals for a currency.
     *
     * @param {Types.Currency} currency The currency
     * @returns {number}
     */
    decimalsForCurrency(currency: Types.Currency): number {
        return getCurrencyConfig(currency).decimals;
    },
};
