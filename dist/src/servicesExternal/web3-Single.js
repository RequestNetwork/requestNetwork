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
var bignumber_js_1 = require("bignumber.js");
var config_1 = require("../config");
var Web3 = require('web3');
// const Web3 = require('web3');
// declare var require: (moduleId: string) => any;
var ethABI = require('../lib/ethereumjs-abi-perso.js');
var Web3Single = /** @class */ (function () {
    function Web3Single(web3Provider) {
        this.web3 = new Web3(web3Provider || new Web3.providers.HttpProvider(config_1.default.ethereum.node_url));
    }
    Web3Single.prototype.broadcastMethod = function (_method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var accounts, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!_options)
                            _options = {};
                        if (!!_options.from) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.web3.eth.getAccounts()];
                    case 2:
                        accounts = _a.sent();
                        _options.from = accounts[0];
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        return [2 /*return*/, _callbackTransactionError(e_1)];
                    case 4:
                        _options.value = _options.value ? _options.value : 0;
                        _options.gas = _options.gas ? _options.gas : 90000000;
                        _options.gasPrice = _options.gasPrice ? _options.gasPrice : this.web3.utils.toWei(config_1.default.ethereum.gasPriceDefault, config_1.default.ethereum.gasPriceDefaultUnit);
                        _method.estimateGas(_options, function (err, estimateGas) {
                            if (err)
                                return _callbackTransactionError(err);
                            _options.gas = _options.gas ? _options.gas : Math.floor(estimateGas * 2);
                            _method.send(_options)
                                .on('transactionHash', _callbackTransactionHash)
                                .on('receipt', _callbackTransactionReceipt)
                                .on('confirmation', _callbackTransactionConfirmation)
                                .on('error', _callbackTransactionError);
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
    Web3Single.prototype.getDefaultAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.web3.eth.getAccounts(function (err, accs) {
                            if (err)
                                return reject(err);
                            if (accs.length === 0)
                                return reject(Error("No accounts found"));
                            return resolve(accs[0]);
                        });
                    })];
            });
        });
    };
    Web3Single.prototype.toSolidityBytes32 = function (type, value) {
        return this.web3.utils.bytesToHex(ethABI.toSolidityBytes32(type, value));
    };
    Web3Single.prototype.arrayToBytes32 = function (array, length) {
        var ret = [];
        console.log('this');
        array.forEach(function (o) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('address', o)));
        }.bind(this));
        for (var i = array.length; i < length; i++) {
            ret.push(this.web3.utils.bytesToHex(ethABI.toSolidityBytes32('bytes32', 0)));
        }
        return ret;
    };
    Web3Single.prototype.isAddressNoChecksum = function (address) {
        return this.web3.utils.isAddress(address.toLowerCase());
    };
    Web3Single.prototype.areSameAddressesNoChecksum = function (address1, address2) {
        return address1.toLowerCase() == address2.toLowerCase();
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
    Web3Single.prototype.setUpOptions = function (_options) {
        if (!_options)
            _options = {};
        if (!_options.numberOfConfirmation)
            _options.numberOfConfirmation = 0;
        if (_options.gasPrice)
            _options.gasPrice = new bignumber_js_1.default(_options.gasPrice);
        if (_options.gas)
            _options.gas = new bignumber_js_1.default(_options.gas);
        return _options;
    };
    return Web3Single;
}());
exports.Web3Single = Web3Single;
//# sourceMappingURL=web3-single.js.map