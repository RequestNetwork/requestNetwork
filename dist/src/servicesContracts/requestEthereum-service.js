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
var artifacts_1 = require("../artifacts");
var requestCore_service_1 = require("../servicesCore/requestCore-service");
var ipfs_service_1 = require("../servicesExternal/ipfs-service");
var web3_single_1 = require("../servicesExternal/web3-single");
var ServiceExtensions = require("../servicesExtensions");
var Types = require("../types");
var Web3PromiEvent = require("web3-core-promievent");
var requestEthereumArtifact = artifacts_1.default.requestEthereumArtifact;
var requestCoreArtifact = artifacts_1.default.requestCoreArtifact;
var BN = web3_single_1.Web3Single.BN();
/**
 * The RequestEthereumService class is the interface for the Request Ethereum currency contract
 */
var RequestEthereumService = /** @class */ (function () {
    /**
     * constructor to Instantiates a new RequestEthereumService
     */
    function RequestEthereumService() {
        this.web3Single = web3_single_1.Web3Single.getInstance();
        this.ipfs = ipfs_service_1.default.getInstance();
        this.abiRequestCore = requestCoreArtifact.abi;
        this.requestCoreServices = new requestCore_service_1.default();
        this.abiRequestEthereum = requestEthereumArtifact.abi;
        if (!requestEthereumArtifact.networks[this.web3Single.networkName]) {
            throw Error('RequestEthereum Artifact: no config for network : "' + this.web3Single.networkName + '"');
        }
        this.addressRequestEthereum = requestEthereumArtifact.networks[this.web3Single.networkName].address;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }
    /**
     * create a request as payee
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _payer             address of the payer
     * @param   _amountInitial     amount initial expected of the request
     * @param   _data              Json of the request's details (optional)
     * @param   _extension         address of the extension contract of the request (optional)
     * @param   _extensionParams   array of parameters for the extension (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestEthereumService.prototype.createRequestAsPayee = function (_payer, _amountInitial, _data, _extension, _extensionParams, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _amountInitial = new BN(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            if (_amountInitial.isNeg())
                return promiEvent.reject(Error('_amountInitial must a positive integer'));
            if (!_this.web3Single.isAddressNoChecksum(_payer)) {
                return promiEvent.reject(Error('_payer must be a valid eth address'));
            }
            if (_extension && _extension !== '' && !_this.web3Single.isAddressNoChecksum(_extension)) {
                return promiEvent.reject(Error('_extension must be a valid eth address'));
            }
            if (_extensionParams && _extensionParams.length > 9) {
                return promiEvent.reject(Error('_extensionParams length must be less than 9'));
            }
            if (_this.web3Single.areSameAddressesNoChecksum(account, _payer)) {
                return promiEvent.reject(Error('_from must be different than _payer'));
            }
            // get the amount to collect
            _this.requestCoreServices.getCollectEstimation(_amountInitial, _this.addressRequestEthereum, _extension).then(function (collectEstimation) {
                _options.value = collectEstimation;
                // parse extension parameters
                var paramsParsed;
                if (!_extension || _extension === '') {
                    paramsParsed = _this.web3Single.arrayToBytes32(_extensionParams, 9);
                }
                else if (ServiceExtensions.getServiceFromAddress(_extension)) {
                    var parsing = ServiceExtensions.getServiceFromAddress(_extension)
                        .parseParameters(_extensionParams);
                    if (parsing.error) {
                        return promiEvent.reject(parsing.error);
                    }
                    paramsParsed = parsing.result;
                }
                else {
                    return promiEvent.reject(Error('_extension is not supported'));
                }
                // add file to ipfs
                _this.ipfs.addFile(_data).then(function (hash) {
                    if (err)
                        return promiEvent.reject(err);
                    var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed, hash);
                    // submit transaction
                    _this.web3Single.broadcastMethod(method, function (transactionHash) {
                        return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                    }, function (receipt) {
                        // we do nothing here!
                    }, function (confirmationNumber, receipt) {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            var eventRaw = receipt.events[0];
                            var event_1 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'Created', eventRaw);
                            _this.getRequest(event_1.requestId).then(function (request) {
                                promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash });
                            }).catch(function (e) { return promiEvent.reject(e); });
                        }
                    }, function (errBroadcast) {
                        return promiEvent.reject(errBroadcast);
                    }, _options);
                }).catch(function (e) { return promiEvent.reject(e); });
            }).catch(function (e) { return promiEvent.reject(e); });
        });
        return promiEvent.eventEmitter;
    };
    /**
     * accept a request as payer
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestEthereumService.prototype.accept = function (_requestId, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (request.state !== Types.State.Created) {
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
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var eventRaw = receipt.events[0];
                        var event_2 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'Accepted', eventRaw);
                        _this.getRequest(event_2.requestId).then(function (requestAfter) {
                            promiEvent.resolve({ request: requestAfter, transactionHash: receipt.transactionHash });
                        }).catch(function (e) { return promiEvent.reject(e); });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            }).catch(function (e) { return promiEvent.reject(e); });
        });
        return promiEvent.eventEmitter;
    };
    /**
     * cancel a request as payer or payee
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestEthereumService.prototype.cancel = function (_requestId, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payer)
                    && !_this.web3Single.areSameAddressesNoChecksum(account, request.payee)) {
                    return promiEvent.reject(Error('account must be the payer or the payee'));
                }
                if (_this.web3Single.areSameAddressesNoChecksum(account, request.payer)
                    && request.state !== Types.State.Created) {
                    return promiEvent.reject(Error('payer can cancel request in state \'created\''));
                }
                if (_this.web3Single.areSameAddressesNoChecksum(account, request.payee)
                    && request.state === Types.State.Canceled) {
                    return promiEvent.reject(Error('payee cannot cancel request already canceled'));
                }
                if (!request.balance.isZero()) {
                    return promiEvent.reject(Error('impossible to cancel a Request with a balance !== 0'));
                }
                var method = _this.instanceRequestEthereum.methods.cancel(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var eventRaw = receipt.events[0];
                        var event_3 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'Canceled', eventRaw);
                        _this.getRequest(event_3.requestId).then(function (requestAfter) {
                            promiEvent.resolve({ request: requestAfter, transactionHash: receipt.transactionHash });
                        }).catch(function (e) { return promiEvent.reject(e); });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            }).catch(function (e) { return promiEvent.reject(e); });
        });
        return promiEvent.eventEmitter;
    };
    /**
     * pay a request
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            amount to pay in wei
     * @param   _additionals       additional to declaire in wei (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestEthereumService.prototype.paymentAction = function (_requestId, _amount, _additionals, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _additionals = new BN(_additionals);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BN(_amount);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (_options.value.isNeg())
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (_additionals.isNeg())
                    return promiEvent.reject(Error('_additionals must a positive integer'));
                if (request.state === Types.State.Canceled) {
                    return promiEvent.reject(Error('request cannot be canceled'));
                }
                if (request.state === Types.State.Created
                    && !_this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                    return promiEvent.reject(Error('account must be payer if the request is created'));
                }
                if (_additionals.gt(0) && !_this.web3Single.areSameAddressesNoChecksum(account, request.payer)) {
                    return promiEvent.reject(Error('only payer can add additionals'));
                }
                var method = _this.instanceRequestEthereum.methods.paymentAction(_requestId, _additionals);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var event_4 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateBalance', request.state === Types.State.Created ? receipt.events[1] : receipt.events[0]);
                        _this.getRequest(event_4.requestId).then(function (requestAfter) {
                            promiEvent.resolve({ request: requestAfter, transactionHash: receipt.transactionHash });
                        }).catch(function (e) { return promiEvent.reject(e); });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            }).catch(function (e) { return promiEvent.reject(e); });
        });
        return promiEvent.eventEmitter;
    };
    /**
     * refund a request as payee
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            amount to refund in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestEthereumService.prototype.refundAction = function (_requestId, _amount, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BN(_amount);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (_options.value.isNeg())
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (request.state !== Types.State.Accepted) {
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
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var event_5 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateBalance', receipt.events[0]);
                        _this.getRequest(event_5.requestId).then(function (requestAfter) {
                            promiEvent.resolve({ request: requestAfter, transactionHash: receipt.transactionHash });
                        }).catch(function (e) { return promiEvent.reject(e); });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            }).catch(function (e) { return promiEvent.reject(e); });
        });
        return promiEvent.eventEmitter;
    };
    /**
     * add subtracts to a request as payee
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            subtract to declare in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestEthereumService.prototype.subtractAction = function (_requestId, _amount, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BN(_amount);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (_amount.isNeg())
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (_amount.gt(request.expectedAmount)) {
                    return promiEvent.reject(Error('_amount must be equal or lower than amount expected'));
                }
                if (request.state === Types.State.Canceled) {
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
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var event_6 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateExpectedAmount', receipt.events[0]);
                        _this.getRequest(event_6.requestId).then(function (requestAfter) {
                            promiEvent.resolve({ request: requestAfter, transactionHash: receipt.transactionHash });
                        }).catch(function (e) { return promiEvent.reject(e); });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            }).catch(function (e) { return promiEvent.reject(e); });
        });
        return promiEvent.eventEmitter;
    };
    /**
     * add addtionals to a request as payer
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            subtract to declare in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestEthereumService.prototype.additionalAction = function (_requestId, _amount, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BN(_amount);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (_amount.isNeg())
                    return promiEvent.reject(Error('_amount must a positive integer'));
                if (request.state === Types.State.Canceled) {
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
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var eventRaw = receipt.events[0];
                        var event_7 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'UpdateExpectedAmount', eventRaw);
                        _this.getRequest(event_7.requestId).then(function (requestAfter) {
                            promiEvent.resolve({ request: requestAfter, transactionHash: receipt.transactionHash });
                        }).catch(function (e) { return promiEvent.reject(e); });
                    }
                }, function (error) {
                    return promiEvent.reject(error);
                }, _options);
            }).catch(function (e) { return promiEvent.reject(e); });
        });
        return promiEvent.eventEmitter;
    };
    /**
     * Get info from currency contract (generic method)
     * @dev return {} always
     * @param   _requestId    requestId of the request
     * @return  promise of the information from the currency contract of the request (always {} here)
     */
    RequestEthereumService.prototype.getRequestCurrencyContractInfo = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, resolve({})];
            });
        }); });
    };
    /**
     * alias of requestCoreServices.getRequest()
     */
    RequestEthereumService.prototype.getRequest = function (_requestId) {
        return this.requestCoreServices.getRequest(_requestId);
    };
    /**
     * alias of requestCoreServices.getRequestEvents()
     */
    RequestEthereumService.prototype.getRequestEvents = function (_requestId, _fromBlock, _toBlock) {
        return this.requestCoreServices.getRequestEvents(_requestId, _fromBlock, _toBlock);
    };
    /**
     * Get request events from currency contract (generic method)
     * @param   _requestId    requestId of the request
     * @param   _fromBlock    search events from this block (optional)
     * @param   _toBlock    search events until this block (optional)
     * @return  promise of the object containing the events from the currency contract of the request (always {} here)
     */
    RequestEthereumService.prototype.getRequestEventsCurrencyContractInfo = function (_requestId, _fromBlock, _toBlock) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var optionFilters, events, _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        optionFilters = {
                            filter: { requestId: _requestId },
                            fromBlock: requestEthereumArtifact.networks[this.web3Single.networkName].blockNumber,
                            toBlock: 'latest'
                        };
                        events = [];
                        _b = (_a = events).concat;
                        return [4 /*yield*/, this.instanceRequestEthereum.getPastEvents('EtherAvailableToWithdraw', optionFilters)];
                    case 1:
                        events = _b.apply(_a, [_d.sent()]);
                        _c = resolve;
                        return [4 /*yield*/, Promise.all(events.map(function (e) { return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, new Promise(function (resolveEvent, rejectEvent) { return __awaiter(_this, void 0, void 0, function () {
                                            var _a, _b, _c;
                                            return __generator(this, function (_d) {
                                                switch (_d.label) {
                                                    case 0:
                                                        _a = resolveEvent;
                                                        _b = {};
                                                        _c = {
                                                            blockNumber: e.blockNumber,
                                                            logIndex: e.logIndex
                                                        };
                                                        return [4 /*yield*/, this.web3Single.getBlockTimestamp(e.blockNumber)];
                                                    case 1:
                                                        _a.apply(void 0, [(_b._meta = (_c.timestamp = _d.sent(),
                                                                _c),
                                                                _b.data = e.returnValues,
                                                                _b.name = e.event,
                                                                _b)]);
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); })];
                                });
                            }); }))];
                    case 2: return [2 /*return*/, _c.apply(void 0, [_d.sent()])];
                }
            });
        }); });
    };
    return RequestEthereumService;
}());
exports.default = RequestEthereumService;
//# sourceMappingURL=requestEthereum-service.js.map