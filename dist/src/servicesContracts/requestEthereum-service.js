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
var artifacts_1 = require("../artifacts");
var ServiceExtensions = require("../servicesExtensions");
var requestEthereum_Artifact = artifacts_1.default.RequestEthereumArtifact;
var requestCore_Artifact = artifacts_1.default.RequestCoreArtifact;
var web3_single_1 = require("../servicesExternal/web3-single");
var ipfs_service_1 = require("../servicesExternal/ipfs-service");
var requestEthereumService = /** @class */ (function () {
    function requestEthereumService(web3Provider) {
        this.createRequestAsPayeeAsync = function (_payer, _amountInitial, _extension, _extensionParams, _details, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            return new Promise(function (resolve, reject) {
                // check _details is a proper JSON
                if (_amountInitial < 0 /*|| !_amountInitial.isInteger()*/)
                    return reject(Error("_amountInitial must a positive integer"));
                if (!_this.web3Single.isAddressNoChecksum(_payer))
                    return reject(Error("_payer must be a valid eth address"));
                if (_extension != "" && !_this.web3Single.isAddressNoChecksum(_extension))
                    return reject(Error("_extension must be a valid eth address"));
                if (_extensionParams.length > 9)
                    return reject(Error("_extensionParams length must be less than 9"));
                var paramsParsed;
                if (ServiceExtensions.getServiceFromAddress(_extension)) {
                    paramsParsed = ServiceExtensions.getServiceFromAddress(_extension).getInstance().parseParameters(_extensionParams);
                }
                else {
                    paramsParsed = _this.web3Single.arrayToBytes32(_extensionParams, 9);
                }
                _this.ipfs.addFile(JSON.parse(_details), function (err, hash) {
                    if (err)
                        return reject(err);
                    var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed, hash);
                    _this.web3Single.broadcastMethod(method, function (transactionHash) {
                        // we do nothing here!
                    }, function (receipt) {
                        // we do nothing here!
                    }, function (confirmationNumber, receipt) {
                        if (confirmationNumber == _numberOfConfirmation) {
                            var event = _this.web3Single.decodeLog(_this.abiRequestCore, "Created", receipt.events[0]);
                            return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash, ipfsHash: hash });
                        }
                    }, function (error) {
                        return reject(error);
                    }, undefined, _from, _gasPrice, _gasLimit);
                });
            });
        };
        this.createRequestAsPayee = function (_payer, _amountInitial, _extension, _extensionParams, _details, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_amountInitial < 0 /*|| !_amountInitial.isInteger()*/)
                throw Error("_amountInitial must a positive integer");
            if (!this.web3Single.isAddressNoChecksum(_payer))
                throw Error("_payer must be a valid eth address");
            if (_extension != "" && !this.web3Single.isAddressNoChecksum(_extension))
                throw Error("_extension must be a valid eth address");
            if (_extensionParams.length > 9)
                throw Error("_extensionParams length must be less than 9");
            var paramsParsed;
            if (ServiceExtensions.getServiceFromAddress(_extension)) {
                paramsParsed = ServiceExtensions.getServiceFromAddress(_extension).getInstance().parseParameters(_extensionParams);
            }
            else {
                paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
            }
            this.ipfs.addFile(JSON.parse(_details), function (err, hash) {
                if (err)
                    return _callbackTransactionError(err);
                var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, paramsParsed, hash);
                _this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, undefined, _from, _gasPrice, _gasLimit);
            });
        };
        this.acceptAsync = function (_requestId, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!_this.web3Single.isHexStrictBytes32(_requestId))
                    return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));
                var method = _this.instanceRequestEthereum.methods.accept(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = _this.web3Single.decodeLog(_this.abiRequestCore, "Accepted", receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, undefined, _from, _gasPrice, _gasLimit);
            });
        };
        this.accept = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            var method = this.instanceRequestEthereum.methods.accept(_requestId);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, undefined, _from, _gasPrice, _gasLimit);
        };
        this.cancelAsync = function (_requestId, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!_this.web3Single.isHexStrictBytes32(_requestId))
                    return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));
                var method = _this.instanceRequestEthereum.methods.cancel(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = _this.web3Single.decodeLog(_this.abiRequestCore, "Canceled", receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, undefined, _from, _gasPrice, _gasLimit);
            });
        };
        this.cancel = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
            // TODO check from == payee ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            var method = this.instanceRequestEthereum.methods.cancel(_requestId);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, undefined, _from, _gasPrice, _gasLimit);
        };
        this.payAsync = function (_requestId, _amount, _tips, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!_this.web3Single.isHexStrictBytes32(_requestId))
                    throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
                // TODO use bigNumber
                if (_amount < 0 /* || !_amount.isInteger()*/)
                    throw Error("_amount must a positive integer");
                // TODO use bigNumber
                if (_tips < 0 /* || !_tips.isInteger()*/)
                    throw Error("_tips must a positive integer");
                var method = _this.instanceRequestEthereum.methods.pay(_requestId, _tips);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = _this.web3Single.decodeLog(_this.abiRequestCore, "Payment", receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, _amount, _from, _gasPrice, _gasLimit);
            });
        };
        this.pay = function (_requestId, _amount, _tips, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            // TODO use bigNumber
            if (_amount < 0 /* || !_amount.isInteger()*/)
                throw Error("_amount must a positive integer");
            // TODO use bigNumber
            if (_tips < 0 /* || !_tips.isInteger()*/)
                throw Error("_tips must a positive integer");
            var method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _amount, _from, _gasPrice, _gasLimit);
        };
        this.paybackAsync = function (_requestId, _amount, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!_this.web3Single.isHexStrictBytes32(_requestId))
                    throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
                // TODO use bigNumber
                if (_amount < 0 /* || !_amount.isInteger()*/)
                    throw Error("_amount must a positive integer");
                var method = _this.instanceRequestEthereum.methods.payback(_requestId);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = _this.web3Single.decodeLog(_this.abiRequestCore, "Refunded", receipt.events[0]);
                        return resolve({ requestId: event.requestId, amountRefunded: event.amountRefunded, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, _amount, _from, _gasPrice, _gasLimit);
            });
        };
        this.payback = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
            // TODO check from == payee ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            // TODO use bigNumber
            if (_amount < 0 /*|| !_amount.isInteger()*/)
                throw Error("_amount must a positive integer");
            var method = this.instanceRequestEthereum.methods.payback(_requestId);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _amount, _from, _gasPrice, _gasLimit);
        };
        this.discountAsync = function (_requestId, _amount, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!_this.web3Single.isHexStrictBytes32(_requestId))
                    throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
                // TODO use bigNumber
                if (_amount < 0 /* || !_amount.isInteger()*/)
                    throw Error("_amount must a positive integer");
                var method = _this.instanceRequestEthereum.methods.discount(_requestId, _amount);
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = _this.web3Single.decodeLog(_this.abiRequestCore, "AddSubtract", receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, undefined, _from, _gasPrice, _gasLimit);
            });
        };
        this.discount = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
            // TODO check from == payee ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            // TODO use bigNumber
            if (_amount < 0 /*|| !_amount.isInteger()*/)
                throw Error("_amount must a positive integer");
            var method = this.instanceRequestEthereum.methods.discount(_requestId, _amount);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, undefined, _from, _gasPrice, _gasLimit);
        };
        this.withdrawAsync = function (_numberOfConfirmation, _from, _gasPrice, _gasLimit) {
            var _this = this;
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            return new Promise(function (resolve, reject) {
                var method = _this.instanceRequestEthereum.methods.withdraw();
                _this.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        return resolve({ transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, undefined, _from, _gasPrice, _gasLimit);
            });
        };
        this.withdraw = function (_callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
            var method = this.instanceRequestEthereum.methods.withdraw();
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, undefined, _from, _gasPrice, _gasLimit);
        };
        this.getRequestAsync = function (_requestId) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!_this.web3Single.isHexStrictBytes32(_requestId))
                    return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));
                _this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                    var dataResult, extensionDetails, _a, _b, _c, e_1;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                if (err)
                                    return [2 /*return*/, reject(err)];
                                dataResult = {
                                    creator: data.creator,
                                    payee: data.payee,
                                    payer: data.payer,
                                    amountInitial: data.amountInitial,
                                    subContract: data.subContract,
                                    amountPaid: data.amountPaid,
                                    amountAdditional: data.amountAdditional,
                                    amountSubtract: data.amountSubtract,
                                    state: data.state,
                                    extension: data.extension,
                                    details: data.details,
                                };
                                if (!ServiceExtensions.getServiceFromAddress(data.extension)) return [3 /*break*/, 2];
                                return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(data.extension).getInstance().getRequestAsync(_requestId)];
                            case 1:
                                extensionDetails = _d.sent();
                                dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                                _d.label = 2;
                            case 2:
                                if (!dataResult.details) return [3 /*break*/, 6];
                                _d.label = 3;
                            case 3:
                                _d.trys.push([3, 5, , 6]);
                                _a = dataResult;
                                _c = (_b = JSON).parse;
                                return [4 /*yield*/, this.ipfs.getFileAsync(dataResult.details)];
                            case 4:
                                _a.details = _c.apply(_b, [_d.sent()]);
                                return [3 /*break*/, 6];
                            case 5:
                                e_1 = _d.sent();
                                return [2 /*return*/, reject(e_1)];
                            case 6: return [2 /*return*/, resolve(dataResult)];
                        }
                    });
                }); });
            });
        };
        this.getRequest = function (_requestId, _callbackGetRequest) {
            var _this = this;
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            // var method = await this.instanceRequestCore.methods.requests(_requestId);
            // console.log(await this.web3Single.callMethod(method));
            // console.log(this.instanceRequestCore);
            this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) { return __awaiter(_this, void 0, void 0, function () {
                var dataResult, extensionDetails;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (err)
                                return [2 /*return*/, _callbackGetRequest(err, data)];
                            dataResult = {
                                creator: data.creator,
                                payee: data.payee,
                                payer: data.payer,
                                amountInitial: data.amountInitial,
                                subContract: data.subContract,
                                amountPaid: data.amountPaid,
                                amountAdditional: data.amountAdditional,
                                amountSubtract: data.amountSubtract,
                                state: data.state,
                                extension: data.extension,
                                details: data.details,
                            };
                            if (!ServiceExtensions.getServiceFromAddress(data.extension)) return [3 /*break*/, 2];
                            return [4 /*yield*/, ServiceExtensions.getServiceFromAddress(data.extension).getInstance().getRequestAsync(_requestId)];
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
                                    dataResult.details = JSON.parse(data);
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
        this.web3Single = new web3_single_1.Web3Single(web3Provider);
        this.ipfs = ipfs_service_1.default.getInstance();
        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config_1.default.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
        this.abiRequestEthereum = requestEthereum_Artifact.abi;
        this.addressRequestEthereum = config_1.default.ethereum.contracts.requestEthereum;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }
    return requestEthereumService;
}());
exports.default = requestEthereumService;
//# sourceMappingURL=requestEthereum-service.js.map