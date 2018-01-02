import config from '../config';
import * as Types from '../types';

var Web3 = require('web3');

// ethereumjs-abi.js modified to support solidity packing of bytes32 array
const ethABI = require('../lib/ethereumjs-abi-perso.js');

/**
 * The Web3Single class is the singleton class containing the web3.js interface
 */
export class Web3Single {
    private static _instance: Web3Single;

    public networkName: string;
    public web3: any;

    /**
     * cache of the blocks timestamp
     */
    protected blockTimestamp: any = {};

    /**
     * Private constructor to Instantiates a new Web3Single 
     * @param   provider        The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with
     *                          the Ethereum network.
     * @param   networkId       the Ethereum network ID.
     */
    private constructor(web3Provider ? : any, networkId ? : number) {
        this.web3 = new Web3(web3Provider ||  new Web3.providers.HttpProvider(config.ethereum.nodeUrlDefault[config.ethereum.default]));
        this.networkName = networkId?Web3Single.getNetworkName(networkId):config.ethereum.default;
    }

    /**
     * Initialized the class Web3Single
     * @param   provider        The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with
     *                          the Ethereum network.
     * @param   networkId       the Ethereum network ID.
     */
    public static init(web3Provider ? : any, networkId ? : number) 
    {   
        this._instance = new this(web3Provider,networkId);
    }
    /**
     * get the instance of Web3Single
     * @return  The instance of the Web3Single class.
     */
    public static getInstance() 
    {
        return this._instance;
    }
    /**
     * return BN of web3
     * @return Web3.utils.BN
     */
    public static BN() 
    {
        return Web3.utils.BN;
    }

