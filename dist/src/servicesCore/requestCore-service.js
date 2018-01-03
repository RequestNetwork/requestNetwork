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
var ServicesContracts = require("../servicesContracts");
var ServiceExtensions = require("../servicesExtensions");
var requestCore_Artifact = artifacts_1.default.RequestCoreArtifact;
var web3_single_1 = require("../servicesExternal/web3-single");
var ipfs_service_1 = require("../servicesExternal/ipfs-service");
var BN = web3_single_1.Web3Single.BN();
/**
 * The RequestCoreService class is the interface for the Request Core contract
 */
var RequestCoreService = /** @class */ (function () {
    /**
     * constructor to Instantiates a new RequestCoreService
     */
    function RequestCoreService() {
        this.web3Single = web3_single_1.Web3Single.getInstance();
        this.ipfs = ipfs_service_1.default.getInstance();
        this.abiRequestCore = requestCore_Artifact.abi;
        if (!requestCore_Artifact.networks[this.web3Single.networkName]) {
            throw Error('RequestCore Artifact does not have configuration for network : "' + this.web3Single.networkName + '"');
        }
        this.addressRequestCore = requestCore_Artifact.networks[this.web3Single.networkName].address;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
    }
    /**
     * get the number of the last request (N.B: number != id)
     * @return  promise of the number of the last request
     */
    RequestCoreService.prototype.getCurrentNumRequest = function () {
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
    /**
     * get the version of the contract
     * @return  promise of the version of the contract
     */
    RequestCoreService.prototype.getVersion = function () {
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
    /**
     * get the estimation of ether (in wei) needed to create a request
     * @param   _expectedAmount    amount expected of the request
     * @param   _currencyContract  address of the currency contract of the request
     * @param   _extension         address of the extension contract of the request
     * @return  promise of the number of wei needed to create the request
     */
    RequestCoreService.prototype.getCollectEstimation = function (_expectedAmount, _currencyContract, _extension) {
        var _this = this;
        _expectedAmount = new BN(_expectedAmount);
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
    /**
     * get a request by its requestId
     * @param   _requestId    requestId of the request
     * @return  promise of the object containing the request
     */
    RequestCoreService.prototype.getRequest = function (_requestId) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!_this.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            // get information from the core
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
                                expectedAmount: new BN(data.expectedAmount),
                                currencyContract: data.currencyContract,
                                balance: new BN(data.balance),
                                state: data.state,
                                extension: data.extension != "0x0000000000000000000000000000000000000000" ? data.extension : undefined,
                                data: data.data,
                            };
                            if (!ServicesContracts.getServiceFromAddress(data.currencyContract)) return [3 /*break*/, 3];
                            return [4 /*yield*/, ServicesContracts.getServiceFromAddress(data.currencyContract).getRequestCurrencyContractInfo(_requestId)];
                        case 2:
                            currencyContractDetails = _e.sent();
                            dataResult.currencyContract = Object.assign(currencyContractDetails, { address: dataResult.currencyContract });
                            _e.label = 3;
                        case 3:
                            if (!(data.extension && data.extension != '' && ServiceExtensions.getServiceFromAddress(data.extension))) return [3 /*break*/, 5];
                            return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(data.extension).getRequestExtensionInfo(_requestId)];
                        case 4:
                            extensionDetails = _e.sent();
                            dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                            _e.label = 5;
                        case 5:
                            if (!(dataResult.data && dataResult.data != '')) return [3 /*break*/, 7];
                            _a = dataResult;
                            _b = { hash: dataResult.data };
                            _d = (_c = JSON).parse;
                            return [4 /*yield*/, this.ipfs.getFile(dataResult.data)];
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
    /**
     * get a request by the hash of the transaction which created the request
     * @param   _hash    hash of the transaction which created the request
     * @return  promise of the object containing the request
     */
    RequestCoreService.prototype.getRequestByTransactionHash = function (_hash) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var txReceipt, tx, event_1, request, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.web3Single.getTransactionReceipt(_hash)];
                    case 1:
                        txReceipt = _a.sent();
                        if (!!txReceipt) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.web3Single.getTransaction(_hash)];
                    case 2:
                        tx = _a.sent();
                        if (!tx) {
                            return [2 /*return*/, reject(Error('transaction not found'))];
                        }
                        else if (!tx.blockNumber) {
                            // TODO : check transaction input data
                            return [2 /*return*/, reject(Error('transaction not mined'))];
                        }
                        _a.label = 3;
                    case 3:
                        if (!txReceipt.logs || !txReceipt.logs[0] || !this.web3Single.areSameAddressesNoChecksum(txReceipt.logs[0].address, this.addressRequestCore)) {
                            return [2 /*return*/, reject(Error('transaction did not create a Request'))];
                        }
                        event_1 = this.web3Single.decodeTransactionLog(this.abiRequestCore, 'Created', txReceipt.logs[0]);
                        if (!event_1) {
                            return [2 /*return*/, reject(Error('transaction did not create a Request'))];
                        }
                        return [4 /*yield*/, this.getRequest(event_1.requestId)];
                    case 4:
                        request = _a.sent();
                        return [2 /*return*/, resolve(request)];
                    case 5:
                        e_2 = _a.sent();
                        return [2 /*return*/, reject(e_2)];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * get a request's events
     * @param   _requestId    requestId of the request
     * @param   _fromBlock    search events from this block (optional)
     * @param   _toBlock    search events until this block (optional)
     * @return  promise of the array of events about the request
     */
    RequestCoreService.prototype.getRequestEvents = function (_requestId, _fromBlock, _toBlock) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    var currencyContract, extension, optionFilters, eventsCoreRaw, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, eventsCore, eventsExtensions, eventsCurrencyContract, e_3;
                    return __generator(this, function (_w) {
                        switch (_w.label) {
                            case 0:
                                if (err)
                                    return [2 /*return*/, reject(err)];
                                _w.label = 1;
                            case 1:
                                _w.trys.push([1, 17, , 18]);
                                currencyContract = data.currencyContract;
                                extension = data.extension != "0x0000000000000000000000000000000000000000" ? data.extension : undefined;
                                optionFilters = {
                                    filter: { requestId: _requestId },
                                    fromBlock: _fromBlock ? _fromBlock : requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                                    toBlock: _toBlock ? _toBlock : 'latest'
                                };
                                eventsCoreRaw = [];
                                _b = (_a = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('Created', optionFilters)];
                            case 2:
                                eventsCoreRaw = _b.apply(_a, [_w.sent()]);
                                _d = (_c = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('Accepted', optionFilters)];
                            case 3:
                                eventsCoreRaw = _d.apply(_c, [_w.sent()]);
                                _f = (_e = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('Canceled', optionFilters)];
                            case 4:
                                eventsCoreRaw = _f.apply(_e, [_w.sent()]);
                                _h = (_g = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('UpdateBalance', optionFilters)];
                            case 5:
                                eventsCoreRaw = _h.apply(_g, [_w.sent()]);
                                _k = (_j = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('UpdateExpectedAmount', optionFilters)];
                            case 6:
                                eventsCoreRaw = _k.apply(_j, [_w.sent()]);
                                _m = (_l = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('NewPayee', optionFilters)];
                            case 7:
                                eventsCoreRaw = _m.apply(_l, [_w.sent()]);
                                _p = (_o = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('NewPayer', optionFilters)];
                            case 8:
                                eventsCoreRaw = _p.apply(_o, [_w.sent()]);
                                _r = (_q = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('NewExpectedAmount', optionFilters)];
                            case 9:
                                eventsCoreRaw = _r.apply(_q, [_w.sent()]);
                                _t = (_s = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('NewExtension', optionFilters)];
                            case 10:
                                eventsCoreRaw = _t.apply(_s, [_w.sent()]);
                                _v = (_u = eventsCoreRaw).concat;
                                return [4 /*yield*/, this.instanceRequestCore.getPastEvents('NewData', optionFilters)];
                            case 11:
                                eventsCoreRaw = _v.apply(_u, [_w.sent()]);
                                eventsCore = [];
                                return [4 /*yield*/, Promise.all(eventsCoreRaw.map(function (e) { return __awaiter(_this, void 0, void 0, function () {
                                        var _this = this;
                                        return __generator(this, function (_a) {
                                            return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                                                    var _a, _b, _c;
                                                    return __generator(this, function (_d) {
                                                        switch (_d.label) {
                                                            case 0:
                                                                _a = resolve;
                                                                _b = {};
                                                                _c = {
                                                                    logIndex: e.logIndex,
                                                                    blockNumber: e.blockNumber
                                                                };
                                                                return [4 /*yield*/, this.web3Single.getBlockTimestamp(e.blockNumber)];
                                                            case 1:
                                                                _a.apply(void 0, [(_b._meta = (_c.timestamp = _d.sent(),
                                                                        _c),
                                                                        _b.name = e.event,
                                                                        _b.data = e.returnValues,
                                                                        _b)]);
                                                                return [2 /*return*/];
                                                        }
                                                    });
                                                }); })];
                                        });
                                    }); }))];
                            case 12:
                                eventsCore = _w.sent();
                                eventsExtensions = [];
                                if (!ServiceExtensions.getServiceFromAddress(extension)) return [3 /*break*/, 14];
                                return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(extension).getRequestEventsExtensionInfo(_requestId, _fromBlock, _toBlock)];
                            case 13:
                                eventsExtensions = _w.sent();
                                _w.label = 14;
                            case 14:
                                eventsCurrencyContract = [];
                                if (!ServicesContracts.getServiceFromAddress(currencyContract)) return [3 /*break*/, 16];
                                return [4 /*yield*/, ServicesContracts.getServiceFromAddress(currencyContract).getRequestEventsCurrencyContractInfo(_requestId, _fromBlock, _toBlock)];
                            case 15:
                                eventsCurrencyContract = _w.sent();
                                _w.label = 16;
                            case 16: return [2 /*return*/, resolve(eventsCore.concat(eventsExtensions).concat(eventsCurrencyContract).sort(function (a, b) {
                                    var diffBlockNumber = a._meta.blockNumber - b._meta.blockNumber;
                                    return diffBlockNumber != 0 ? diffBlockNumber : a._meta.logIndex - b._meta.logIndex;
                                }))];
                            case 17:
                                e_3 = _w.sent();
                                return [2 /*return*/, reject(e_3)];
                            case 18: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        }); });
    };
    /**
     * get the list of requests connected to an address
     * @param   _address        address to get the requests
     * @param   _fromBlock      search requests from this block (optional)
     * @param   _toBlock        search requests until this block (optional)
     * @return  promise of the object of requests as {asPayer:[],asPayee[]}
     */
    RequestCoreService.prototype.getRequestsByAddress = function (_address, _fromBlock, _toBlock) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            var eventsCorePayee, eventsCorePayer, e_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.instanceRequestCore.getPastEvents('Created', {
                                filter: { payee: _address },
                                fromBlock: _fromBlock ? _fromBlock : requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                                toBlock: _toBlock ? _toBlock : 'latest'
                            })];
                    case 1:
                        eventsCorePayee = _a.sent();
                        return [4 /*yield*/, this.instanceRequestCore.getPastEvents('Created', {
                                filter: { payer: _address },
                                fromBlock: _fromBlock ? _fromBlock : requestCore_Artifact.networks[this.web3Single.networkName].blockNumber,
                                toBlock: _toBlock ? _toBlock : 'latest'
                            })];
                    case 2:
                        eventsCorePayer = _a.sent();
                        return [4 /*yield*/, Promise.all(eventsCorePayee.map(function (e) {
                                return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a, _b, _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                _a = resolve;
                                                _b = { requestId: e.returnValues.requestId };
                                                _c = {
                                                    blockNumber: e.blockNumber
                                                };
                                                return [4 /*yield*/, this.web3Single.getBlockTimestamp(e.blockNumber)];
                                            case 1: return [2 /*return*/, _a.apply(void 0, [(_b._meta = (_c.timestamp = _d.sent(),
                                                        _c), _b)])];
                                        }
                                    });
                                }); });
                            }))];
                    case 3:
                        // clean the data and get timestamp for request as payee
                        eventsCorePayee = _a.sent();
                        return [4 /*yield*/, Promise.all(eventsCorePayer.map(function (e) {
                                return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a, _b, _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                _a = resolve;
                                                _b = { requestId: e.returnValues.requestId };
                                                _c = {
                                                    blockNumber: e.blockNumber
                                                };
                                                return [4 /*yield*/, this.web3Single.getBlockTimestamp(e.blockNumber)];
                                            case 1: return [2 /*return*/, _a.apply(void 0, [(_b._meta = (_c.timestamp = _d.sent(),
                                                        _c), _b)])];
                                        }
                                    });
                                }); });
                            }))];
                    case 4:
                        // clean the data and get timestamp for request as payer
                        eventsCorePayer = _a.sent();
                        return [2 /*return*/, resolve({ asPayer: eventsCorePayer,
                                asPayee: eventsCorePayee })];
                    case 5:
                        e_4 = _a.sent();
                        return [2 /*return*/, reject(e_4)];
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    };
    return RequestCoreService;
}());
exports.default = RequestCoreService;
//# sourceMappingURL=requestCore-service.js.map