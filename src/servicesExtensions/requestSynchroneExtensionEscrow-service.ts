import config from '../config';
import * as Types from '../types';
import Artifacts from '../artifacts';
import BigNumber from 'bignumber.js';

const requestCore_Artifact = Artifacts.RequestCoreArtifact;
const requestSynchroneExtensionEscrow_Artifact = Artifacts.RequestSynchroneExtensionEscrowArtifact;

import { Web3Single } from '../servicesExternal/web3-single';

export default class RequestSynchroneExtensionEscrowService {
    private static _instance: RequestSynchroneExtensionEscrowService = new RequestSynchroneExtensionEscrowService();

    protected web3Single: any;

    // RequestEthereum on blockchain
    protected abiRequestCore: any;
    protected addressRequestCore: string;
    protected instanceRequestCore: any;

    protected abiSynchroneExtensionEscrow: any;
    protected addressSynchroneExtensionEscrow: string;
    protected instanceSynchroneExtensionEscrow: any;

    constructor(web3Provider ? : any) {
        this.web3Single = new Web3Single(web3Provider);

        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);

        this.abiSynchroneExtensionEscrow = requestSynchroneExtensionEscrow_Artifact.abi;
        this.addressSynchroneExtensionEscrow = config.ethereum.contracts.requestSynchroneExtensionEscrow;
        this.instanceSynchroneExtensionEscrow = new this.web3Single.web3.eth.Contract(this.abiSynchroneExtensionEscrow, this.addressSynchroneExtensionEscrow);
    }

    public static getInstance() {
        return this._instance || (this._instance = new this());
    }

    public parseParameters(_extensionParams: any[]): any {
        if(!this.web3Single.isAddressNoChecksum(_extensionParams[0])) {
            return {error:Error("first parameter must be a valid eth address")}
        }
        let ret: any[] = [];

        // parse escrow 
        ret.push(this.web3Single.toSolidityBytes32('address', _extensionParams[0]));

        for (let i = 1; i < 9; i++) {
            ret.push(this.web3Single.toSolidityBytes32('bytes32', 0));
        }
        return {result:ret};
    }


    public releaseToPayeeAsync(
        _requestId: string,
        _numberOfConfirmation: number = 0,
        _from: string = undefined,
        _gasPrice: number = undefined,
        _gasLimit: number = undefined): Promise < any > {
        var myThis = this;
        return new Promise((resolve, reject) => {
            // TODO check from == payer or escrow ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!myThis.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));

            var method = myThis.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);

            myThis.web3Single.broadcastMethod(
                method,
                (transactionHash: string) => {
                    // we do nothing here!
                },
                (receipt: any) => {
                    // we do nothing here!
                },
                (confirmationNumber: number, receipt: any) => {
                    if (confirmationNumber == _numberOfConfirmation) {
                        // check in case of failed : no event
                        return resolve({ requestId: receipt.events.EscrowReleaseRequest.returnValues.requestId, transactionHash: receipt.transactionHash });
                    }
                },
                (error: Error) => {
                    return reject(error);
                },
                undefined,
                _from,
                _gasPrice,
                _gasLimit);
        });
    }

    public releaseToPayee(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _from: string = undefined,
        _gasPrice: number = undefined,
        _gasLimit: number = undefined): void {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        var method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError,
            undefined,
            _from,
            _gasPrice,
            _gasLimit);
    }

    public refundToPayerAsync(
        _requestId: string,
        _numberOfConfirmation: number = 0,
        _from: string = undefined,
        _gasPrice: number = undefined,
        _gasLimit: number = undefined): Promise < any > {
        var myThis = this;
        return new Promise((resolve, reject) => {
            // TODO check from == payee or escrow ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!myThis.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));

            var method = myThis.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);

            myThis.web3Single.broadcastMethod(
                method,
                (transactionHash: string) => {
                    // we do nothing here!
                },
                (receipt: any) => {
                    // we do nothing here!
                },
                (confirmationNumber: number, receipt: any) => {
                    if (confirmationNumber == _numberOfConfirmation) {
                        var event = myThis.web3Single.decodeLog(myThis.abiRequestCore, 'EscrowRefundRequest', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                },
                (error: Error) => {
                    return reject(error);
                },
                undefined,
                _from,
                _gasPrice,
                _gasLimit);
        });
    }

    public refundToPayer(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _from: string = undefined,
        _gasPrice: number = undefined,
        _gasLimit: number = undefined): void {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        var method = this.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError,
            undefined,
            _from,
            _gasPrice,
            _gasLimit);
    }


    public getRequestAsync(
        _requestId: string): Promise < any > {
        var myThis = this;
        return new Promise((resolve, reject) => {
            // TODO check from == payer ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!myThis.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"'));

            myThis.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err: Error, data: any) => {
                if (err) return reject(err);

                let dataResult: any = {
                    subContract: data.subContract,
                    escrow: data.escrow,
                    state: data.state,
                    amountPaid: new BigNumber(data.amountPaid),
                    amountRefunded: new BigNumber(data.amountRefunded)
                };

                return resolve(dataResult);
            });
        });
    }

    public getRequest(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest) {
        // TODO check from == payer ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: "0x0000000000000000000000000000000000000000000000000000000000000000"');

        this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err: Error, data: any) => {
            if (err) return _callbackGetRequest(err, data);

            let dataResult: any = {
                subContract: data.subContract,
                escrow: data.escrow,
                state: data.state,
                amountPaid: new BigNumber(data.amountPaid),
                amountRefunded: new BigNumber(data.amountRefunded)
            };

            return _callbackGetRequest(err, dataResult);
        });
    }

}