    /**
     * Send a web3 method
     * @param    _method                             the method to send
     * @param    _callbackTransactionHash            callback when the transaction is submitted
     * @param    _callbackTransactionReceipt         callback when the transacton is mined (0 confirmation block)
     * @param    _callbackTransactionConfirmation    callback when a new confirmation block is mined (up to 20)
     * @param    _callbackTransactionError           callback when an error occured
     * @param    _options                            options for the method (gasPrice, gas, value, from)
     */
    public async broadcastMethod(_method: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options?:any) {

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

        // get the gas estimation
        _method.estimateGas(options, (err: any, estimateGas: number) => {
            if (err) return _callbackTransactionError(err)
            // it is safer to add 5% of gas
            options.gas = forcedGas?forcedGas:Math.floor(estimateGas * 1.05);
            // try the method offline
            _method.call(options, (errCall,resultCall) => {
                if(errCall) {
                    //let's try with more gas (*2)
                    options.gas = forcedGas?forcedGas:Math.floor(estimateGas * 2);
                    // try the method offline
                    _method.call(options, (errCall,resultCall) => {
                        if(errCall) return _callbackTransactionError(errCall);

                        // everything looks fine, let's send the transation
                        _method.send(options)
                            .on('transactionHash', _callbackTransactionHash)
                            .on('receipt', _callbackTransactionReceipt)
                            .on('confirmation', _callbackTransactionConfirmation)
                            .on('error', _callbackTransactionError);
                    });
                }
                // everything looks fine, let's send the transation
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

    /**
     * Get the default account (account[0] of the wallet)
     * @return    Promise of the default account
     */
    public async getDefaultAccount(): Promise < any > {
        return new Promise((resolve, reject) => {
            this.web3.eth.getAccounts((err, accs) => {
                if (err) return reject(err);
                if (accs.length === 0) return reject(Error('No accounts found'));
                return resolve(accs[0]);
            });
        });
    }

    /**
     * Get the default account (account[0] of the wallet) With a callback
     * @param    _callback    callback with the default account
     */
    public getDefaultAccountCallback(_callback:Types.CallbackErrorData): void {
            this.web3.eth.getAccounts((err, accs) => {
                if (err) return _callback(err,null);
                if (accs.length === 0) return _callback(Error('No accounts found'),null);
                return _callback(null, accs[0]);
            });
    }

    /**
     * Convert a value in solidity bytes32 string
     * @param    _type    type of the value to convert (e.g: address, uint, int etc...)
     * @param    _value   value to convert
     * @return   solidity like bytes32 string
     */
    public toSolidityBytes32(_type: string, _value: any): any {
        return this.web3.utils.bytesToHex(ethABI.toSolidityBytes32(_type, _value));
    }

    /**
     * Convert an array to an array in solidity bytes32 string
     * TODO : only support addresses so far.
     * @param    _array   array to convert
     * @param    _length  length of the final array
     * @return   array of solidity like bytes32 string
     */
    public arrayToBytes32(_array: any[], _length: number): any[] {
        _array = _array?_array:[];
        let ret: any[] = [];
        _array.forEach(function(o: any) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('address', o)));
        }.bind(this));
        // fill the empty case with zeros
        for (let i = _array.length; i < _length; i++) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('bytes32', 0)));
        }
        return ret;
    }


    /**
     * Check if an address is valid (ignoring case)
     * @param    _address   address to check
     * @return   true if address is valid
     */
    public isAddressNoChecksum(_address: string): boolean {
        if(!_address) return false;
        return _address && this.web3.utils.isAddress(_address.toLowerCase());
    }

    /**
     * Check if two addresses are equals (ignoring case)
     * @param    _address1   address to check
     * @param    _address2   address to check
     * @return   true if _address1 is the same as _address2
     */
    public areSameAddressesNoChecksum(_address1: string,_address2: string): boolean {
        if(!_address1 || !_address2) return false;
        return _address1 && _address2 && _address1.toLowerCase()==_address2.toLowerCase();
    }

    /**
     * Check if a string is a bytes32 
     * @param    _hex   string to check
     * @return   true if _hex is a bytes32
     */
    public isHexStrictBytes32(_hex: string): boolean {
        return this.web3.utils.isHexStrict(_hex) && _hex.length == 66; // '0x' + 32 bytes * 2 characters = 66
    }

    /**
     * Decode transaction log parameters
     * @param    _abi      abi of the contract
     * @param    _event    event name
     * @param    _log      log to decode
     * @return   object with the log decoded
     */
    public decodeTransactionLog(_abi: Array < any > , _event: string, _log: any): any {
        let eventInput: any;
        let signature: string;
        _abi.some((o: any) => {
            if (o.name == _event) {
                eventInput = o.inputs;
                signature = o.signature;
                return true;
            }
            return false;
        });
        
        if(_log.topics[0] != signature)
        {
            return null;
        }

        return this.web3.eth.abi.decodeLog(eventInput, _log.data, _log.topics.slice(1));
    }

    /**
     * Decode transaction event parameters
     * @param    _abi          abi of the contract
     * @param    _eventName    event name
     * @param    _event        event to decode
     * @return   object with the event decoded
     */
    public decodeEvent(_abi: Array < any > , _eventName: string, _event: any): any {
        let eventInput: any;
        _abi.some((o: any) => {
            if (o.name == _eventName) {
                eventInput = o.inputs;
                return true;
            }
            return false;
        });

        return this.web3.eth.abi.decodeLog(eventInput, _event.raw.data, _event.raw.topics.slice(1));
    }
    
    /**
     * Create or Clean options for a method
     * @param    _options    options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return   options cleaned
     */    
    public setUpOptions(_options:any) : any
    {
        if(!_options) _options = {};
        if(!_options.numberOfConfirmation) _options.numberOfConfirmation = 0;
        if(_options.gasPrice) _options.gasPrice = new Web3.utils.BN(_options.gasPrice);
        if(_options.gas) _options.gas = new Web3.utils.BN(_options.gas);
        return _options;
    }
    /**
     * get Network name from network Id
     * @param    _networkId    network id
     * @return   network name
     */ 
    public static getNetworkName(_networkId:number) : string
    {
        switch (_networkId) {
          case 1:  return 'main';
          case 2:  return 'morden';
          case 3:  return 'ropsten';
          case 4:  return 'rinkeby';
          case 42: return 'kovan';
          default:   return 'private';
        }
    }
    /**
     * get Transaction Receipt
     * @param    _hash    transaction hash
     * @return   Transaction receipt
     */ 
    public async getTransactionReceipt(_hash:string) : Promise<any>
    {
        return this.web3.eth.getTransactionReceipt(_hash);
    }

    /**
     * get Transaction
     * @param    _hash    transaction hash
     * @return   transaction
     */ 
    public async getTransaction(_hash:string) : Promise<any>
    {
        return this.web3.eth.getTransaction(_hash);
    }

    /**
     * get timestamp of a block
     * @param    _blockNumber    number of the block
     * @return   timestamp of a blocks
     */ 
    public async getBlockTimestamp(_blockNumber:number) : Promise<any>
    {
        return new Promise(async (resolve, reject) => {
            try 
            {
                if(!this.blockTimestamp[_blockNumber]) {
                    // if we don't know the information, let's get it
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