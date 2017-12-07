import BigNumber from 'bignumber.js';
import config from '../config';
import * as Types from '../types';

var Web3 = require('web3');
// const Web3 = require('web3');

// declare var require: (moduleId: string) => any;
const ethABI = require('../lib/ethereumjs-abi-perso.js');

export class Web3Single {
    private static _instance: Web3Single;

    public networkName: string;
    public web3: any;

    private constructor(web3Provider ? : any, networkId ? : number) {
        this.web3 = new Web3(web3Provider ||  new Web3.providers.HttpProvider(config.ethereum.nodeUrlDefault.private));
        this.networkName = Web3Single.getNetworkName(networkId);
    }

    public static init(web3Provider ? : any, networkId ? : number) 
    {   
        this._instance = new this(web3Provider,networkId);
    }

    public static getInstance() 
    {
        return this._instance;
    }

    public async broadcastMethod(_method: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options?:any) {

        if(!_options) _options = {};

        if (!_options.from) {
            try {
                let accounts = await this.web3.eth.getAccounts();
                _options.from = accounts[0];
            } catch (e) {
                return _callbackTransactionError(e);
            }
        }
        let forcedGas = _options.gas;
        _options.value = _options.value?_options.value:0;
        _options.gas = forcedGas?forcedGas:90000000;
        _options.gasPrice = _options.gasPrice?_options.gasPrice:this.web3.utils.toWei(config.ethereum.gasPriceDefault, config.ethereum.gasPriceDefaultUnit);

        _method.estimateGas(_options, (err: any, estimateGas: number) => {
            if (err) return _callbackTransactionError(err);

            _options.gas = forcedGas?forcedGas:Math.floor(estimateGas * 2);
            _method.send(_options)
                .on('transactionHash', _callbackTransactionHash)
                .on('receipt', _callbackTransactionReceipt)
                .on('confirmation', _callbackTransactionConfirmation)
                .on('error', _callbackTransactionError);
        });
    }

    // public callMethod(_method:any) : Promise<any>
    // {
    //     return new Promise((resolve, reject) => {
    //         _method.call(function(err:Error,data:any) {
    //             if(err) return reject(err)
    //                resolve(data);
    //         })
    //     });
    // }

    public async getDefaultAccountAsync(): Promise < any > {
        return new Promise((resolve, reject) => {
            this.web3.eth.getAccounts((err, accs) => {
                if (err) return reject(err);
                if (accs.length === 0) return reject(Error('No accounts found'));
                return resolve(accs[0]);
            });
        });
    }

    public getDefaultAccount(callback:Types.CallbackErrorData): void {
            this.web3.eth.getAccounts((err, accs) => {
                if (err) return callback(err,null);
                if (accs.length === 0) return callback(Error('No accounts found'),null);
                return callback(null, accs[0]);
            });
    }

    public toSolidityBytes32(type: string, value: any): any {
        return this.web3.utils.bytesToHex(ethABI.toSolidityBytes32(type, value));
    }

    public arrayToBytes32(array: any[], length: number): any[] {
        array = array?array:[];
        let ret: any[] = [];
        array.forEach(function(o: any) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('address', o)));
        }.bind(this));

        for (let i = array.length; i < length; i++) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('bytes32', 0)));
        }
        return ret;
    }

    public isAddressNoChecksum(address: string): boolean {
        if(!address) return false;
        return address && this.web3.utils.isAddress(address.toLowerCase());
    }

    public areSameAddressesNoChecksum(address1: string,address2: string): boolean {
        if(!address1 || !address2) return false;
        return address1 && address2 && address1.toLowerCase()==address2.toLowerCase();
    }

    public isHexStrictBytes32(hex: string): boolean {
        return this.web3.utils.isHexStrict(hex) && hex.length == 66; // '0x' + 32 bytes * 2 characters = 66
    }

    public decodeLog(abi: Array < any > , event: string, log: any): any {
        let eventInput: any;
        abi.some((o: any) => {
            if (o.name == event) {
                eventInput = o.inputs;
                return true;
            }
            return false;
        });
        return this.web3.eth.abi.decodeLog(eventInput, log.raw.data, log.raw.topics[0]);
    }
    
    public setUpOptions(_options:any) : any
    {
        if(!_options) _options = {};
        if(!_options.numberOfConfirmation) _options.numberOfConfirmation = 0;
        if(_options.gasPrice) _options.gasPrice = new BigNumber(_options.gasPrice);
        if(_options.gas) _options.gas = new BigNumber(_options.gas);
        return _options;
    }

    public static getNetworkName(networkId:number) : string
    {
        switch (networkId) {
          case 1:  return 'main';
          case 2:  return 'morden';
          case 3:  return 'ropsten';
          case 4:  return 'rinkeby';
          case 42: return 'kovan';
          default:   return 'private';
        }
    }

    public async getTransactionReceipt(_hash:string) : Promise<any>
    {
        return this.web3.eth.getTransactionReceipt(_hash);
    }
}