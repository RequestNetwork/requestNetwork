import * as Types from '../types';
import requestEthereum_Artifact from '../artifacts/RequestEthereum.json';
import config from '../config';

import * as Web3Sgl from './web3-Single';

export default class requestEthereumService {
    protected web3Single: any;

    // RequestEthereum on blockchain
    protected abiRequestEthereum: string;
    protected addressRequestEthereum: string;
    protected instanceRequestEthereum: any;

    constructor() {
        this.web3Single = Web3Sgl.Web3Single.getInstance();

        this.abiRequestEthereum = requestEthereum_Artifact.abi;
        this.addressRequestEthereum = config.ethereum.contracts.requestEthereum;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }

    public createRequestAsPayee = function(
        _payer: string,
        _amountInitial: any,
        _extension: string,
        _extensionParams: Array < any > ,
        _details: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        if (_amountInitial < 0 /*|| !_amountInitial.isInteger()*/ ) throw Error("_amountInitial must a positive integer");
        if (!this.web3Single.isAddressNoChecksum(_payer)) throw Error("_payer must be a valid eth address");
        if (!this.web3Single.isAddressNoChecksum(_extension)) throw Error("_extension must be a valid eth address");
        if (_extensionParams.length > 9) throw Error("_extensionParams length must be less than 9");

        var method = this.instanceRequestEthereum.methods.createRequestAsPayee(
            _payer,
            _amountInitial,
            _extension,
            this.web3Single.arrayToBytes32(_extensionParams, 9),
            _details);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError, );
    }


    public accept = function(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        var method = this.instanceRequestEthereum.methods.accept(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError);
    }

    public decline = function(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        var method = this.instanceRequestEthereum.methods.decline(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError);
    }

    public cancel = function(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payee ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        var method = this.instanceRequestEthereum.methods.cancel(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError);
    }

    public pay = function(
        _requestId: string,
        _amount: any,
        _tips: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
        // TODO use bigNumber
        if (_amount < 0 /* || !_amount.isInteger()*/ ) throw Error("_amount must a positive integer");
        // TODO use bigNumber
        if (_tips < 0 /* || !_tips.isInteger()*/ ) throw Error("_tips must a positive integer");

        var method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError,
            _amount);
    }

    public payback = function(
        _requestId: string,
        _amount: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payee ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
        // TODO use bigNumber
        if (_amount < 0 /*|| !_amount.isInteger()*/ ) throw Error("_amount must a positive integer");

        var method = this.instanceRequestEthereum.methods.payback(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError,
            _amount);
    }


    public discount = function(
        _requestId: string,
        _amount: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payee ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');
        // TODO use bigNumber
        if (_amount < 0 /*|| !_amount.isInteger()*/ ) throw Error("_amount must a positive integer");

        var method = this.instanceRequestEthereum.methods.payback(_requestId, _amount);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError);
    }

    public withdraw = function(
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        var method = this.instanceRequestEthereum.methods.withdraw();

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError);
    }

}