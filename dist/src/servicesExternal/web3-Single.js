"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../config");
var Web3 = require('web3');
// ethereumjs-abi.js modified to support solidity packing of bytes32 array
var ethABI = require('../lib/ethereumjs-abi-perso.js');
/**
 * The Web3Single class is the singleton class containing the web3.js interface
 */
var Web3Single = /** @class */ (function () {
    /**
     * Private constructor to Instantiates a new Web3Single
     * @param   provider        The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with
     *                          the Ethereum network.
     * @param   networkId       the Ethereum network ID.
     */
    function Web3Single(web3Provider, networkId) {
        /**
         * cache of the blocks timestamp
         */
        this.blockTimestamp = {};
        this.web3 = new Web3(web3Provider || new Web3.providers.HttpProvider(config_1.default.ethereum.nodeUrlDefault[config_1.default.ethereum.default]));
        this.networkName = networkId ? Web3Single.getNetworkName(networkId) : config_1.default.ethereum.default;
    }
    /**
     * Initialized the class Web3Single
     * @param   provider        The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with
     *                          the Ethereum network.
     * @param   networkId       the Ethereum network ID.
     */
    Web3Single.init = function (web3Provider, networkId) {
        this._instance = new this(web3Provider, networkId);
    };
    /**
     * get the instance of Web3Single
     * @return  The instance of the Web3Single class.
     */
    Web3Single.getInstance = function () {
        return this._instance;
    };
    /**
     * return BN of web3
     * @return Web3.utils.BN
     */
    Web3Single.BN = function () {
        return Web3.utils.BN;
    };
    /**
     * Send a web3 method
     * @param    _method                             the method to send
     * @param    _callbackTransactionHash            callback when the transaction is submitted
     * @param    _callbackTransactionReceipt         callback when the transacton is mined (0 confirmation block)
     * @param    _callbackTransactionConfirmation    callback when a new confirmation block is mined (up to 20)
     * @param    _callbackTransactionError           callback when an error occured
     * @param    _options                            options for the method (gasPrice, gas, value, from)
     */
    Web3Single.prototype.broadcastMethod = function (_method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var options, accounts, e_1, forcedGas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        options = Object.assign({}, _options || {});
                        ;
                        options.numberOfConfirmation = undefined;
                        if (!!options.from) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.web3.eth.getAccounts()];
                    case 2:
                        accounts = _a.sent();
                        options.from = accounts[0];
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        return [2 /*return*/, _callbackTransactionError(e_1)];
                    case 4:
                        forcedGas = options.gas;
                        options.value = options.value ? options.value : 0;
                        options.gas = forcedGas ? forcedGas : 90000000;
                        options.gasPrice = options.gasPrice ? options.gasPrice : this.web3.utils.toWei(config_1.default.ethereum.gasPriceDefault, config_1.default.ethereum.gasPriceDefaultUnit);
                        // get the gas estimation
                        _method.estimateGas(options, function (err, estimateGas) {
                            if (err)
                                return _callbackTransactionError(err);
                            // it is safer to add 5% of gas
                            options.gas = forcedGas ? forcedGas : Math.floor(estimateGas * 1.05);
                            // try the method offline
                            _method.call(options, function (errCall, resultCall) {
                                if (errCall) {
                                    //let's try with more gas (*2)
                                    options.gas = forcedGas ? forcedGas : Math.floor(estimateGas * 2);
                                    // try the method offline
                                    _method.call(options, function (errCall, resultCall) {
                                        if (errCall)
                                            return _callbackTransactionError(errCall);
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
                        return [2 /*return*/];
                }
            });
        });
    };
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
    Web3Single.prototype.getDefaultAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.web3.eth.getAccounts(function (err, accs) {
                            if (err)
                                return reject(err);
                            if (accs.length === 0)
                                return reject(Error('No accounts found'));
                            return resolve(accs[0]);
                        });
                    })];
            });
        });
    };
    /**
     * Get the default account (account[0] of the wallet) With a callback
     * @param    _callback    callback with the default account
     */
    Web3Single.prototype.getDefaultAccountCallback = function (_callback) {
        this.web3.eth.getAccounts(function (err, accs) {
            if (err)
                return _callback(err, null);
            if (accs.length === 0)
                return _callback(Error('No accounts found'), null);
            return _callback(null, accs[0]);
        });
    };
    /**
     * Convert a value in solidity bytes32 string
     * @param    _type    type of the value to convert (e.g: address, uint, int etc...)
     * @param    _value   value to convert
     * @return   solidity like bytes32 string
     */
    Web3Single.prototype.toSolidityBytes32 = function (_type, _value) {
        return this.web3.utils.bytesToHex(ethABI.toSolidityBytes32(_type, _value));
    };
    /**
     * Convert an array to an array in solidity bytes32 string
     * TODO : only support addresses so far.
     * @param    _array   array to convert
     * @param    _length  length of the final array
     * @return   array of solidity like bytes32 string
     */
    Web3Single.prototype.arrayToBytes32 = function (_array, _length) {
        _array = _array ? _array : [];
        var ret = [];
        _array.forEach(function (o) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('address', o)));
        }.bind(this));
        // fill the empty case with zeros
        for (var i = _array.length; i < _length; i++) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('bytes32', 0)));
        }
        return ret;
    };
    /**
     * Check if an address is valid (ignoring case)
     * @param    _address   address to check
     * @return   true if address is valid
     */
    Web3Single.prototype.isAddressNoChecksum = function (_address) {
        if (!_address)
            return false;
        return _address && this.web3.utils.isAddress(_address.toLowerCase());
    };
    /**
     * Check if two addresses are equals (ignoring case)
     * @param    _address1   address to check
     * @param    _address2   address to check
     * @return   true if _address1 is the same as _address2
     */
    Web3Single.prototype.areSameAddressesNoChecksum = function (_address1, _address2) {
        if (!_address1 || !_address2)
            return false;
        return _address1 && _address2 && _address1.toLowerCase() == _address2.toLowerCase();
    };
    /**
     * Check if a string is a bytes32
     * @param    _hex   string to check
     * @return   true if _hex is a bytes32
     */
    Web3Single.prototype.isHexStrictBytes32 = function (_hex) {
        return this.web3.utils.isHexStrict(_hex) && _hex.length == 66; // '0x' + 32 bytes * 2 characters = 66
    };
    /**
     * Decode transaction log parameters
     * @param    _abi      abi of the contract
     * @param    _event    event name
     * @param    _log      log to decode
     * @return   object with the log decoded
     */
    Web3Single.prototype.decodeTransactionLog = function (_abi, _event, _log) {
        var eventInput;
        var signature;
        _abi.some(function (o) {
            if (o.name == _event) {
                eventInput = o.inputs;
                signature = o.signature;
                return true;
            }
            return false;
        });
        if (_log.topics[0] != signature) {
            return null;
        }
        return this.web3.eth.abi.decodeLog(eventInput, _log.data, _log.topics.slice(1));
    };
    /**
     * Decode transaction event parameters
     * @param    _abi          abi of the contract
     * @param    _eventName    event name
     * @param    _event        event to decode
     * @return   object with the event decoded
     */
    Web3Single.prototype.decodeEvent = function (_abi, _eventName, _event) {
        var eventInput;
        _abi.some(function (o) {
            if (o.name == _eventName) {
                eventInput = o.inputs;
                return true;
            }
            return false;
        });
        return this.web3.eth.abi.decodeLog(eventInput, _event.raw.data, _event.raw.topics.slice(1));
    };
    /**
     * Create or Clean options for a method
     * @param    _options    options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return   options cleaned
     */
    Web3Single.prototype.setUpOptions = function (_options) {
        if (!_options)
            _options = {};
        if (!_options.numberOfConfirmation)
            _options.numberOfConfirmation = 0;
        if (_options.gasPrice)
            _options.gasPrice = new Web3.utils.BN(_options.gasPrice);
        if (_options.gas)
            _options.gas = new Web3.utils.BN(_options.gas);
        return _options;
    };
    /**
     * get Network name from network Id
     * @param    _networkId    network id
     * @return   network name
     */
    Web3Single.getNetworkName = function (_networkId) {
        switch (_networkId) {
            case 1: return 'main';
            case 2: return 'morden';
            case 3: return 'ropsten';
            case 4: return 'rinkeby';
            case 42: return 'kovan';
            default: return 'private';
        }
    };
    /**
     * get Transaction Receipt
     * @param    _hash    transaction hash
     * @return   Transaction receipt
     */
    Web3Single.prototype.getTransactionReceipt = function (_hash) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.web3.eth.getTransactionReceipt(_hash)];
            });
        });
    };
    /**
     * get Transaction
     * @param    _hash    transaction hash
     * @return   transaction
     */
    Web3Single.prototype.getTransaction = function (_hash) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.web3.eth.getTransaction(_hash)];
            });
        });
    };
    /**
     * get timestamp of a block
     * @param    _blockNumber    number of the block
     * @return   timestamp of a blocks
     */
    Web3Single.prototype.getBlockTimestamp = function (_blockNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var block, e_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    if (!!this.blockTimestamp[_blockNumber]) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this.web3.eth.getBlock(_blockNumber)];
                                case 1:
                                    block = _a.sent();
                                    if (!block)
                                        throw Error('block \'' + _blockNumber + '\' not found');
                                    this.blockTimestamp[_blockNumber] = block.timestamp;
                                    _a.label = 2;
                                case 2: return [2 /*return*/, resolve(this.blockTimestamp[_blockNumber])];
                                case 3:
                                    e_2 = _a.sent();
                                    console.warn(e_2);
                                    return [2 /*return*/, resolve(null)];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    return Web3Single;
}());
exports.Web3Single = Web3Single;
//# sourceMappingURL=web3-single.js.map