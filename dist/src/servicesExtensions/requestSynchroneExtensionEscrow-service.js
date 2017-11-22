"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("../config");
var artifacts_1 = require("../artifacts");
var bignumber_js_1 = require("bignumber.js");
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
    RequestSynchroneExtensionEscrowService.getInstance = function () {
        return this._instance || (this._instance = new this());
    };
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
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayeeAsync = function (_requestId, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
        if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
        if (_from === void 0) { _from = undefined; }
        if (_gasPrice === void 0) { _gasPrice = undefined; }
        if (_gasLimit === void 0) { _gasLimit = undefined; }
        var myThis = this;
        return new Promise(function (resolve, reject) {
            // TODO check from == payer or escrow ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            var method = myThis.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);
            myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                // we do nothing here!
            }, function (receipt) {
                // we do nothing here!
            }, function (confirmationNumber, receipt) {
                if (confirmationNumber == _numberOfConfirmation) {
                    // check in case of failed : no event
                    return resolve({ requestId: receipt.events.EscrowReleaseRequest.returnValues.requestId, transactionHash: receipt.transactionHash });
                }
            }, function (error) {
                return reject(error);
            }, undefined, _from, _gasPrice, _gasLimit);
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.releaseToPayee = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
        if (_from === void 0) { _from = undefined; }
        if (_gasPrice === void 0) { _gasPrice = undefined; }
        if (_gasLimit === void 0) { _gasLimit = undefined; }
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId))
            throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');
        var method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);
        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, undefined, _from, _gasPrice, _gasLimit);
    };
    RequestSynchroneExtensionEscrowService.prototype.refundToPayerAsync = function (_requestId, _numberOfConfirmation, _from, _gasPrice, _gasLimit) {
        if (_numberOfConfirmation === void 0) { _numberOfConfirmation = 0; }
        if (_from === void 0) { _from = undefined; }
        if (_gasPrice === void 0) { _gasPrice = undefined; }
        if (_gasLimit === void 0) { _gasLimit = undefined; }
        var myThis = this;
        return new Promise(function (resolve, reject) {
            // TODO check from == payee or escrow ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            var method = myThis.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);
            myThis.web3Single.broadcastMethod(method, function (transactionHash) {
                // we do nothing here!
            }, function (receipt) {
                // we do nothing here!
            }, function (confirmationNumber, receipt) {
                if (confirmationNumber == _numberOfConfirmation) {
                    var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'EscrowRefundRequest', receipt.events[0]);
                    return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                }
            }, function (error) {
                return reject(error);
            }, undefined, _from, _gasPrice, _gasLimit);
        });
    };
    RequestSynchroneExtensionEscrowService.prototype.refundToPayer = function (_requestId, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, _from, _gasPrice, _gasLimit) {
        if (_from === void 0) { _from = undefined; }
        if (_gasPrice === void 0) { _gasPrice = undefined; }
        if (_gasLimit === void 0) { _gasLimit = undefined; }
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId))
            throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');
        var method = this.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);
        this.web3Single.broadcastMethod(method, _callbackTransactionHash, _callbackTransactionReceipt, _callbackTransactionConfirmation, _callbackTransactionError, undefined, _from, _gasPrice, _gasLimit);
    };
    RequestSynchroneExtensionEscrowService.prototype.getRequestAsync = function (_requestId) {
        var myThis = this;
        return new Promise(function (resolve, reject) {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!myThis.web3Single.isHexStrictBytes32(_requestId))
                return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            myThis.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call(function (err, data) {
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
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
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
    RequestSynchroneExtensionEscrowService._instance = new RequestSynchroneExtensionEscrowService();
    return RequestSynchroneExtensionEscrowService;
}());
exports.default = RequestSynchroneExtensionEscrowService;
//# sourceMappingURL=requestSynchroneExtensionEscrow-service.js.map