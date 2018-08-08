import 'cross-fetch/polyfill';

import * as walletAddressValidator from 'wallet-address-validator';
import config from '../config';

const WEB3 = require('web3');

/**
 * The BitcoinService class is the singleton class containing the web3.js interface
 * @ignore
 */
export default class BitcoinService {
    /**
     * Initialized the class BitcoinService
     * @param   _bitcoinNetworkId       the bitcoin network ID (0: main, 3: testnet)
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

    private blockchainInfoUrl: string;

    private bitcoinNetworkId: number;

    /**
     * Private constructor to Instantiates a new BitcoinService
     * @param   networkId       the Bitcoin network ID.
     */
    private constructor(_bitcoinNetworkId ?: number) {
        this.bitcoinNetworkId = _bitcoinNetworkId !== undefined ? _bitcoinNetworkId : config.bitcoin.default;

        switch (this.bitcoinNetworkId) {
            case 0:
                this.blockchainInfoUrl = 'https://blockchain.info';
                break;
            case 3:
                this.blockchainInfoUrl = 'https://testnet.blockchain.info';
                break;
            default:
                throw new Error('Invalid network: ' + this.bitcoinNetworkId);
        }
    }

    /**
     * Check BTC txs info from addresses using blockchain.info public API
     * @param    _address   BTC addresses to check
     * @return   object containing past txs infos
     */
    public async getMultiAddress(_addresses: string[]): Promise<any> {
        const addresses = (_addresses instanceof Array ? _addresses : [_addresses]).join('|');

        try {
            const res = await fetch(`${this.blockchainInfoUrl}/multiaddr?cors=true&active=${addresses}`);
            if (res.status >= 400) {
                throw new Error(`Error ${res.status}. Bad response from server ${this.blockchainInfoUrl}`);
            }
            const response = await res.json();
            return response;
        } catch (err) {
            throw err;
        }
    }

    /**
     * Check if an bitcoin address is valid
     * @param    _address   address to check
     * @return   true if address is valid
     */
    public isBitcoinAddress(_address: string): boolean {
        if (!_address) return false;

        let networkType: string = 'both'; // both = prod && testnet
        switch (this.bitcoinNetworkId) {
            case 0:
                networkType = 'prod';
                break;
            case 3:
                networkType = 'testnet';
                break;
            default:
                throw new Error('Invalid network: ' + this.bitcoinNetworkId);
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
        return _array.every((addr) => this.isBitcoinAddress(addr));
    }

}
