import * as Types from '../types';
// import requestEthereum_Artifact from '../artifacts/RequestEthereum.json';
const requestCore_Artifact = require('../artifacts/RequestCore.json');
const requestSynchroneExtensionEscrow_Artifact = require('../artifacts/RequestSynchroneExtensionEscrow.json');

import config from '../config';

import * as Web3Sgl from './web3-Single';

export default class RequestSynchroneExtensionEscrowService {
		private static _instance:RequestSynchroneExtensionEscrowService = new RequestSynchroneExtensionEscrowService();

    protected web3Single: any;

    // RequestEthereum on blockchain
    protected abiRequestCore: string;
    protected addressRequestCore: string;
    protected instanceRequestCore: any;

    protected abiSynchroneExtensionEscrow: string;
    protected addressSynchroneExtensionEscrow: string;
    protected instanceSynchroneExtensionEscrow: any;

    constructor() {
        this.web3Single = Web3Sgl.Web3Single.getInstance();

        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);

        this.abiSynchroneExtensionEscrow = requestSynchroneExtensionEscrow_Artifact.abi;
        this.addressSynchroneExtensionEscrow = config.ethereum.contracts.requestSynchroneExtensionEscrow;
        this.instanceSynchroneExtensionEscrow = new this.web3Single.web3.eth.Contract(this.abiSynchroneExtensionEscrow, this.addressSynchroneExtensionEscrow);
    }

		public static getInstance()
		{
			return this._instance || (this._instance = new this());
		}

    public releaseToPayeeAsync = function(
        _requestId: string,
        _numberOfConfirmation: number = 0)
        : Promise<any> 
    {
        var myThis = this;
        return new Promise(function(resolve, reject) {
        // TODO check from == payer or escrow ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));

        var method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);

        myThis.web3Single.broadcastMethod(
            method,
            (transactionHash:string) => {
                // we do nothing here!
            },
            (receipt:any) => {
                // we do nothing here!
            },
            (confirmationNumber:number, receipt:any) => {
                if(confirmationNumber==_numberOfConfirmation) {
                    var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, "EscrowReleaseRequest", receipt.events[0]);
                    return resolve({requestId:event.requestId, transactionHash:receipt.transactionHash});
                }
            },
            (error:Error) => {
                return reject(error);
            });
        });
    }

    public releaseToPayee = function(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        var method = this.instanceRequestEthereum.methods.releaseToPayee(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError);
    }



    public refundToPayerAsync = function(
        _requestId: string,
        _numberOfConfirmation: number = 0)
        : Promise<any> 
    {
        var myThis = this;
        return new Promise(function(resolve, reject) {
        // TODO check from == payee or escrow ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));

        var method = this.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);

        myThis.web3Single.broadcastMethod(
            method,
            (transactionHash:string) => {
                // we do nothing here!
            },
            (receipt:any) => {
                // we do nothing here!
            },
            (confirmationNumber:number, receipt:any) => {
                if(confirmationNumber==_numberOfConfirmation) {
                    var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, "EscrowRefundRequest", receipt.events[0]);
                    return resolve({requestId:event.requestId, transactionHash:receipt.transactionHash});
                }
            },
            (error:Error) => {
                return reject(error);
            });
        });
    }

    public refundToPayer = function(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError): void {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        var method = this.instanceRequestEthereum.methods.refundToPayer(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError);
    }
    

    public getRequestAsync = function( 
        _requestId:        string)
        : Promise<any>
    {
        var myThis = this;
        return new Promise(function(resolve, reject) {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if(!myThis.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));

            myThis.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err:Error,data:any) => {
                if(err) return reject(err);

                let dataResult:any = {
                        subContract: data.subContract,
                        escrow: data.escrow,
                        state: data.state,
                        amountPaid: data.amountPaid,
                        amountRefunded: data.amountRefunded
                    };

                return resolve(dataResult);
            });
        });
    }

    public getRequest = function( 
        _requestId:        string,
        _callbackGetRequest:Types.CallbackGetRequest)
    {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if(!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err:Error,data:any) => {
            if(err) return _callbackGetRequest(err, data);

            let dataResult:any = {
                  subContract: data.subContract,
                  escrow: data.escrow,
                  state: data.state,
                  amountPaid: data.amountPaid,
                  amountRefunded: data.amountRefunded
                };

            return _callbackGetRequest(err, dataResult);
        });
    }

}
