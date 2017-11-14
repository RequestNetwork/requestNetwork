"use strict";
exports.__esModule = true;
var config_1 = require("../config");
// import Web3 from 'web3'; 
var Web3 = require('web3');
var ethABI = require('../lib/ethereumjs-abi-perso.js');
var Web3Single = /** @class */ (function () {
    function Web3Single() {
        this.web3 = new Web3(new Web3.providers.HttpProvider(config_1["default"].ethereum.node_url));
    }
    Web3Single.getInstance = function () {
        return this._instance || (this._instance = new this());
    };
    Web3Single.prototype.broadcastMethod = function (_method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _value, _from, _gasPrice, _gasLimit) {
        var _this = this;
        _method.estimateGas(function (err, estimateGas) {
            if (err)
                return _callbackTransactionError(err);
            _method.send({
                from: _from ? _from : config_1["default"].ethereum.from,
                gasPrice: _gasPrice ? _gasPrice : _this.web3.utils.toWei(config_1["default"].ethereum.gasPriceDefault, config_1["default"].ethereum.gasPriceDefaultUnit),
                gas: _gasLimit ? _gasLimit : estimateGas,
                value: _value ? _value : 0
            })
                .on('transactionHash', _callbackTransactionHash)
                .on('receipt', _callbackTransactionReceipt)
                .on('confirmation', _callbackTransactionConfirmation)
                .on('error', _callbackTransactionError);
        });
    };
    // public callMethod(_method:any) : Promise<any>
    // {
    // 	return new Promise((resolve, reject) => {
    // 		_method.call(function(err:Error,data:any) {
    // 			if(err) return reject(err)
    // 	   		resolve(data);
    // 		})
    // 	});
    // }
    Web3Single.prototype.arrayToBytes32 = function (array, length) {
        var ret = [];
        console.log('this');
        array.forEach(function (o) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('bytes32', o)));
        }.bind(this));
        for (var i = array.length; i < length; i++) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('bytes32', 0)));
        }
        return ret;
        // const requestParts = [
        // 	{value: extParams, type: 'bytes32[9]'}
        // ];
        // let types: any[] = [];
        // let values: any[] = [];
        // requestParts.forEach(function(o,i) {
        // 	types.push(o.type);
        // 	values.push(o.value);
        // });
        // return ethABI.solidityPack(types, values);
    };
    Web3Single.prototype.isAddressNoChecksum = function (address) {
        return this.web3.utils.isAddress(address.toLowerCase());
    };
    Web3Single.prototype.isHexStrictBytes32 = function (hex) {
        return this.web3.utils.isHexStrict(hex) && hex.length == 66; // '0x' + 32 bytes * 2 characters = 66
    };
    Web3Single.prototype.decodeLog = function (abi, event, log) {
        var eventInput;
        abi.some(function (o) {
            if (o.name == event) {
                eventInput = o.inputs;
                return true;
            }
            return false;
        });
        return this.web3.eth.abi.decodeLog(eventInput, log.raw.data, log.raw.topics[0]);
    };
    Web3Single._instance = new Web3Single();
    return Web3Single;
}());
exports.Web3Single = Web3Single;
