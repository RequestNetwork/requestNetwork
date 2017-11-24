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
var bignumber_js_1 = require("bignumber.js");
var Types = require("../types");
var artifacts_1 = require("../artifacts");
var ServiceExtensions = require("../servicesExtensions");
var requestEthereum_Artifact = artifacts_1.default.RequestEthereumArtifact;
var requestCore_Artifact = artifacts_1.default.RequestCoreArtifact;
var web3_single_1 = require("../servicesExternal/web3-single");
var ipfs_service_1 = require("../servicesExternal/ipfs-service");
var RequestEthereumService = /** @class */ (function () {
    function RequestEthereumService(web3Provider) {
        this.web3Single = new web3_single_1.Web3Single(web3Provider);
        this.ipfs = ipfs_service_1.default.getInstance();
        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config_1.default.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
        this.abiRequestEthereum = requestEthereum_Artifact.abi;
        this.addressRequestEthereum = config_1.default.ethereum.contracts.requestEthereum;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }
    RequestEthereumService.prototype.createRequestAsPayeeAsync = function (_payer, _amountInitial, _details, _extension, _extensionParams, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _amountInitial = new bignumber_js_1.default(_amountInitial);
                _options = this.web3Single.setUpOptions(_options);
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        var account, _a, paramsParsed, parsing;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _a = _options.from;
                                    if (_a) return [3 /*break*/, 2];
                                    return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                                case 1:
                                    _a = (_b.sent());
                                    _b.label = 2;
                                case 2:
                                    account = _a;
                                    // check _details is a proper JSON
                                    if (_amountInitial.lt(0))
                                        return [2 /*return*/, reject(Error('_amountInitial must a positive integer'))];
                                    if (!this.web3Single.isAddressNoChecksum(_payer))
                                        return [2 /*return*/, reject(Error('_payer must be a valid eth address'))];
                                    if (_extension != '' && !this.web3Single.isAddressNoChecksum(_extension))
                                        return [2 /*return*/, reject(Error('_extension must be a valid eth address'))];
                                    if (_extensionParams.length > 9)
                                        return [2 /*return*/, reject(Error('_extensionParams length must be less than 9'))];
                                    if (this.web3Single.areSameAddressesNoChecksum(account, _payer)) {
                                        return [2 /*return*/, reject(Error('_from must be different than _payer'))];
                                    }
                                    if (ServiceExtensions.getServiceFromAddress(_extension)) {
                                        parsing = ServiceExtensions.getServiceFromAddress(_extension, this.web3Single.web3.currentProvider).parseParameters(_extensionParams);
                                        if (parsing.error) {
                                            return [2 /*return*/, reject(parsing.error)];
                                        }
                                        paramsParsed = parsing.result;
                                    }
                                    else {
                                        paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
                                    }
                                    this.ipfs.addFile(JSON.parse(_details), function (err, hash) {
                                        if (err)
                                            return reject(err);
                                        var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed, hash);
                                        _this.web3Single.broadcastMethod(method, function (transactionHash) {
                                            // we do nothing here!
                                        }, function (receipt) {
                                            // we do nothing here!
                                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                                            var event_1, request;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 2];
                                                        event_1 = this.web3Single.decodeLog(this.abiRequestCore, 'Created', receipt.events[0]);
                                                        return [4 /*yield*/, this.getRequestAsync(event_1.requestId)];
                                                    case 1:
                                                        request = _a.sent();
                                                        return [2 /*return*/, resolve({ request: request, transactionHash: receipt.transactionHash })];
                                                    case 2: return [2 /*return*/];
                                                }
                                            });
                                        }); }, function (error) {
                                            return reject(error);
                                        }, _options);
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            });
        });
    };
    RequestEthereumService.prototype.createRequestAsPayee = function (_payer, _amountInitial, _extension, _extensionParams, _details, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var account, _a, paramsParsed, parsing;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _amountInitial = new bignumber_js_1.default(_amountInitial);
                        _options = this.web3Single.setUpOptions(_options);
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        account = _a;
                        if (_amountInitial.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amountInitial must a positive integer'))];
                        if (!this.web3Single.isAddressNoChecksum(_payer))
                            return [2 /*return*/, _callbackTransactionError(Error('_payer must be a valid eth address'))];
                        if (_extension != '' && !this.web3Single.isAddressNoChecksum(_extension))
                            return [2 /*return*/, _callbackTransactionError(Error('_extension must be a valid eth address'))];
                        if (_extensionParams.length > 9)
                            return [2 /*return*/, _callbackTransactionError(Error('_extensionParams length must be less than 9'))];
                        if (this.web3Single.areSameAddressesNoChecksum(account, _payer)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be different than _payer'))];
                        }
                        if (ServiceExtensions.getServiceFromAddress(_extension)) {
                            parsing = ServiceExtensions.getServiceFromAddress(_extension, this.web3Single.web3.currentProvider).parseParameters(_extensionParams);
                            if (parsing.error) {
                                return [2 /*return*/, _callbackTransactionError(Error(parsing.error))];
                            }
                            paramsParsed = parsing.result;
                        }
                        else {
                            paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
                        }
                        this.ipfs.addFile(JSON.parse(_details), function (err, hash) {
                            if (err)
                                return _callbackTransactionError(err);
                            var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed, hash);
                            _this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.acceptAsync = function (_requestId, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request, account, _a, method, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
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
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        method = this.instanceRequestEthereum.methods.accept(_requestId);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 2];
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'Accepted', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 1:
                                        request_1 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_1, transactionHash: receipt.transactionHash })];
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _b.sent();
                        return [2 /*return*/, reject(e_1)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.accept = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
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
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        method = this.instanceRequestEthereum.methods.accept(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_2 = _b.sent();
                        throw e_2;
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
            var request, account, _a, method, e_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
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
                            return [2 /*return*/, reject(Error('payer cannot cancel request already canceled'))];
                        }
                        if (request.amountPaid != 0) {
                            return [2 /*return*/, reject(Error('impossible to cancel a Request with a balance != 0'))];
                        }
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        method = this.instanceRequestEthereum.methods.cancel(_requestId);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 2];
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'Canceled', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 1:
                                        request_2 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_2, transactionHash: receipt.transactionHash })];
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_3 = _b.sent();
                        return [2 /*return*/, reject(e_3)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.cancel = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
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
                            return [2 /*return*/, _callbackTransactionError(Error('payer cannot cancel request already \'canceled\''))];
                        }
                        if (request.amountPaid != 0) {
                            return [2 /*return*/, _callbackTransactionError(Error('impossible to cancel a Request with a balance != 0'))];
                        }
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        method = this.instanceRequestEthereum.methods.cancel(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_4 = _b.sent();
                        throw e_4;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.payAsync = function (_requestId, _amount, _tips, _options) {
        var _this = this;
        _tips = new bignumber_js_1.default(_tips);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new bignumber_js_1.default(_amount);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request, account, _a, method, e_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
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
                        // TODO check from == payer ?
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        // TODO use bigNumber
                        if (_options.value.lt(0))
                            return [2 /*return*/, reject(Error('_amount must a positive integer'))];
                        // TODO use bigNumber
                        if (_tips.lt(0))
                            return [2 /*return*/, reject(Error('_tips must a positive integer'))];
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, reject(Error('request must be accepted'))];
                        }
                        if (_options.value.lt(_tips)) {
                            return [2 /*return*/, reject(Error('tips declare must be lower than amount sent'))];
                        }
                        if (request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract).lt(_amount)) {
                            return [2 /*return*/, reject(Error('You cannot pay more than amount needed'))];
                        }
                        method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 2];
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'Payment', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 1:
                                        request_3 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_3, transactionHash: receipt.transactionHash })];
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_5 = _b.sent();
                        return [2 /*return*/, reject(e_5)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.pay = function (_requestId, _amount, _tips, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _tips = new bignumber_js_1.default(_tips);
                        _options = this.web3Single.setUpOptions(_options);
                        _options.value = new bignumber_js_1.default(_amount);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
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
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        // TODO use bigNumber
                        if (_options.value.lt(0) /* || !_amount.isInteger()*/)
                            return [2 /*return*/, _callbackTransactionError(Error('_amount must a positive integer'))];
                        // TODO use bigNumber
                        if (_tips.lt(0) /* || !_tips.isInteger()*/)
                            return [2 /*return*/, _callbackTransactionError(Error('_tips must a positive integer'))];
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, _callbackTransactionError(Error('request must be accepted'))];
                        }
                        if (_options.value.lt(_tips)) {
                            return [2 /*return*/, _callbackTransactionError(Error('tips declare must be lower than amount sent'))];
                        }
                        if (request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract).lt(_amount)) {
                            return [2 /*return*/, _callbackTransactionError(Error('You cannot pay more than amount needed'))];
                        }
                        method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_6 = _b.sent();
                        throw e_6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.paybackAsync = function (_requestId, _amount, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                _options = this.web3Single.setUpOptions(_options);
                _options.value = new bignumber_js_1.default(_amount);
                return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        var request, account, _a, method, e_7;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 4, , 5]);
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
                                    // TODO check if this is possible ? (quid if other tx pending)
                                    if (!this.web3Single.isHexStrictBytes32(_requestId))
                                        return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                                    // TODO use bigNumber
                                    if (_options.value.lt(0))
                                        return [2 /*return*/, reject(Error('_amount must a positive integer'))];
                                    if (request.state != Types.State.Accepted) {
                                        return [2 /*return*/, reject(Error('request must be accepted'))];
                                    }
                                    if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                                        return [2 /*return*/, reject(Error('account must be payee'))];
                                    }
                                    if (_options.value.gt(request.amountPaid)) {
                                        return [2 /*return*/, reject(Error('You cannot payback more than what has been paid'))];
                                    }
                                    method = this.instanceRequestEthereum.methods.payback(_requestId);
                                    this.web3Single.broadcastMethod(method, function (transactionHash) {
                                        // we do nothing here!
                                    }, function (receipt) {
                                        // we do nothing here!
                                    }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                                        var event, request_4;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 2];
                                                    event = this.web3Single.decodeLog(this.abiRequestCore, 'Refunded', receipt.events[0]);
                                                    return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                                case 1:
                                                    request_4 = _a.sent();
                                                    return [2 /*return*/, resolve({ request: request_4, transactionHash: receipt.transactionHash })];
                                                case 2: return [2 /*return*/];
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
                    }); })];
            });
        });
    };
    RequestEthereumService.prototype.payback = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_8;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _options.value = new bignumber_js_1.default(_amount);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
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
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        // TODO use bigNumber
                        if (_options.value.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amount must a positive integer'))];
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, _callbackTransactionError(Error('request must be accepted'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be payee'))];
                        }
                        if (_options.value.gt(request.amountPaid)) {
                            return [2 /*return*/, _callbackTransactionError(Error('You cannot payback more than what has been paid'))];
                        }
                        method = this.instanceRequestEthereum.methods.payback(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_8 = _b.sent();
                        throw e_8;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    RequestEthereumService.prototype.discountAsync = function (_requestId, _amount, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        _amount = new bignumber_js_1.default(_amount);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var request, account, _a, method, e_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
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
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        // TODO use bigNumber
                        if (_amount.lt(0))
                            return [2 /*return*/, reject(Error('_amount must a positive integer'))];
                        if (request.state == Types.State.Canceled) {
                            return [2 /*return*/, reject(Error('request must be accepted or created'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, reject(Error('account must be payee'))];
                        }
                        if (request.amountPaid.add(_amount).gt(request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract))) {
                            return [2 /*return*/, reject(Error('You cannot discount more than necessary'))];
                        }
                        method = this.instanceRequestEthereum.methods.discount(_requestId, _amount);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) { return __awaiter(_this, void 0, void 0, function () {
                            var event, request_5;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(confirmationNumber == _options.numberOfConfirmation)) return [3 /*break*/, 2];
                                        event = this.web3Single.decodeLog(this.abiRequestCore, 'AddSubtract', receipt.events[0]);
                                        return [4 /*yield*/, this.getRequestAsync(event.requestId)];
                                    case 1:
                                        request_5 = _a.sent();
                                        return [2 /*return*/, resolve({ request: request_5, transactionHash: receipt.transactionHash })];
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); }, function (error) {
                            return reject(error);
                        }, _options);
                        return [3 /*break*/, 5];
                    case 4:
                        e_9 = _b.sent();
                        return [2 /*return*/, reject(e_9)];
                    case 5: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestEthereumService.prototype.discount = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var request, account, _a, method, e_10;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _amount = new bignumber_js_1.default(_amount);
                        _options = this.web3Single.setUpOptions(_options);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 6]);
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
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        // TODO use bigNumber
                        if (_amount.lt(0))
                            return [2 /*return*/, _callbackTransactionError(Error('_amount must a positive integer'))];
                        if (request.state == Types.State.Canceled) {
                            return [2 /*return*/, _callbackTransactionError(Error('request must be accepted or created'))];
                        }
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be payee'))];
                        }
                        if (_amount.add(request.amountPaid).gt(request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract))) {
                            return [2 /*return*/, _callbackTransactionError(Error('You cannot payback more than what has been paid'))];
                        }
                        method = this.instanceRequestEthereum.methods.discount(_requestId, _amount);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [3 /*break*/, 6];
                    case 5:
                        e_10 = _b.sent();
                        throw e_10;
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
                    return resolve({ transactionHash: receipt.transactionHash });
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
    RequestEthereumService.prototype.getRequestAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            _this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                var dataResult, extensionDetails, _a, _b, _c, _d, e_11;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (err)
                                return [2 /*return*/, reject(err)];
                            dataResult = {
                                requestId: _requestId,
                                creator: data.creator,
                                payee: data.payee,
                                payer: data.payer,
                                amountInitial: new bignumber_js_1.default(data.amountInitial),
                                subContract: data.subContract,
                                amountPaid: new bignumber_js_1.default(data.amountPaid),
                                amountAdditional: new bignumber_js_1.default(data.amountAdditional),
                                amountSubtract: new bignumber_js_1.default(data.amountSubtract),
                                state: data.state,
                                extension: data.extension,
                                details: data.details,
                            };
                            if (!ServiceExtensions.getServiceFromAddress(data.extension)) return [3 /*break*/, 2];
                            return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(data.extension, this.web3Single.web3.currentProvider).getRequestAsync(_requestId)];
                        case 1:
                            extensionDetails = _e.sent();
                            dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                            _e.label = 2;
                        case 2:
                            if (!dataResult.details) return [3 /*break*/, 6];
                            _e.label = 3;
                        case 3:
                            _e.trys.push([3, 5, , 6]);
                            _a = dataResult;
                            _b = { hash: dataResult.details };
                            _d = (_c = JSON).parse;
                            return [4 /*yield*/, this.ipfs.getFileAsync(dataResult.details)];
                        case 4:
                            _a.details = (_b.data = _d.apply(_c, [_e.sent()]), _b);
                            return [3 /*break*/, 6];
                        case 5:
                            e_11 = _e.sent();
                            return [2 /*return*/, reject(e_11)];
                        case 6: return [2 /*return*/, resolve(dataResult)];
                    }
                });
            }); });
        });
    };
    RequestEthereumService.prototype.getRequest = function (_requestId, _callbackGetRequest) {
        var _this = this;
        if (!this.web3Single.isHexStrictBytes32(_requestId))
            return _callbackGetRequest(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''), undefined);
        this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
            var dataResult, extensionDetails;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (err)
                            return [2 /*return*/, _callbackGetRequest(err, data)];
                        dataResult = {
                            requestId: _requestId,
                            creator: data.creator,
                            payee: data.payee,
                            payer: data.payer,
                            amountInitial: new bignumber_js_1.default(data.amountInitial),
                            subContract: data.subContract,
                            amountPaid: new bignumber_js_1.default(data.amountPaid),
                            amountAdditional: new bignumber_js_1.default(data.amountAdditional),
                            amountSubtract: new bignumber_js_1.default(data.amountSubtract),
                            state: data.state,
                            extension: data.extension,
                            details: data.details,
                        };
                        if (!ServiceExtensions.getServiceFromAddress(data.extension)) return [3 /*break*/, 2];
                        return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(data.extension, this.web3Single.web3.currentProvider).getRequestAsync(_requestId)];
                    case 1:
                        extensionDetails = _a.sent();
                        dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                        _a.label = 2;
                    case 2:
                        if (dataResult.details) {
                            // get IPFS data :
                            this.ipfs.getFile(dataResult.details, function (err, data) {
                                if (err)
                                    return _callbackGetRequest(err, dataResult);
                                dataResult.details = { hash: dataResult, data: JSON.parse(data) };
                                return _callbackGetRequest(err, dataResult);
                            });
                        }
                        else {
                            return [2 /*return*/, _callbackGetRequest(err, dataResult)];
                        }
                        return [2 /*return*/];
                }
            });
        }); });
    };
    return RequestEthereumService;
}());
exports.default = RequestEthereumService;
//# sourceMappingURL=requestEthereum-service.js.map