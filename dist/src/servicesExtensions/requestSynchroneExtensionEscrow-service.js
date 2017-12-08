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
var Types = require("../types");
var artifacts_1 = require("../artifacts");
var bignumber_js_1 = require("bignumber.js");
var Web3PromiEvent = require("web3-core-promievent");
// import * as ServicesContracts from '../servicesContracts';
var requestCore_service_1 = require("../servicesCore/requestCore-service");
var requestCore_Artifact = artifacts_1.default.RequestCoreArtifact;
var requestSynchroneExtensionEscrow_Artifact = artifacts_1.default.RequestSynchroneExtensionEscrowArtifact;
var web3_single_1 = require("../servicesExternal/web3-single");
var RequestSynchroneExtensionEscrowService = /** @class */ (function () {
    function RequestSynchroneExtensionEscrowService() {
        this.web3Single = web3_single_1.Web3Single.getInstance();
        this.abiRequestCore = requestCore_Artifact.abi;
        this.requestCoreServices = new requestCore_service_1.default();
        this.abiSynchroneExtensionEscrow = requestSynchroneExtensionEscrow_Artifact.abi;
        if (!requestSynchroneExtensionEscrow_Artifact.networks[this.web3Single.networkName]) {
            throw Error('requestSynchroneExtensionEscrow Artifact does not have configuration for network : "' + this.web3Single.networkName + '"');
        }
        this.addressSynchroneExtensionEscrow = requestSynchroneExtensionEscrow_Artifact.networks[this.web3Single.networkName].address;
        this.instanceSynchroneExtensionEscrow = new this.web3Single.web3.eth.Contract(this.abiSynchroneExtensionEscrow, this.addressSynchroneExtensionEscrow);
    }
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
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayeeAction = function (_requestId, _options) {
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
                if (!request.extension) {
                    return promiEvent.reject(Error('request doesn\'t have an extension'));
                }
                if (request.extension.address.toLowerCase() != _this.addressSynchroneExtensionEscrow.toLowerCase()) {
                    return promiEvent.reject(Error('request\'s extension is not sync. escrow'));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payer) && account != request.extension.escrow) {
                    return promiEvent.reject(Error('account must be payer or escrow'));
                }
                if (request.extension.state != Types.EscrowState.Created) {
                    return promiEvent.reject(Error('Escrow state must be \'Created\''));
                }
                if (request.state != Types.State.Accepted) {
                    return promiEvent.reject(Error('State must be \'Accepted\''));
                }
                var method = _this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event = _this.web3Single.decodeEvent(_this.abiRequestCore, 'EscrowReleaseRequest', receipt.events[0]);
                        _this.getRequest(_requestId, function (err, request) {
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
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayerAction = function (_requestId, _options) {
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
                if (!request.extension) {
                    return promiEvent.reject(Error('request doesn\'t have an extension'));
                }
                if (request.extension.address.toLowerCase() != _this.addressSynchroneExtensionEscrow.toLowerCase()) {
                    return promiEvent.reject(Error('request\'s extension is not sync. escrow'));
                }
                if (!_this.web3Single.areSameAddressesNoChecksum(account, request.payee) && !_this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
                    return promiEvent.reject(Error('account must be payee or escrow'));
                }
                if (request.extension.state != Types.EscrowState.Created) {
                    return promiEvent.reject(Error('Escrow state must be \'Created\''));
                }
                if (request.state != Types.State.Accepted) {
                    return promiEvent.reject(Error('State must be \'Accepted\''));
                }
                var method = _this.instanceSynchroneExtensionEscrow.methods.releaseToPayerAction(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    return promiEvent.eventEmitter.emit('broadcasted', { transactionHash: transactionHash });
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event = _this.web3Single.decodeEvent(_this.abiRequestCore, 'EscrowRefundRequest', receipt.events[0]);
                        _this.getRequest(_requestId, function (err, request) {
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
    RequestSynchroneExtensionEscrowService.prototype.getRequestAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var dataResult, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.requestCoreServices.getRequestAsync(_requestId)];
                    case 1:
                        dataResult = _a.sent();
                        return [2 /*return*/, resolve(dataResult)];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, reject(e_1)];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequest = function (_requestId, _callbackGetRequest) {
        this.requestCoreServices.getRequest(_requestId, _callbackGetRequest);
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequestExtensionInfoAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            _this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
                if (err)
                    return reject(err);
                var dataResult = {
                    currencyContract: data.currencyContract,
                    escrow: data.escrow,
                    state: data.state,
                    balance: new bignumber_js_1.default(data.balance)
                };
                return resolve(dataResult);
            });
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequestExtensionInfo = function (_requestId, _callbackGetRequest) {
        if (!this.web3Single.isHexStrictBytes32(_requestId))
            throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');
        this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
            if (err)
                return _callbackGetRequest(err, data);
            var dataResult = {
                currencyContract: data.currencyContract,
                escrow: data.escrow,
                state: data.state,
                balance: new bignumber_js_1.default(data.balance)
            };
            return _callbackGetRequest(err, dataResult);
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequestHistory = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.instanceSynchroneExtensionEscrow.getPastEvents('allEvents', {
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
    return RequestSynchroneExtensionEscrowService;
}());
exports.default = RequestSynchroneExtensionEscrowService;
//# sourceMappingURL=requestSynchroneExtensionEscrow-service.js.map