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
// @ts-ignore
var Web3PromiEvent = require("web3-core-promievent");
var Types = require("../types");
var web3_single_1 = require("../servicesExternal/web3-single");
var requestCoreArtifact = artifacts_1.default.requestCoreArtifact;
var requestSynchroneExtensionEscrowArtifact = artifacts_1.default.requestSynchroneExtensionEscrowArtifact;
var BN = web3_single_1.Web3Single.BN();
/**
 * The RequestSynchroneExtensionEscrowService class is the interface for the Request Escrow extension
 */
var RequestSynchroneExtensionEscrowService = /** @class */ (function () {
    /**
     * constructor to Instantiates a new RequestSynchroneExtensionEscrowService
     */
    function RequestSynchroneExtensionEscrowService() {
        this.web3Single = web3_single_1.Web3Single.getInstance();
        this.abiRequestCore = requestCoreArtifact.abi;
        this.requestCoreServices = new requestCore_service_1.default();
        var networkName = this.web3Single.networkName;
        this.abiSynchroneExtensionEscrow = requestSynchroneExtensionEscrowArtifact.abi;
        if (!requestSynchroneExtensionEscrowArtifact.networks[networkName]) {
            throw Error('Escrow Artifact no configuration for network: ' + networkName);
        }
        this.addressSynchroneExtensionEscrow = requestSynchroneExtensionEscrowArtifact.networks[networkName].address;
        this.instanceSynchroneExtensionEscrow = new this.web3Single.web3.eth.Contract(this.abiSynchroneExtensionEscrow, this.addressSynchroneExtensionEscrow);
    }
    /**
     * parse extension parameters (generic method)
     * @param   _extensionParams    array of parameters for the extension (optional)
     * @return  return object with array of the parsed parameters
     */
    RequestSynchroneExtensionEscrowService.prototype.parseParameters = function (_extensionParams) {
        if (!_extensionParams || !this.web3Single.isAddressNoChecksum(_extensionParams[0])) {
            return { error: Error('first parameter must be a valid eth address') };
        }
        var ret = [];
        // parse escrow
        ret.push(this.web3Single.toSolidityBytes32('address', _extensionParams[0]));
        for (var i = 1; i < 9; i++) {
            ret.push(this.web3Single.toSolidityBytes32('bytes32', 0));
        }
        return { result: ret };
    };
    /**
     * release payment to Payee as payer or escrow
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the request
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayeeAction = function (_requestId, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (err)
                    return promiEvent.reject(err);
                if (!request.extension) {
                    return promiEvent.reject(Error('request doesn\'t have an extension'));
                }
                if (request.extension.address.toLowerCase() !== _this.addressSynchroneExtensionEscrow.toLowerCase()) {
                    return promiEvent.reject(Error('request\'s extension is not sync. escrow'));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payer)
                    && account !== request.extension.escrow) {
                    return promiEvent.reject(Error('account must be payer or escrow'));
                }
                if (request.extension.state !== Types.EscrowState.Created) {
                    return promiEvent.reject(Error('Escrow state must be \'Created\''));
                }
                if (request.state !== Types.State.Accepted) {
                    return promiEvent.reject(Error('State must be \'Accepted\''));
                }
                var method = _this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var event_1 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'EscrowReleaseRequest', receipt.events[0]);
                        _this.getRequest(event_1.requestId).then(function (requestAfter) {
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
     * release payment to payer as payee or escrow
     * @dev emit the event 'broadcasted' with {transactionHash} when the transaction is submitted
     * @param   _requestId         requestId of the request
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayerAction = function (_requestId, _options) {
        var _this = this;
        var promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        this.web3Single.getDefaultAccountCallback(function (err, defaultAccount) {
            if (!_options.from && err)
                return promiEvent.reject(err);
            var account = _options.from || defaultAccount;
            _this.getRequest(_requestId).then(function (request) {
                if (!request.extension) {
                    return promiEvent.reject(Error('request doesn\'t have an extension'));
                }
                if (request.extension.address.toLowerCase() !== _this.addressSynchroneExtensionEscrow.toLowerCase()) {
                    return promiEvent.reject(Error('request\'s extension is not sync. escrow'));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payee)
                    && !_this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
                    return promiEvent.reject(Error('account must be payee or escrow'));
                }
                if (request.extension.state !== Types.EscrowState.Created) {
                    return promiEvent.reject(Error('Escrow state must be \'Created\''));
                }
                if (request.state !== Types.State.Accepted) {
                    return promiEvent.reject(Error('State must be \'Accepted\''));
                }
                var method = _this.instanceSynchroneExtensionEscrow.methods.releaseToPayerAction(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber === _options.numberOfConfirmation) {
                        var event_2 = _this.web3Single.decodeEvent(_this.abiRequestCore, 'EscrowRefundRequest', receipt.events[0]);
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
     * alias of requestCoreServices.getRequest()
     */
    RequestSynchroneExtensionEscrowService.prototype.getRequest = function (_requestId) {
        return this.requestCoreServices.getRequest(_requestId);
    };
    /**
     * Get info from extension contract (generic method)
     * @param   _requestId    requestId of the request
     * @return  promise of the object containing the information from the extension contract of the request
     */
    RequestSynchroneExtensionEscrowService.prototype.getRequestExtensionInfo = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isHexStrictBytes32(_requestId)) {
                return reject(Error('_requestId must be a 32 bytes hex string'));
            }
            _this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
                if (err)
                    return reject(err);
                return resolve({
                    balance: new BN(data.balance),
                    currencyContract: data.currencyContract,
                    escrow: data.escrow,
                    state: data.state
                });
            });
        });
    };
    /**
     * alias of requestCoreServices.getRequestEvents()
     */
    RequestSynchroneExtensionEscrowService.prototype.getRequestEvents = function (_requestId, _fromBlock, _toBlock) {
        return this.requestCoreServices.getRequestEvents(_requestId, _fromBlock, _toBlock);
    };
    /**
     * Get request events from extension contract (generic method)
     * @param   _requestId    requestId of the request
     * @param   _fromBlock    search events from this block (optional)
     * @param   _toBlock        search events until this block (optional)
     * @return  promise of the object containing the events from the extension contract of the request (always {} here)
     */
    RequestSynchroneExtensionEscrowService.prototype.getRequestEventsExtensionInfo = function (_requestId, _fromBlock, _toBlock) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var optionFilters, getPastEvents, events, _a, _b, _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        optionFilters = {
                            filter: { requestId: _requestId },
                            fromBlock: requestSynchroneExtensionEscrowArtifact.networks[this.web3Single.networkName].blockNumber,
                            toBlock: 'latest'
                        };
                        getPastEvents = this.instanceSynchroneExtensionEscrow.getPastEvents;
                        events = [];
                        _b = (_a = events).concat;
                        return [4 /*yield*/, getPastEvents('EscrowPayment', optionFilters)];
                    case 1:
                        events = _b.apply(_a, [_h.sent()]);
                        _d = (_c = events).concat;
                        return [4 /*yield*/, getPastEvents('EscrowReleaseRequest', optionFilters)];
                    case 2:
                        events = _d.apply(_c, [_h.sent()]);
                        _f = (_e = events).concat;
                        return [4 /*yield*/, getPastEvents('EscrowRefundRequest', optionFilters)];
                    case 3:
                        events = _f.apply(_e, [_h.sent()]);
                        _g = resolve;
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
                    case 4: return [2 /*return*/, _g.apply(void 0, [_h.sent()])];
                }
            });
        }); });
    };
    return RequestSynchroneExtensionEscrowService;
}());
exports.default = RequestSynchroneExtensionEscrowService;
//# sourceMappingURL=requestSynchroneExtensionEscrow-service.js.map