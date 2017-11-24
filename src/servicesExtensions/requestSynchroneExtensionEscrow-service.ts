import config from '../config';
import * as Types from '../types';
import Artifacts from '../artifacts';
import BigNumber from 'bignumber.js';
import * as ServicesContracts from '../servicesContracts';

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

    public parseParameters(_extensionParams: any[]): any {
        if(!this.web3Single.isAddressNoChecksum(_extensionParams[0])) {
            return {error:Error('first parameter must be a valid eth address')}
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
        _options ?: any ): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(async (resolve, reject) => {
            let account = _options.from || await this.web3Single.getDefaultAccount();

            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            let request = await this.getRequestSubContractAsync(_requestId);

            if(!this.web3Single.areSameAddressesNoChecksum(account, request.payer) && account != request.extension.escrow) {
                return reject(Error('account must be payer or escrow'));
            }
            if(request.extension.state != Types.EscrowState.Created) {
                return reject(Error('Escrow state must be \'Created\''));
            }
            if(request.state != Types.State.Accepted) {
                return reject(Error('State must be \'Accepted\''));
            }

            var method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);

            this.web3Single.broadcastMethod(
                method,
                (transactionHash: string) => {
                    // we do nothing here!
                },
                (receipt: any) => {
                    // we do nothing here!
                },
                (confirmationNumber: number, receipt: any) => {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        // check in case of failed : no event
                        return resolve({ requestId: receipt.events.EscrowReleaseRequest.returnValues.requestId, transactionHash: receipt.transactionHash });
                    }
                },
                (error: Error) => {
                    return reject(error);
                },
                _options);
        });
    }

    public async releaseToPayee(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ?: any): Promise<any> {
        _options = this.web3Single.setUpOptions(_options);
        let account = _options.from || await this.web3Single.getDefaultAccount();

        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
        let request = await this.getRequestSubContractAsync(_requestId);
        if(!this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
            return _callbackTransactionError(Error('account must be payer or escrow'));
        }
        if(request.extension.state != Types.EscrowState.Created) {
            return _callbackTransactionError(Error('Escrow state must be \'Created\''));
        }
        if(request.state != Types.State.Accepted) {
            return _callbackTransactionError(Error('State must be \'Accepted\''));
        }

        var method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError,
            _options);
    }

    public refundToPayerAsync(
        _requestId: string,
        _options ?: any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        return new Promise(async (resolve, reject) => {
            let account = _options.from || await this.web3Single.getDefaultAccount();
            // TODO check from == payee or escrow ?
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            let request = await this.getRequestSubContractAsync(_requestId);
            if(!this.web3Single.areSameAddressesNoChecksum(account, request.payee) && !this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
                return reject(Error('account must be payee or escrow'));
            }
            if(request.extension.state != Types.EscrowState.Created) {
                return reject(Error('Escrow state must be \'Created\''));
            }
            if(request.state != Types.State.Accepted) {
                return reject(Error('State must be \'Accepted\''));
            }

            var method = this.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);

            this.web3Single.broadcastMethod(
                method,
                (transactionHash: string) => {
                    // we do nothing here!
                },
                (receipt: any) => {
                    // we do nothing here!
                },
                (confirmationNumber: number, receipt: any) => {
                    if (confirmationNumber == _options.numberOfConfirmation) {
                        var event = this.web3Single.decodeLog(this.abiRequestCore, 'EscrowRefundRequest', receipt.events[0]);
                        return resolve({ requestId: event.requestId, transactionHash: receipt.transactionHash });
                    }
                },
                (error: Error) => {
                    return reject(error);
                },
                _options);
        });
    }

    public async refundToPayer(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ?: any): Promise<any> {
        _options = this.web3Single.setUpOptions(_options);
        let account = _options.from || await this.web3Single.getDefaultAccount();
        // TODO check from == payee or escrow ?
        // TODO check if this is possible ? (quid if other tx pending)
        if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

        let request = await this.getRequestSubContractAsync(_requestId);
        if(!this.web3Single.areSameAddressesNoChecksum(account, request.payee) && !this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
            return _callbackTransactionError(Error('account must be payee or escrow'));
        }
        if(request.extension.state != Types.EscrowState.Created) {
            return _callbackTransactionError(Error('Escrow state must be \'Created\''));
        }
        if(request.state != Types.State.Accepted) {
            return _callbackTransactionError(Error('State must be \'Accepted\''));
        }

        var method = this.instanceSynchroneExtensionEscrow.methods.refundToPayer(_requestId);

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError,
            _options);
    }


    public getRequestAsync(
        _requestId: string): Promise < any > {
        
        return new Promise((resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err: Error, data: any) => {
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

        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');

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

    public getRequestSubContractAsync(
        _requestId: string): Promise < any > {
        return new Promise((resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err: Error, data: any) => {
                if (err) return reject(err);
                ServicesContracts.getServiceFromAddress(data.subContract,this.web3Single.web3.currentProvider).getRequest(_requestId, (err: Error, data: any) => {
                   if (err) return reject(err);
                   return resolve(data);
                });
            });
        });
    }

    public getRequestSubContract(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest) {

        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');

        this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err: Error, data: any) => {
            if (err) return _callbackGetRequest(err, data);
            ServicesContracts.getServiceFromAddress(data.subContract,this.web3Single.web3.currentProvider).getRequest(_requestId, _callbackGetRequest);
        }); 
    }
}