import BigNumber from 'bignumber.js';
import config from '../config';
import * as Types from '../types';
var Web3 = require('web3');
// const Web3 = require('web3');

// declare var require: (moduleId: string) => any;
const ethABI = require('../lib/ethereumjs-abi-perso.js');

export class Web3Single {
    public web3: any;

    constructor(web3Provider ? : any) {
        this.web3 = new Web3(web3Provider ||  new Web3.providers.HttpProvider(config.ethereum.node_url));
    }

    public async broadcastMethod(_method: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _value: any,
        _from: string,
        _gasPrice: BigNumber,
        _gasLimit: BigNumber) {

        if (!_from) {
            try {
                let accounts = await this.web3.eth.getAccounts();
                _from = accounts[0];
            } catch (e) {
                return _callbackTransactionError(e);
            }
        }

        _method.estimateGas({
            from: _from,
            value: _value ? _value : 0,
            gas: _gasLimit ? _gasLimit : 90000000
        }, (err: any, estimateGas: number) => {
            if (err) return _callbackTransactionError(err);

            _method.send({
                    from: _from,
                    gasPrice: _gasPrice ? _gasPrice : this.web3.utils.toWei(config.ethereum.gasPriceDefault, config.ethereum.gasPriceDefaultUnit),
                    gas: _gasLimit ? _gasLimit : Math.floor(estimateGas * 2),
                    value: _value ? _value : 0
                })
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

    public async getDefaultAccount(): Promise < any > {
        return new Promise((resolve, reject) => {
            this.web3.eth.getAccounts((err, accs) => {
                if (err) return reject(err);
                if (accs.length === 0) return reject(Error("No accounts found"));
                return resolve(accs[0]);
            });
        });
    }

    public toSolidityBytes32(type: string, value: any): any {
        return this.web3.utils.bytesToHex(ethABI.toSolidityBytes32(type, value));
    }

    public arrayToBytes32(array: any[], length: number): any[] {
        let ret: any[] = [];
        console.log('this')
        array.forEach(function(o: any) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('address', o)));
        }.bind(this));

        for (let i = array.length; i < length; i++) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('bytes32', 0)));
        }
        return ret;
    }

    public isAddressNoChecksum(address: string): boolean {
        return this.web3.utils.isAddress(address.toLowerCase());
    }

    public areSameAddressesNoChecksum(address1: string,address2: string): boolean {
        return address1.toLowerCase()==address2.toLowerCase();
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

}