import * as walletAddressValidator from 'wallet-address-validator';
const WEB3 = require('web3');

/**
 * The BitcoinService class is the singleton class containing the web3.js interface
 */
export default class BitcoinService {
    /**
     * Initialized the class BitcoinService
     * @param   _bitcoinNetworkId       the bitcoin network ID (1: main, 3: testnet)
     */
    public static init(_bitcoinNetworkId ?: number) {
        this._instance = new this(_bitcoinNetworkId);
    }
    /**
     * get the instance of BitcoinService
     * @return  The instance of the BitcoinService class.
     */
    public static getInstance() {
        return this._instance;
    }
    /**
     * return BN of web3
     * @return Web3.utils.BN
     */
    public static BN() {
        return WEB3.utils.BN;
    }

    private static _instance: BitcoinService;

    private bitcoinNetworkId: number;

    /**
     * Private constructor to Instantiates a new BitcoinService
     * @param   provider        The Web3.js Provider instance you would like the requestNetwork.js
     *                          library to use for interacting with the Ethereum network.
     * @param   networkId       the Ethereum network ID.
     */
    private constructor(_bitcoinNetworkId ?: number) {
        this.bitcoinNetworkId = _bitcoinNetworkId || -1;
    }

    public async getMultiAddress(_addresses: string[]): Promise<any> {
        try {
            const hash = WEB3.utils.sha3(JSON.stringify(_addresses));
            const obj = require('./data/bitcoinSimulation/' + hash).default;
            return Promise.resolve(obj);
        } catch (ex) {
            return Promise.resolve({txs:[]});
        }
    }

    /**
     * Check if an bitcoin address is valid
     * @param    _address   address to check
     * @return   true if address is valid
     */
    public isBitcoinAddress(_address: string): boolean {
        if (!_address) return false;

        let networkType: string = 'both';
        switch (this.bitcoinNetworkId) {
            case 1:
                networkType = 'prod';
                break;
            case 3:
                networkType = 'testnet';
                break;
        }
        return walletAddressValidator.validate(_address, 'bitcoin', networkType);
    }

    /**
     * Check if an array contains only bitcoin addresses valid
     * @param    _array   array to check
     * @return   true if array contains only bitcoin addresses valid
     */
    public isArrayOfBitcoinAddresses(_array: string[]): boolean {
        if (!_array) return false;
        return _array.filter((addr) => !this.isBitcoinAddress(addr)).length === 0;
    }

}
