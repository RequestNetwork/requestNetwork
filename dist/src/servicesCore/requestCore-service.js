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
var artifacts_1 = require("../artifacts");
var ServicesContracts = require("../servicesContracts");
var ServiceExtensions = require("../servicesExtensions");
var requestEthereum_Artifact = artifacts_1.default.RequestEthereumArtifact;
var requestCore_Artifact = artifacts_1.default.RequestCoreArtifact;
var web3_single_1 = require("../servicesExternal/web3-single");
var ipfs_service_1 = require("../servicesExternal/ipfs-service");
var RequestCoreService = /** @class */ (function () {
    function RequestCoreService(web3Provider) {
        this.web3Single = new web3_single_1.Web3Single(web3Provider);
        this.ipfs = ipfs_service_1.default.getInstance();
        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config_1.default.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
    }
    RequestCoreService.prototype.getCurrentNumRequest = function (_callback) {
        var _this = this;
        this.instanceRequestCore.methods.numRequests().call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, _callback(err, data)];
            });
        }); });
    };
    RequestCoreService.prototype.getCurrentNumRequestAsync = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.instanceRequestCore.methods.numRequests().call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (err)
                        return [2 /*return*/, reject(err)];
                    return [2 /*return*/, resolve(data)];
                });
            }); });
        });
    };
    RequestCoreService.prototype.getVersion = function (_callback) {
        var _this = this;
        this.instanceRequestCore.methods.VERSION().call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, _callback(err, data)];
            });
        }); });
    };
    RequestCoreService.prototype.getVersionAsync = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.instanceRequestCore.methods.VERSION().call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (err)
                        return [2 /*return*/, reject(err)];
                    return [2 /*return*/, resolve(data)];
                });
            }); });
        });
    };
    RequestCoreService.prototype.getCollectEstimationAsync = function (_expectedAmount, _currencyContract, _extension) {
        var _this = this;
        _expectedAmount = new bignumber_js_1.default(_expectedAmount);
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isAddressNoChecksum(_currencyContract))
                return reject(Error('_currencyContract must be a valid eth address'));
            if (_extension && _extension != '' && !_this.web3Single.isAddressNoChecksum(_extension))
                return reject(Error('_extension must be a valid eth address'));
            _this.instanceRequestCore.methods.getCollectEstimation(_expectedAmount, _currencyContract, _extension).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (err)
                        return [2 /*return*/, reject(err)];
                    return [2 /*return*/, resolve(data)];
                });
            }); });
        });
    };
    RequestCoreService.prototype.getCollectEstimation = function (_expectedAmount, _currencyContract, _extension, _callback) {
        var _this = this;
        _expectedAmount = new bignumber_js_1.default(_expectedAmount);
        if (!this.web3Single.isAddressNoChecksum(_currencyContract))
            return _callback(Error('_currencyContract must be a valid eth address'), null);
        if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension))
            return _callback(Error('_extension must be a valid eth address'), null);
        this.instanceRequestCore.methods.getCollectEstimation(_expectedAmount, _currencyContract, _extension).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, _callback(err, data)];
            });
        }); });
    };
    RequestCoreService.prototype.getRequestAsync = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            _this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                var dataResult, currencyContractDetails, extensionDetails, _a, _b, _c, _d, e_1;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (err)
                                return [2 /*return*/, reject(err)];
                            _e.label = 1;
                        case 1:
                            _e.trys.push([1, 9, , 10]);
                            if (data.creator == '0x0000000000000000000000000000000000000000') {
                                return [2 /*return*/, reject(Error('request not found'))];
                            }
                            dataResult = {
                                requestId: _requestId,
                                creator: data.creator,
                                payee: data.payee,
                                payer: data.payer,
                                expectedAmount: new bignumber_js_1.default(data.expectedAmount),
                                currencyContract: data.currencyContract,
                                balance: new bignumber_js_1.default(data.balance),
                                state: data.state,
                                extension: data.extension != "0x0000000000000000000000000000000000000000" ? data.extension : undefined,
                                data: data.data,
                            };
                            if (!ServicesContracts.getServiceFromAddress(data.currencyContract)) return [3 /*break*/, 3];
                            return [4 /*yield*/, ServicesContracts.getServiceFromAddress(data.currencyContract, this.web3Single.web3.currentProvider).getRequestCurrencyContractInfoAsync(_requestId)];
                        case 2:
                            currencyContractDetails = _e.sent();
                            dataResult.currencyContract = Object.assign(currencyContractDetails, { address: dataResult.currencyContract });
                            _e.label = 3;
                        case 3:
                            if (!(data.extension && data.extension != '' && ServiceExtensions.getServiceFromAddress(data.extension))) return [3 /*break*/, 5];
                            return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(data.extension, this.web3Single.web3.currentProvider).getRequestExtensionInfoAsync(_requestId)];
                        case 4:
                            extensionDetails = _e.sent();
                            dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                            _e.label = 5;
                        case 5:
                            if (!(dataResult.data && dataResult.data != '')) return [3 /*break*/, 7];
                            _a = dataResult;
                            _b = { hash: dataResult.data };
                            _d = (_c = JSON).parse;
                            return [4 /*yield*/, this.ipfs.getFileAsync(dataResult.data)];
                        case 6:
                            _a.data = (_b.data = _d.apply(_c, [_e.sent()]), _b);
                            return [3 /*break*/, 8];
                        case 7:
                            dataResult.data = undefined;
                            _e.label = 8;
                        case 8: return [2 /*return*/, resolve(dataResult)];
                        case 9:
                            e_1 = _e.sent();
                            return [2 /*return*/, reject(e_1)];
                        case 10: return [2 /*return*/];
                    }
                });
            }); });
        });
    };
    RequestCoreService.prototype.getRequest = function (_requestId, _callbackGetRequest) {
        var _this = this;
        if (!this.web3Single.isHexStrictBytes32(_requestId))
            return _callbackGetRequest(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''), undefined);
        this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
            var dataResult_1, extensionDetails, currencyContractDetails, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (err)
                            return [2 /*return*/, _callbackGetRequest(err, data)];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (data.creator == '0x0000000000000000000000000000000000000000') {
                            return [2 /*return*/, _callbackGetRequest(Error('request not found'), data)];
                        }
                        dataResult_1 = {
                            requestId: _requestId,
                            creator: data.creator,
                            payee: data.payee,
                            payer: data.payer,
                            expectedAmount: new bignumber_js_1.default(data.expectedAmount),
                            currencyContract: data.currencyContract,
                            balance: new bignumber_js_1.default(data.balance),
                            state: data.state,
                            extension: data.extension != "0x0000000000000000000000000000000000000000" ? data.extension : undefined,
                            data: data.data,
                        };
                        if (!ServiceExtensions.getServiceFromAddress(data.extension)) return [3 /*break*/, 3];
                        return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(data.extension, this.web3Single.web3.currentProvider).getRequestExtensionInfoAsync(_requestId)];
                    case 2:
                        extensionDetails = _a.sent();
                        dataResult_1.extension = Object.assign(extensionDetails, { address: dataResult_1.extension });
                        _a.label = 3;
                    case 3:
                        if (!ServicesContracts.getServiceFromAddress(data.currencyContract)) return [3 /*break*/, 5];
                        return [4 /*yield*/, ServicesContracts.getServiceFromAddress(data.currencyContract, this.web3Single.web3.currentProvider).getRequestCurrencyContractInfoAsync(_requestId)];
                    case 4:
                        currencyContractDetails = _a.sent();
                        dataResult_1.currencyContract = Object.assign(currencyContractDetails, { address: dataResult_1.extension });
                        _a.label = 5;
                    case 5:
                        if (dataResult_1.data && dataResult_1.data != '') {
                            // get IPFS data :
                            this.ipfs.getFile(dataResult_1.data, function (err, data) {
                                if (err)
                                    return _callbackGetRequest(err, dataResult_1);
                                dataResult_1.data = { hash: dataResult_1, data: JSON.parse(data) };
                                return _callbackGetRequest(err, dataResult_1);
                            });
                        }
                        else {
                            return [2 /*return*/, _callbackGetRequest(err, dataResult_1)];
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        e_2 = _a.sent();
                        return [2 /*return*/, _callbackGetRequest(e_2, null)];
                    case 7: return [2 /*return*/];
                }
            });
        }); });
    };
    return RequestCoreService;
}());
exports.default = RequestCoreService;
//# sourceMappingURL=requestCore-service.js.map