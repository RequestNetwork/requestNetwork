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
var Types = require("../types");
var artifacts_1 = require("../artifacts");
var requestCore_service_1 = require("../servicesCore/requestCore-service");
var ServiceExtensions = require("../servicesExtensions");
var requestEthereum_Artifact = artifacts_1.default.RequestEthereumArtifact;
var requestCore_Artifact = artifacts_1.default.RequestCoreArtifact;
var web3_single_1 = require("../servicesExternal/web3-single");
var ipfs_service_1 = require("../servicesExternal/ipfs-service");
var RequestEthereumService = /** @class */ (function () {
    function RequestEthereumService() {
        this.web3Single = web3_single_1.Web3Single.getInstance();
        this.ipfs = ipfs_service_1.default.getInstance();
        this.abiRequestCore = requestCore_Artifact.abi;
        this.requestCoreServices = new requestCore_service_1.default();
        this.abiRequestEthereum = requestEthereum_Artifact.abi;
        if (!requestEthereum_Artifact.networks[this.web3Single.networkName]) {
            throw Error('RequestEthereum Artifact does not have configuration for network : "' + this.web3Single.networkName + '"');
        }
        this.addressRequestEthereum = requestEthereum_Artifact.networks[this.web3Single.networkName].address;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }
    RequestEthereumService.prototype.createRequestAsPayeeAsync = function (_payer, _amountInitial, _data, _extension, _extensionParams, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _amountInitial = new bignumber_js_1.default(_amountInitial);
                _options = this.web3Single.setUpOptions(_options);
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        var account, _a, _b, paramsParsed_1, parsing, e_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 4, , 5]);
                                    _a = _options.from;
                                    if (_a) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                                case 1:
                                    _a = (_c.sent());
                                    _c.label = 2;
                                case 2:
                                    account = _a;
                                    // check _data is a proper JSON
                                    if (_amountInitial.lt(0))
                                        return [2 /*return*/, reject(Error('_amountInitial must a positive integer'))];
                                    if (!this.web3Single.isAddressNoChecksum(_payer))
                                        return [2 /*return*/, reject(Error('_payer must be a valid eth address'))];
                                    if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension))
                                        return [2 /*return*/, reject(Error('_extension must be a valid eth address'))];
                                    if (_extensionParams && _extensionParams.length > 9)
                                        return [2 /*return*/, reject(Error('_extensionParams length must be less than 9'))];
                                    if (this.web3Single.areSameAddressesNoChecksum(account, _payer)) {
                                        return [2 /*return*/, reject(Error('_from must be different than _payer'))];
                                    }
                                    _b = _options;
                                    return [4 /*yield*/, this.requestCoreServices.getCollectEstimationAsync(_amountInitial, this.addressRequestEthereum, _extension)];
                                case 3:
                                    _b.value = _c.sent();
                                    if (!_extension || _extension == '') {
                                        paramsParsed_1 = this.web3Single.arrayToBytes32(_extensionParams, 9);
                                    }
                                    else if (ServiceExtensions.getServiceFromAddress(_extension)) {
                                        parsing = ServiceExtensions.getServiceFromAddress(_extension).parseParameters(_extensionParams);
                                        if (parsing.error) {
                                            return [2 /*return*/, reject(parsing.error)];
                                        }
                                        paramsParsed_1 = parsing.result;
                                    }
                                    else {
                                        return [2 /*return*/, reject(Error('_extension is not supported'))];
                                    }
                                    this.ipfs.addFile(_data, function (err, hash) {
                                        if (err)
                                            return reject(err);
                                        var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed_1, hash);
                                        _this.web3Single.broadcastMethod(method, function (transactionHash) {
                                            // we do nothing here!
                                        }, function (receipt) {
                                            // we do nothing here!
                                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                                            var event_1, request, e_2;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 4];
                                                        _a.label = 1;
                                                    case 1:
                                                        _a.trys.push([1, 3, , 4]);
                                                        event_1 = this.web3Single.decodeLog(this.abiRequestCore, 'Created', receipt.events[0]);
                                                        return [4 /*yield*/, this.getRequestAsync(event_1.requestId)];
                                                    case 2:
                                                        request = _a.sent();
                                                        return [2 /*return*/, resolve({ request: request, transactionHash: receipt.transactionHash })];
                                                    case 3:
                                                        e_2 = _a.sent();
                                                        return [2 /*return*/, reject(e_2)];
                                                    case 4: return [2 /*return*/];
                                                }
                                            });
                                        }); }, function (error) {
                                            return reject(error);
                                        }, _options);
                                    });
                                    return [3 /*break*/, 5];
                                case 4:
                                    e_1 = _c.sent();
                                    return [2 /*return*/, reject(e_1)];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    RequestEthereumService.prototype.createRequestAsPayee = function (_payer, _amountInitial, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _data, _extension, _extensionParams, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var account, _a, _b, paramsParsed_2, parsing, e_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _amountInitial = new bignumber_js_1.default(_amountInitial);
                        _options = this.web3Single.setUpOptions(_options);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, , 6]);
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 2:
                        _a = (_c.sent());
                        _c.label = 3;
                    case 3:
                        account = _a;
                        if (_amountInitial.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amountInitial must a positive integer'))];
                        if (!this.web3Single.isAddressNoChecksum(_payer))
                            return [2 /*return*/, _callbackTransactionError(Error('_payer must be a valid eth address'))];
                        if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension))
                            return [2 /*return*/, _callbackTransactionError(Error('_extension must be a valid eth address'))];
                        if (_extensionParams && _extensionParams.length > 9)
                            return [2 /*return*/, _callbackTransactionError(Error('_extensionParams length must be less than 9'))];
                        if (this.web3Single.areSameAddressesNoChecksum(account, _payer)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be different than _payer'))];
                        }
                        _b = _options;
                        return [4 /*yield*/, this.requestCoreServices.getCollectEstimationAsync(_amountInitial, this.addressRequestEthereum, _extension)];
                    case 4:
                        _b.value = _c.sent();
                        if (!_extension || _extension == '') {
                            paramsParsed_2 = this.web3Single.arrayToBytes32(_extensionParams, 9);
                        }
                        else if (ServiceExtensions.getServiceFromAddress(_extension)) {
                            parsing = ServiceExtensions.getServiceFromAddress(_extension).parseParameters(_extensionParams);
                            if (parsing.error) {
                                return [2 /*return*/, _callbackTransactionError(parsing.error)];
                            }
                            paramsParsed_2 = parsing.result;
                        }
                        else {
                            return [2 /*return*/, _callbackTransactionError(Error('_extension is not supported'))];
                        }
                        this.ipfs.addFile(_data, function (err, hash) {
                            if (err)
                                return _callbackTransactionError(err);
                            var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed_2, hash);
                            _this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        e_3 = _c.sent();
                        return [2 /*return*/, _callbackTransactionError(e_3)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.acceptAsync = function (_requestId, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request, account, _a, method, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 1:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        account = _a;
                        if (request.state != Types.State.Created) {
                            return [2 /*return*/, reject(Error('request state is not \'created\''))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                            return [2 /*return*/, reject(Error('account must be the payer'))];
                        }
                        method = this.instanceRequestEthereum.methods.accept(_requestId);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_1, e_5;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 4];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'Accepted', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 2:
                                        request_1 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_1, transactionHash: receipt.transactionHash })];
                                    case 3:
                                        e_5 = _a.sent();
                                        return [2 /*return*/, reject(e_5)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_4 = _b.sent();
                        return [2 /*return*/, reject(e_4)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.accept = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 2:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        account = _a;
                        if (request.state != Types.State.Created) {
                            return [2 /*return*/, _callbackTransactionError(Error('request state is not \'created\''))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                            return [2 /*return*/, _callbackTransactionError(Error('from must be the payer'))];
                        }
                        method = this.instanceRequestEthereum.methods.accept(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_6 = _b.sent();
                        return [2 /*return*/, _callbackTransactionError(e_6)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.cancelAsync = function (_requestId, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request, account, _a, method, e_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 1:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        account = _a;
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, reject(Error('account must be the payer or the payee'))];
                        }
                        if (this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created) {
                            return [2 /*return*/, reject(Error('payer can cancel request in state \'created\''))];
                        }
                        if (this.web3Single.areSameAddressesNoChecksum(account, request.payee) && request.state == Types.State.Canceled) {
                            return [2 /*return*/, reject(Error('payee cannot cancel request already canceled'))];
                        }
                        if (request.balance != 0) {
                            return [2 /*return*/, reject(Error('impossible to cancel a Request with a balance != 0'))];
                        }
                        method = this.instanceRequestEthereum.methods.cancel(_requestId);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_2, e_8;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 4];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'Canceled', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 2:
                                        request_2 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_2, transactionHash: receipt.transactionHash })];
                                    case 3:
                                        e_8 = _a.sent();
                                        return [2 /*return*/, reject(e_8)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_7 = _b.sent();
                        return [2 /*return*/, reject(e_7)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.cancel = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 2:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        account = _a;
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be the payer or the payee'))];
                        }
                        if (this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created) {
                            return [2 /*return*/, _callbackTransactionError(Error('payer can cancel request in state \'created\''))];
                        }
                        if (this.web3Single.areSameAddressesNoChecksum(account, request.paye) && request.state == Types.State.Canceled) {
                            return [2 /*return*/, _callbackTransactionError(Error('payee cannot cancel request already \'canceled\''))];
                        }
                        if (request.balance != 0) {
                            return [2 /*return*/, _callbackTransactionError(Error('impossible to cancel a Request with a balance != 0'))];
                        }
                        method = this.instanceRequestEthereum.methods.cancel(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_9 = _b.sent();
                        return [2 /*return*/, _callbackTransactionError(e_9)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.paymentActionAsync = function (_requestId, _amount, _additionals, _options) {
        var _this = this;
        _additionals = new bignumber_js_1.default(_additionals);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new bignumber_js_1.default(_amount);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request_3, account, _a, method, e_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 1:
                        request_3 = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        account = _a;
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (_options.value.lt(0))
                            return [2 /*return*/, reject(Error('_amount must a positive integer'))];
                        if (_additionals.lt(0))
                            return [2 /*return*/, reject(Error('_additionals must a positive integer'))];
                        if (request_3.state == Types.State.Canceled) {
                            return [2 /*return*/, reject(Error('request cannot be canceled'))];
                        }
                        method = this.instanceRequestEthereum.methods.paymentAction(_requestId, _additionals);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, requestAfter, e_11;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 4];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateBalance', request_3.state == Types.State.Created ? receipt.events[1] : receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 2:
                                        requestAfter = _a.sent();
                                        return [2 /*return*/, resolve({ request: requestAfter, transactionHash: receipt.transactionHash })];
                                    case 3:
                                        e_11 = _a.sent();
                                        return [2 /*return*/, reject(e_11)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_10 = _b.sent();
                        return [2 /*return*/, reject(e_10)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.paymentAction = function (_requestId, _amount, _additionals, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_12;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _additionals = new bignumber_js_1.default(_additionals);
                        _options = this.web3Single.setUpOptions(_options);
                        _options.value = new bignumber_js_1.default(_amount);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 2:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        account = _a;
                        // TODO use bigNumber
                        if (_options.value.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amount must a positive integer'))];
                        if (_additionals.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_additionals must a positive integer'))];
                        if (request.state == Types.State.Canceled) {
                            return [2 /*return*/, _callbackTransactionError(Error('request cannot be canceled'))];
                        }
                        method = this.instanceRequestEthereum.methods.paymentAction(_requestId, _additionals);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_12 = _b.sent();
                        return [2 /*return*/, _callbackTransactionError(e_12)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.refundActionAsync = function (_requestId, _amount, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _options = this.web3Single.setUpOptions(_options);
                _options.value = new bignumber_js_1.default(_amount);
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        var request, account, _a, method, e_13;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
                                    // TODO check if this is possible ? (quid if other tx pending)
                                    if (!this.web3Single.isHexStrictBytes32(_requestId))
                                        return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                                    return [4 /*yield*/, this.getRequestAsync(_requestId)];
                                case 1:
                                    request = _b.sent();
                                    _a = _options.from;
                                    if (_a) return [3 /*break*/, 3];
                                    return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                                case 2:
                                    _a = (_b.sent());
                                    _b.label = 3;
                                case 3:
                                    account = _a;
                                    if (_options.value.lt(0))
                                        return [2 /*return*/, reject(Error('_amount must a positive integer'))];
                                    if (request.state != Types.State.Accepted) {
                                        return [2 /*return*/, reject(Error('request must be accepted'))];
                                    }
                                    if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                                        return [2 /*return*/, reject(Error('account must be payee'))];
                                    }
                                    method = this.instanceRequestEthereum.methods.refundAction(_requestId);
                                    this.web3Single.broadcastMethod(method, function (transactionHash) {
                                        // we do nothing here!
                                    }, function (receipt) {
                                        // we do nothing here!
                                    }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                                        var event, request_4, e_14;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 4];
                                                    _a.label = 1;
                                                case 1:
                                                    _a.trys.push([1, 3, , 4]);
                                                    event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateBalance', receipt.events[0]);
                                                    return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                                case 2:
                                                    request_4 = _a.sent();
                                                    return [2 /*return*/, resolve({ request: request_4, transactionHash: receipt.transactionHash })];
                                                case 3:
                                                    e_14 = _a.sent();
                                                    return [2 /*return*/, reject(e_14)];
                                                case 4: return [2 /*return*/];
                                            }
                                        });
                                    }); }, function (error) {
                                        return reject(error);
                                    }, _options);
                                    return [3 /*break*/, 5];
                                case 4:
                                    e_13 = _b.sent();
                                    return [2 /*return*/, reject(e_13)];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    RequestEthereumService.prototype.refundAction = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_15;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _options.value = new bignumber_js_1.default(_amount);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 2:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        account = _a;
                        if (_options.value.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amount must a positive integer'))];
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, _callbackTransactionError(Error('request must be accepted'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be payee'))];
                        }
                        method = this.instanceRequestEthereum.methods.refundAction(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_15 = _b.sent();
                        return [2 /*return*/, _callbackTransactionError(e_15)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.subtractActionAsync = function (_requestId, _amount, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        _amount = new bignumber_js_1.default(_amount);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request, account, _a, method, e_16;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 1:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        account = _a;
                        if (_amount.lt(0))
                            return [2 /*return*/, reject(Error('_amount must a positive integer'))];
                        if (request.state == Types.State.Canceled) {
                            return [2 /*return*/, reject(Error('request must be accepted or created'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, reject(Error('account must be payee'))];
                        }
                        method = this.instanceRequestEthereum.methods.subtractAction(_requestId, _amount);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_5, e_17;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 4];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateExpectedAmount', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 2:
                                        request_5 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_5, transactionHash: receipt.transactionHash })];
                                    case 3:
                                        e_17 = _a.sent();
                                        return [2 /*return*/, reject(e_17)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_16 = _b.sent();
                        return [2 /*return*/, reject(e_16)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.subtractAction = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_18;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _amount = new bignumber_js_1.default(_amount);
                        _options = this.web3Single.setUpOptions(_options);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 2:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        account = _a;
                        if (_amount.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amount must a positive integer'))];
                        if (request.state == Types.State.Canceled) {
                            return [2 /*return*/, _callbackTransactionError(Error('request must be accepted or created'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be payee'))];
                        }
                        method = this.instanceRequestEthereum.methods.subtractAction(_requestId, _amount);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_18 = _b.sent();
                        return [2 /*return*/, _callbackTransactionError(e_18)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.additionalActionAsync = function (_requestId, _amount, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        _amount = new bignumber_js_1.default(_amount);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request, account, _a, method, e_19;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 1:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 2:
                        _a = (_b.sent());
                        _b.label = 3;
                    case 3:
                        account = _a;
                        if (_amount.lt(0))
                            return [2 /*return*/, reject(Error('_amount must a positive integer'))];
                        if (request.state == Types.State.Canceled) {
                            return [2 /*return*/, reject(Error('request must be accepted or created'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                            return [2 /*return*/, reject(Error('account must be payer'))];
                        }
                        method = this.instanceRequestEthereum.methods.additionalAction(_requestId, _amount);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_6, e_20;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 4];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateExpectedAmount', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 2:
                                        request_6 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_6, transactionHash: receipt.transactionHash })];
                                    case 3:
                                        e_20 = _a.sent();
                                        return [2 /*return*/, reject(e_20)];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_19 = _b.sent();
                        return [2 /*return*/, reject(e_19)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.additionalAction = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_21;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _amount = new bignumber_js_1.default(_amount);
                        _options = this.web3Single.setUpOptions(_options);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestAsync(_requestId)];
                    case 2:
                        request = _b.sent();
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 3:
                        _a = (_b.sent());
                        _b.label = 4;
                    case 4:
                        account = _a;
                        if (_amount.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amount must a positive integer'))];
                        if (request.state == Types.State.Canceled) {
                            return [2 /*return*/, _callbackTransactionError(Error('request must be accepted or created'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be payer'))];
                        }
                        method = this.instanceRequestEthereum.methods.additionalAction(_requestId, _amount);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_21 = _b.sent();
                        return [2 /*return*/, _callbackTransactionError(e_21)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.withdrawAsync = function (_options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(function (resolve, reject) {
            var method = _this.instanceRequestEthereum.methods.withdraw();
            _this.web3Single.broadcastMethod(method, function (transactionHash) {
                // we do nothing here!
            }, function (receipt) {
                // we do nothing here!
            }, function (confirmationNumber, receipt) {
                if (confirmationNumber == _options.numberOfConfirmation) {
                    try {
                        return resolve({ transactionHash: receipt.transactionHash });
                    }
                    catch (e) {
                        return reject(e);
                    }
                }
            }, function (error) {
                return reject(error);
            }, _options);
        });
    };
    RequestEthereumService.prototype.withdraw = function (_callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        _options = this.web3Single.setUpOptions(_options);
        var method = this.instanceRequestEthereum.methods.withdraw();
        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
    };
    RequestEthereumService.prototype.getRequestCurrencyContractInfoAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, resolve({})];
            });
        }); });
    };
    RequestEthereumService.prototype.getRequestCurrencyContractInfo = function (_requestId, _callbackGetRequest) {
        return _callbackGetRequest(null, {});
    };
    RequestEthereumService.prototype.getRequestAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var dataResult, e_22;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.requestCoreServices.getRequestAsync(_requestId)];
                    case 1:
                        dataResult = _a.sent();
                        return [2 /*return*/, resolve(dataResult)];
                    case 2:
                        e_22 = _a.sent();
                        return [2 /*return*/, reject(e_22)];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.getRequest = function (_requestId, _callbackGetRequest) {
        this.requestCoreServices.getRequest(_requestId, _callbackGetRequest);
    };
    return RequestEthereumService;
}());
exports.default = RequestEthereumService;
//# sourceMappingURL=requestEthereum-service.js.map