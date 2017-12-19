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

    protected blockTimestamp: any = {};

    private constructor(web3Provider ?: any, networkId ?: number) {
        this.web3 = new Web3(web3Provider ||  new Web3.providers.HttpProvider(config.ethereum.nodeUrlDefault[config.ethereum.default]));
        this.networkName = networkId?Web3Single.getNetworkName(networkId):config.ethereum.default;
    }

    public static init(web3Provider ?: any, networkId ?: number)
    {
        this._instance = new this(web3Provider,networkId);
    }

    public static getInstance()
    {
        return this._instance;
    }
    public static BN()
    {
        return Web3.utils.BN;
    }
    public async broadcastMethod(_method: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options?: any) {

        let options = Object.assign({}, _options || {}); ;
        options.numberOfConfirmation = undefined;

        if (!options.from) {
            try {
                let accounts = await this.web3.eth.getAccounts();
                options.from = accounts[0];
            } catch (e) {
                return _callbackTransactionError(e);
            }
        }
        let forcedGas = options.gas;
        options.value = options.value?options.value:0;
        options.gas = forcedGas?forcedGas:90000000;
        options.gasPrice = options.gasPrice?options.gasPrice:this.web3.utils.toWei(config.ethereum.gasPriceDefault, config.ethereum.gasPriceDefaultUnit);

        _method.estimateGas(options, (err: any, estimateGas: number) => {
            if (err) return _callbackTransactionError(err)
            options.gas = forcedGas?forcedGas:Math.floor(estimateGas * 1.05);
            _method.call(options, (errCall,resultCall) => {
                if(errCall) {
                    //let's try with more gas
                    options.gas = forcedGas?forcedGas:Math.floor(estimateGas * 2);
                    _method.call(options, (errCall,resultCall) => {
                        if(errCall) return _callbackTransactionError(errCall);

                        _method.send(options)
                            .on('transactionHash', _callbackTransactionHash)
                            .on('receipt', _callbackTransactionReceipt)
                            .on('confirmation', _callbackTransactionConfirmation)
                            .on('error', _callbackTransactionError);
                    });
                }

                _method.send(options)
                    .on('transactionHash', _callbackTransactionHash)
                    .on('receipt', _callbackTransactionReceipt)
                    .on('confirmation', _callbackTransactionConfirmation)
                    .on('error', _callbackTransactionError);
            });
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

    public async getDefaultAccount(): Promise < any > {
        return new Promise((resolve, reject) => {
            this.web3.eth.getAccounts((err, accs) => {
                if (err) return reject(err);
                if (accs.length === 0) return reject(Error('No accounts found'));
                return resolve(accs[0]);
            });
        });
    }

    public getDefaultAccountCallback(callback: Types.CallbackErrorData): void {
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

    public decodeTransactionLog(abi: Array < any > , event: string, log: any): any {
        let eventInput: any;
        let signature: string;
        abi.some((o: any) => {
            if (o.name == event) {
                eventInput = o.inputs;
                signature = o.signature;
                return true;
            }
            return false;
        });

        if(log.topics[0] != signature)
        {
            return null;
        }

        return this.web3.eth.abi.decodeLog(eventInput, log.data, log.topics.slice(1));
    }

    public decodeEvent(abi: Array < any > , eventName: string, event: any): any {
        let eventInput: any;
        abi.some((o: any) => {
            if (o.name == eventName) {
                eventInput = o.inputs;
                return true;
            }
            return false;
        });

        return this.web3.eth.abi.decodeLog(eventInput, event.raw.data, event.raw.topics.slice(1));
    }

    public setUpOptions(_options: any): any
    {
        if(!_options) _options = {};
        if(!_options.numberOfConfirmation) _options.numberOfConfirmation = 0;
        if(_options.gasPrice) _options.gasPrice = new Web3.utils.BN(_options.gasPrice);
        if(_options.gas) _options.gas = new Web3.utils.BN(_options.gas);
        return _options;
    }

    public static getNetworkName(networkId: number): string
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

    public async getTransactionReceipt(_hash: string): Promise<any>
    {
        return this.web3.eth.getTransactionReceipt(_hash);
    }

    public async getTransaction(_hash: string): Promise<any>
    {
        return this.web3.eth.getTransaction(_hash);
    }


    public async getBlockTimestamp(_blockNumber: number): Promise<any>
    {
        return new Promise(async (resolve, reject) => {
            try
            {
                if(!this.blockTimestamp[_blockNumber]) {
                    let block = await this.web3.eth.getBlock(_blockNumber);
                    if(!block) throw Error('block \''+_blockNumber+'\' not found');
                    this.blockTimestamp[_blockNumber] = block.timestamp;
                }
                return resolve(this.blockTimestamp[_blockNumber])
            }
            catch(e)
            {
                console.warn(e);
                return resolve(null);
            }
        });
    }


}
