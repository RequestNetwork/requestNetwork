"use strict";
exports.__esModule = true;
// import requestEthereum_Artifact from '../artifacts/RequestEthereum.json';
var requestEthereum_Artifact = require('../artifacts/RequestEthereum.json');
var requestCore_Artifact = require('../artifacts/RequestCore.json');
var config_1 = require("../config");
var Web3Sgl = require("./web3-Single");
var ipfs_service_1 = require("./ipfs-service");
var requestEthereumService = /** @class */ (function () {
    function requestEthereumService() {
        this.createRequestAsPayeeAsync = function (_payer, _amountInitial, _extension, _extensionParams, _details, _numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // check _details is a proper JSON
                if (_amountInitial < 0 /*|| !_amountInitial.isInteger()*/)
                    return reject(Error('_amountInitial must a positive integer'));
                if (!myThis.web3Single.isAddressNoChecksum(_payer))
                    return reject(Error('_payer must be a valid eth address'));
                if (!myThis.web3Single.isAddressNoChecksum(_extension))
                    return reject(Error('_extension must be a valid eth address'));
                if (_extensionParams.length > 9)
                    return reject(Error('_extensionParams length must be less than 9'));
                myThis.ipfs.addFile(JSON.parse(_details), function (err, hash) {
                    if (err)
                        return reject(err);
                    var method = myThis.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, myThis.web3Single.arrayToBytes32(_extensionParams, 9), hash);
                    myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                        // we do nothing here!
                    }, function (receipt) {
                        // we do nothing here!
                    }, function (confirmationNumber, receipt) {
                        if (confirmationNumber == _numberOfConfirmation) {
                            var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'Created', receipt.events[0]);
                            return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash, ipfsHash: hash });
                        }
                    }, function (error) {
                        return reject(error);
                    });
                });
            });
        };
        this.createRequestAsPayee = function (_payer, _amountInitial, _extension, _extensionParams, _details, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            var _this = this;
            if (_amountInitial < 0 /*|| !_amountInitial.isInteger()*/)
                throw Error('_amountInitial must a positive integer');
            if (!this.web3Single.isAddressNoChecksum(_payer))
                throw Error('_payer must be a valid eth address');
            if (!this.web3Single.isAddressNoChecksum(_extension))
                throw Error('_extension must be a valid eth address');
            if (_extensionParams.length > 9)
                throw Error('_extensionParams length must be less than 9');
            this.ipfs.addFile(JSON.parse(_details), function (err, hash) {
                if (err)
                    return _callbackTransactionError(err);
                var method = _this.instanceRequestEthereum.methods.createRequestAsPayee(_payer, _amountInitial, _extension, _this.web3Single.arrayToBytes32(_extensionParams, 9), hash);
                _this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError);
            });
        };
        this.acceptAsync = function (_requestId, _numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId))
                    return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));
                var method = this.instanceRequestEthereum.methods.accept(_requestId);
                myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'Accepted', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                });
            });
        };
        this.accept = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            var method = this.instanceRequestEthereum.methods.accept(_requestId);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError);
        };
        this.declineAsync = function (_requestId, _numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                    return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));
                var method = myThis.instanceRequestEthereum.methods.decline(_requestId);
                myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'Declined', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                });
            });
        };
        this.decline = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            var method = this.instanceRequestEthereum.methods.decline(_requestId);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError);
        };
        this.cancelAsync = function (_requestId, _numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                    return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));
                var method = myThis.instanceRequestEthereum.methods.cancel(_requestId);
                myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'Canceled', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                });
            });
        };
        this.cancel = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            // TODO check from == payee ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            var method = this.instanceRequestEthereum.methods.cancel(_requestId);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError);
        };
        this.payAsync = function (_requestId, _amount, _tips, _numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                    throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
                // TODO use bigNumber
                if (_amount < 0 /* || !_amount.isInteger()*/)
                    throw Error("_amount must a positive integer");
                // TODO use bigNumber
                if (_tips < 0 /* || !_tips.isInteger()*/)
                    throw Error("_tips must a positive integer");
                var method = myThis.instanceRequestEthereum.methods.pay(_requestId, _tips);
                myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'Payment', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, _amount);
            });
        };
        this.pay = function (_requestId, _amount, _tips, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            // TODO use bigNumber
            if (_amount < 0 /* || !_amount.isInteger()*/)
                throw Error('_amount must a positive integer');
            // TODO use bigNumber
            if (_tips < 0 /* || !_tips.isInteger()*/)
                throw Error('_tips must a positive integer');
            var method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _amount);
        };
        this.paybackAsync = function (_requestId, _amount, _numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                    throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
                // TODO use bigNumber
                if (_amount < 0 /* || !_amount.isInteger()*/)
                    throw Error('_amount must a positive integer');
                var method = myThis.instanceRequestEthereum.methods.payback(_requestId);
                myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'Refund', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, _amount);
            });
        };
        this.payback = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            // TODO check from == payee ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            // TODO use bigNumber
            if (_amount < 0 /*|| !_amount.isInteger()*/)
                throw Error('_amount must a positive integer');
            var method = this.instanceRequestEthereum.methods.payback(_requestId);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _amount);
        };
        this.discountAsync = function (_requestId, _amount, _numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                    throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
                // TODO use bigNumber
                if (_amount < 0 /* || !_amount.isInteger()*/)
                    throw Error('_amount must a positive integer');
                var method = myThis.instanceRequestEthereum.methods.discount(_requestId, _amount);
                myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'AddSubtract', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                }, _amount);
            });
        };
        this.discount = function (_requestId, _amount, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            // TODO check from == payee ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId))
                throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
            // TODO use bigNumber
            if (_amount < 0 /*|| !_amount.isInteger()*/)
                throw Error('_amount must a positive integer');
            var method = this.instanceRequestEthereum.methods.discount(_requestId, _amount);
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError);
        };
        this.withdrawAsync = function (_numberOfConfirmation) {
            if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
            var myThis = this;
            return new Promise(function (resolve, reject) {
                var method = myThis.instanceRequestEthereum.methods.withdraw();
                myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                    // we do nothing here!
                }, function (receipt) {
                    // we do nothing here!
                }, function (confirmationNumber, receipt) {
                    if (confirmationNumber == _numberOfConfirmation) {
                        return resolve({ transactionHash: receipt.transactionHash });
                    }
                }, function (error) {
                    return reject(error);
                });
            });
        };
        this.withdraw = function (_callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError) {
            var method = this.instanceRequestEthereum.methods.withdraw();
            this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError);
        };
        this.getRequestAsync = function (_requestId) {
            var myThis = this;
            return new Promise(function (resolve, reject) {
                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                    return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));
                // var method = await this.instanceRequestCore.methods.requests(_requestId);
                // console.log(await this.web3Single.callMethod(method));
                // console.log(this.instanceRequestCore);
                myThis.instanceRequestCore.methods.requests(_requestId).call(function (err, data) {
                    if (err)
                        return reject(err);
                    var dataResult = {
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
                        details: data.details
                    };
                    // if(data.extension == this.addressRequestSyncEscrow) {
                    // }
                    // instanceRequestSyncEscrow.escrows
                    if (dataResult.details) {
                        // get IPFS data :
                        myThis.ipfs.getFile(dataResult.details, function (err, data) {
                            if (err)
                                return reject(err);
                            dataResult.details = JSON.parse(data);
                            return resolve(dataResult);
                        });
                    }
                    else {
                        return resolve(dataResult);
                    }
                });
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
            this.instanceRequestCore.methods.requests(_requestId).call(function (err, data) {
                if (err)
                    return _callbackGetRequest(err, data);
                var dataResult = {
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
                    details: data.details
                };
                // if(data.extension == this.addressRequestSyncEscrow) {
                // }
                // instanceRequestSyncEscrow.escrows
                if (dataResult.details) {
                    // get IPFS data :
                    _this.ipfs.getFile(dataResult.details, function (err, data) {
                        if (err)
                            return _callbackGetRequest(err, dataResult);
                        dataResult.details = JSON.parse(data);
                        return _callbackGetRequest(err, dataResult);
                    });
                }
                else {
                    return _callbackGetRequest(err, dataResult);
                }
            });
        };
        this.web3Single = Web3Sgl.Web3Single.getInstance();
        this.ipfs = ipfs_service_1["default"].getInstance();
        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config_1["default"].ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);
        this.abiRequestEthereum = requestEthereum_Artifact.abi;
        this.addressRequestEthereum = config_1["default"].ethereum.contracts.requestEthereum;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }
    return requestEthereumService;
}());
exports["default"] = requestEthereumService;
