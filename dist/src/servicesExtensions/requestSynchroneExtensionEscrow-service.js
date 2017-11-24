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
var Types = require("../types");
var artifacts_1 = require("../artifacts");
var bignumber_js_1 = require("bignumber.js");
var ServicesContracts = require("../servicesContracts");
var requestCore_Artifact = artifacts_1.default.RequestCoreArtifact;
var requestSynchroneExtensionEscrow_Artifact = artifacts_1.default.RequestSynchroneExtensionEscrowArtifact;
var web3_single_1 = require("../servicesExternal/web3-single");
var RequestSynchroneExtensionEscrowService = /** @class */ (function () {
    function RequestSynchroneExtensionEscrowService(web3Provider) {
        this.web3Single = new web3_single_1.Web3Single(web3Provider);
        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config_1.default.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
        this.abiSynchroneExtensionEscrow = requestSynchroneExtensionEscrow_Artifact.abi;
        this.addressSynchroneExtensionEscrow = config_1.default.ethereum.contracts.requestSynchroneExtensionEscrow;
        this.instanceSynchroneExtensionEscrow = new this.web3Single.web3.eth.Contract(this.abiSynchroneExtensionEscrow, this.addressSynchroneExtensionEscrow);
    }
    RequestSynchroneExtensionEscrowService.prototype.parseParameters = function (_extensionParams) {
        if (!this.web3Single.isAddressNoChecksum(_extensionParams[0])) {
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
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayeeAsync = function (_requestId, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var account, _a, request, method;
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
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestSubContractAsync(_requestId)];
                    case 3:
                        request = _b.sent();
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer) && account != request.extension.escrow) {
                            return [2 /*return*/, reject(Error('account must be payer or escrow'))];
                        }
                        if (request.extension.state != Types.EscrowState.Created) {
                            return [2 /*return*/, reject(Error('Escrow state must be \'Created\''))];
                        }
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, reject(Error('State must be \'Accepted\''))];
                        }
                        method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) {
                            if (confirmationNumber == _options.numberOfConfirmation) {
                                // check in case of failed : no event
                                return resolve({ requestId: receipt.events.EscrowReleaseRequest.returnValues.requestId, transactionHash: receipt.transactionHash });
                            }
                        }, function (error) {
                            return reject(error);
                        }, _options);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayee = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var account, _a, request, method;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        account = _a;
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestSubContractAsync(_requestId)];
                    case 3:
                        request = _b.sent();
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be payer or escrow'))];
                        }
                        if (request.extension.state != Types.EscrowState.Created) {
                            return [2 /*return*/, _callbackTransactionError(Error('Escrow state must be \'Created\''))];
                        }
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, _callbackTransactionError(Error('State must be \'Accepted\''))];
                        }
                        method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [2 /*return*/];
                }
            });
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.refundToPayerAsync = function (_requestId, _options) {
        var _this = this;
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var account, _a, request, method;
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
                        // TODO check from == payee or escrow ?
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestSubContractAsync(_requestId)];
                    case 3:
                        request = _b.sent();
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee) && !this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
                            return [2 /*return*/, reject(Error('account must be payee or escrow'))];
                        }
                        if (request.extension.state != Types.EscrowState.Created) {
                            return [2 /*return*/, reject(Error('Escrow state must be \'Created\''))];
                        }
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, reject(Error('State must be \'Accepted\''))];
                        }
                        method = this.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);
                        this.web3Single.broadcastMethod(method, function (transactionHash) {
                            // we do nothing here!
                        }, function (receipt) {
                            // we do nothing here!
                        }, function (confirmationNumber, receipt) {
                            if (confirmationNumber == _options.numberOfConfirmation) {
                                var event = _this.web3Single.decodeLog(_this.abiRequestCore, 'EscrowRefundRequest', receipt.events[0]);
                                return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                            }
                        }, function (error) {
                            return reject(error);
                        }, _options);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    RequestSynchroneExtensionEscrowService.prototype.refundToPayer = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options) {
        return __awaiter(this, void 0, void 0, function () {
            var account, _a, request, method;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _options = this.web3Single.setUpOptions(_options);
                        _a = _options.from;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.web3Single.getDefaultAccount()];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        account = _a;
                        // TODO check from == payee or escrow ?
                        // TODO check if this is possible ? (quid if other tx pending)
                        if (!this.web3Single.isHexStrictBytes32(_requestId))
                            return [2 /*return*/, _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''))];
                        return [4 /*yield*/, this.getRequestSubContractAsync(_requestId)];
                    case 3:
                        request = _b.sent();
                        if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee) && !this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
                            return [2 /*return*/, _callbackTransactionError(Error('account must be payee or escrow'))];
                        }
                        if (request.extension.state != Types.EscrowState.Created) {
                            return [2 /*return*/, _callbackTransactionError(Error('Escrow state must be \'Created\''))];
                        }
                        if (request.state != Types.State.Accepted) {
                            return [2 /*return*/, _callbackTransactionError(Error('State must be \'Accepted\''))];
                        }
                        method = this.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);
                        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _options);
                        return [2 /*return*/];
                }
            });
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequestAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            _this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
                if (err)
                    return reject(err);
                var dataResult = {
                    subContract: data.subContract,
                    escrow: data.escrow,
                    state: data.state,
                    amountPaid: new bignumber_js_1.default(data.amountPaid),
                    amountRefunded: new bignumber_js_1.default(data.amountRefunded)
                };
                return resolve(dataResult);
            });
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequest = function (_requestId, _callbackGetRequest) {
        if (!this.web3Single.isHexStrictBytes32(_requestId))
            throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');
        this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
            if (err)
                return _callbackGetRequest(err, data);
            var dataResult = {
                subContract: data.subContract,
                escrow: data.escrow,
                state: data.state,
                amountPaid: new bignumber_js_1.default(data.amountPaid),
                amountRefunded: new bignumber_js_1.default(data.amountRefunded)
            };
            return _callbackGetRequest(err, dataResult);
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequestSubContractAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            _this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
                if (err)
                    return reject(err);
                ServicesContracts.getServiceFromAddress(data.subContract, _this.web3Single.web3.currentProvider).getRequest(_requestId, function (err, data) {
                    if (err)
                        return reject(err);
                    return resolve(data);
                });
            });
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequestSubContract = function (_requestId, _callbackGetRequest) {
        var _this = this;
        if (!this.web3Single.isHexStrictBytes32(_requestId))
            throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');
        this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
            if (err)
                return _callbackGetRequest(err, data);
            ServicesContracts.getServiceFromAddress(data.subContract, _this.web3Single.web3.currentProvider).getRequest(_requestId, _callbackGetRequest);
        });
    };
    RequestSynchroneExtensionEscrowService._instance = new RequestSynchroneExtensionEscrowService();
    return RequestSynchroneExtensionEscrowService;
}());
exports.default = RequestSynchroneExtensionEscrowService;
//# sourceMappingURL=requestSynchroneExtensionEscrow-service.js.map