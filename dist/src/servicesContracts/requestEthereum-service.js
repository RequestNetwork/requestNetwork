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
var Web3PromiEvent = require("web3-core-promievent");
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
    RequestEthereumService.prototype.createRequestAsPayee = function (_payer, _amountInitial, _data, _extension, _extensionParams, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _amountInitial = new bignumber_js_1.default(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            if (_amountInitial.lt(0))
                return promiEvent.reject(Error('_amountInitial must a positive integer'));
            if (!_this.web3Single.isAddressNoChecksum(_payer))
                return promiEvent.reject(Error('_payer must be a valid eth address'));
            if (_extension && _extension != '' && !_this.web3Single.isAddressNoChecksum(_extension))
                return promiEvent.reject(Error('_extension must be a valid eth address'));
            if (_extensionParams && _extensionParams.length > 9)
                return promiEvent.reject(Error('_extensionParams length must be less than 9'));
            if (_this.web3Single.areSameAddressesNoChecksum(account, _payer)) {
                return promiEvent.reject(Error('_from must be different than _payer'));
            }
            _this.requestCoreServices.getCollectEstimation(_amountInitial, _this.addressRequestEthereum, _extension, function (err, collectEstimation) {
                if (err)
                    return promiEvent.reject(err);
                _options.value = collectEstimation;
                // parse extension parameters
                var paramsParsed;
                if (!_extension || _extension == '') {
                    paramsParsed = _this.web3Single.arrayToBytes32(_extensionParams, 9);
                }
                else if (ServiceExtensions.getServiceFromAddress(_extension)) {
                    var parsing = ServiceExtensions.getServiceFromAddress(_extension).parseParameters(_extensionParams);
                    if (parsing.error) {
                        return promiEvent.reject(parsing.error);
                    }
                    paramsParsed = parsing.result;
                }
                else {
                    return promiEvent.reject(Error('_extension is not supported'));
                }
                _this.ipfs.addFile(_data, function (err, hash) {
                    if (err)
                        return promiEvent.reject(err);
                    var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed, hash);
                    _this.web3Single.broadcastMethod(method, function (transactionHash) {
                        return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                    }, function (receipt) {
                        // we do nothing here!
                    }, function (confirmationNumber, receipt) {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            var event_1 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'Created', receipt.events[0]);
                            _this.getRequest(event_1.requestId, function (err, request) {
                                if (err)
                                    return promiEvent.reject(err);
                                promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                            });
                        }
                    }, function (err) {
                        return promiEvent.reject(err);
                    }, _options);
                });
            });
        });
        return promiEvent.eventEmitter;
    };
    RequestEthereumService.prototype.accept = function (_requestId, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId, function (err, request) {
                if (err)
                    return promiEvent.reject(err);
                if (request.state != Types.State.Created) {
                    return promiEvent.reject(Error('request state is not \'created\''));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                    return promiEvent.reject(Error('account must be the payer'));
                }
                var method = _this.instanceRequestEthereum.methods.accept(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event_2 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'Accepted', receipt.events[0]);
                        _this.getRequest(event_2.requestId, function (err, request) {
                            if (err)
                                return promiEvent.reject(err);
                            promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                        });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            });
        });
        return promiEvent.eventEmitter;
    };
    RequestEthereumService.prototype.cancel = function (_requestId, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId, function (err, request) {
                if (err)
                    return promiEvent.reject(err);
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !_this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                    return promiEvent.reject(Error('account must be the payer or the payee'));
                }
                if (_this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created) {
                    return promiEvent.reject(Error('payer can cancel request in state \'created\''));
                }
                if (_this.web3Single.areSameAddressesNoChecksum(account, request.payee) && request.state == Types.State.Canceled) {
                    return promiEvent.reject(Error('payee cannot cancel request already canceled'));
                }
                if (request.balance != 0) {
                    return promiEvent.reject(Error('impossible to cancel a Request with a balance != 0'));
                }
                var method = _this.instanceRequestEthereum.methods.cancel(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event_3 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'Canceled', receipt.events[0]);
                        _this.getRequest(event_3.requestId, function (err, request) {
                            if (err)
                                return promiEvent.reject(err);
                            promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                        });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            });
        });
        return promiEvent.eventEmitter;
    };
    RequestEthereumService.prototype.paymentAction = function (_requestId, _amount, _additionals, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _additionals = new bignumber_js_1.default(_additionals);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new bignumber_js_1.default(_amount);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId, function (err, request) {
                if (err)
                    return promiEvent.reject(err);
                if (_options.value.lt(0))
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (_additionals.lt(0))
                    return promiEvent.reject(Error('_additionals must a positive integer'));
                if (request.state == Types.State.Canceled) {
                    return promiEvent.reject(Error('request cannot be canceled'));
                }
                var method = _this.instanceRequestEthereum.methods.paymentAction(_requestId, _additionals);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event_4 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateBalance', request.state == Types.State.Created ? receipt.events[1] : receipt.events[0]);
                        _this.getRequest(event_4.requestId, function (err, request) {
                            if (err)
                                return promiEvent.reject(err);
                            promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                        });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            });
        });
        return promiEvent.eventEmitter;
    };
    RequestEthereumService.prototype.refundAction = function (_requestId, _amount, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new bignumber_js_1.default(_amount);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId, function (err, request) {
                if (err)
                    return promiEvent.reject(err);
                if (_options.value.lt(0))
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (request.state != Types.State.Accepted) {
                    return promiEvent.reject(Error('request must be accepted'));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                    return promiEvent.reject(Error('account must be payee'));
                }
                var method = _this.instanceRequestEthereum.methods.refundAction(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event_5 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateBalance', receipt.events[0]);
                        _this.getRequest(event_5.requestId, function (err, request) {
                            if (err)
                                return promiEvent.reject(err);
                            promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                        });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            });
        });
        return promiEvent.eventEmitter;
    };
    RequestEthereumService.prototype.subtractAction = function (_requestId, _amount, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new bignumber_js_1.default(_amount);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId, function (err, request) {
                if (err)
                    return promiEvent.reject(err);
                if (_amount.lt(0))
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (request.state == Types.State.Canceled) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                    return promiEvent.reject(Error('account must be payee'));
                }
                var method = _this.instanceRequestEthereum.methods.subtractAction(_requestId, _amount);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event_6 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateExpectedAmoun', receipt.events[0]);
                        _this.getRequest(event_6.requestId, function (err, request) {
                            if (err)
                                return promiEvent.reject(err);
                            promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                        });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            });
        });
        return promiEvent.eventEmitter;
    };
    RequestEthereumService.prototype.additionalAction = function (_requestId, _amount, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new bignumber_js_1.default(_amount);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId, function (err, request) {
                if (err)
                    return promiEvent.reject(err);
                if (_amount.lt(0))
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (request.state == Types.State.Canceled) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                    return promiEvent.reject(Error('account must be payer'));
                }
                var method = _this.instanceRequestEthereum.methods.additionalAction(_requestId, _amount);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event_7 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateExpectedAmoun', receipt.events[0]);
                        _this.getRequest(event_7.requestId, function (err, request) {
                            if (err)
                                return promiEvent.reject(err);
                            promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                        });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            });
        });
        return promiEvent.eventEmitter;
    };
    RequestEthereumService.prototype.withdraw = function (_options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccount(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            var method = _this.instanceRequestEthereum.methods.withdraw();
            _this.web3Single.broadcastMethod(method, function (transactionHash) {
                return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
            }, function (receipt) {
                // we do nothing here!
            }, function (confirmationNumber, receipt) {
                if (confirmationNumber == _options.numberOfConfirmation) {
                    return promiEvent.resolve({ transactionHash: receipt.transactionHash });
                }
            }, function (error) {
                return promiEvent.reject(error);
            }, _options);
        });
        return promiEvent.eventEmitter;
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
    // public getRequestAsync(
    //     _requestId: string): Promise < any > {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let dataResult = await this.requestCoreServices.getRequestAsync(_requestId);
    //             return resolve(dataResult);
    //         } catch(e) {
    //             return reject(e);
    //         }
    //     });
    // }
    RequestEthereumService.prototype.getRequest = function (_requestId, _callbackGetRequest) {
        this.requestCoreServices.getRequest(_requestId, _callbackGetRequest);
    };
    RequestEthereumService.prototype.getRequestHistory = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.instanceRequestEthereum.getPastEvents('allEvents', {
                    // allEvents and filter don't work together so far. issues created on web3 github
                    // filter: {requestId: _requestId}, 
                    fromBlock: requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                    toBlock: 'latest'
                })
                    .then(function (events) {
                    // waiting for filter working (see above)
                    return resolve(events.filter(function (e) { return e.returnValues.requestId == _requestId; })
                        .map(function (e) {
                        return {
                            _meta: {
                                logIndex: e.logIndex,
                                blockNumber: e.blockNumber,
                            },
                            name: e.event,
                            data: e.returnValues
                        };
                    }));
                }).catch(function (err) {
                    return reject(err);
                });
                return [2 /*return*/];
            });
        }); });
    };
    return RequestEthereumService;
}());
exports.default = RequestEthereumService;
//# sourceMappingURL=requestEthereum-service.js.map