import config from '../config';
import * as Types from '../types';
import Artifacts from '../artifacts';
import BigNumber from 'bignumber.js';
import * as Web3PromiEvent from 'web3-core-promievent';
// import * as ServicesContracts from '../servicesContracts';
import RequestCoreService from '../servicesCore/requestCore-service';

const requestCore_Artifact = Artifacts.RequestCoreArtifact;
const requestSynchroneExtensionEscrow_Artifact = Artifacts.RequestSynchroneExtensionEscrowArtifact;

import { Web3Single } from '../servicesExternal/web3-single';

export default class RequestSynchroneExtensionEscrowService {
    protected web3Single: any;

    // RequestEthereum on blockchain
    protected abiRequestCore: any;
    protected requestCoreServices:any;

    protected abiSynchroneExtensionEscrow: any;
    protected addressSynchroneExtensionEscrow: string;
    protected instanceSynchroneExtensionEscrow: any;

    constructor() {
        this.web3Single = Web3Single.getInstance();

        this.abiRequestCore = requestCore_Artifact.abi;
        this.requestCoreServices = new RequestCoreService();

        this.abiSynchroneExtensionEscrow = requestSynchroneExtensionEscrow_Artifact.abi;
        if(!requestSynchroneExtensionEscrow_Artifact.networks[this.web3Single.networkName]) {
            throw Error('requestSynchroneExtensionEscrow Artifact does not have configuration for network : "'+this.web3Single.networkName+'"');
        }
        this.addressSynchroneExtensionEscrow = requestSynchroneExtensionEscrow_Artifact.networks[this.web3Single.networkName].address;
        this.instanceSynchroneExtensionEscrow = new this.web3Single.web3.eth.Contract(this.abiSynchroneExtensionEscrow, this.addressSynchroneExtensionEscrow);
    }

    public parseParameters(_extensionParams: any[]): any {
        if(!_extensionParams || !this.web3Single.isAddressNoChecksum(_extensionParams[0])) {
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

    public releaseToPayeeAction(
        _requestId: string,
        _options ? : any): Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if(!request.extension) {
                    return promiEvent.reject(Error('request doesn\'t have an extension'));
                }
                if(request.extension.address.toLowerCase() != this.addressSynchroneExtensionEscrow.toLowerCase()) {
                    return promiEvent.reject(Error('request\'s extension is not sync. escrow'));
                }
                if(!this.web3Single.areSameAddressesNoChecksum(account, request.payer) && account != request.extension.escrow) {
                    return promiEvent.reject(Error('account must be payer or escrow'));
                }
                if(request.extension.state != Types.EscrowState.Created) {
                    return promiEvent.reject(Error('Escrow state must be \'Created\''));
                }
                if(request.state != Types.State.Accepted) {
                    return promiEvent.reject(Error('State must be \'Accepted\''));
                }

                var method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayee(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted',{ transactionHash: transactionHash});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            var event = this.web3Single.decodeEvent(this.abiRequestCore, 'EscrowReleaseRequest', receipt.events[0]);
                            this.getRequest(_requestId, (err,request) => {
                                if(err) return promiEvent.reject(err);
                                promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash});
                            });
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            });
        });

        return promiEvent.eventEmitter;
    }


    public releaseToPayerAction(
        _requestId: string,
        _options ? : any): Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if(!request.extension) {
                    return promiEvent.reject(Error('request doesn\'t have an extension'));
                }
                if(request.extension.address.toLowerCase() != this.addressSynchroneExtensionEscrow.toLowerCase()) {
                    return promiEvent.reject(Error('request\'s extension is not sync. escrow'));
                }
                if(!this.web3Single.areSameAddressesNoChecksum(account, request.payee) && !this.web3Single.areSameAddressesNoChecksum(account, request.extension.escrow)) {
                    return promiEvent.reject(Error('account must be payee or escrow'));
                }
                if(request.extension.state != Types.EscrowState.Created) {
                    return promiEvent.reject(Error('Escrow state must be \'Created\''));
                }
                if(request.state != Types.State.Accepted) {
                    return promiEvent.reject(Error('State must be \'Accepted\''));
                }

                var method = this.instanceSynchroneExtensionEscrow.methods.releaseToPayerAction(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted',{ transactionHash: transactionHash});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            var event = this.web3Single.decodeEvent(this.abiRequestCore, 'EscrowRefundRequest', receipt.events[0]);
                            this.getRequest(_requestId, (err,request) => {
                                if(err) return promiEvent.reject(err);
                                promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash});
                            });
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            });
        });

        return promiEvent.eventEmitter;
    }


    public getRequestAsync(
        _requestId: string): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try {
                let dataResult = await this.requestCoreServices.getRequestAsync(_requestId);
                return resolve(dataResult);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public getRequest(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest): void {
        this.requestCoreServices.getRequest(_requestId,_callbackGetRequest);
    }       

    public getRequestExtensionInfoAsync(
        _requestId: string): Promise < any > {
        
        return new Promise((resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err: Error, data: any) => {
                if (err) return reject(err);

                let dataResult: any = {
                    currencyContract: data.currencyContract,
                    escrow: data.escrow,
                    state: data.state,
                    balance: new BigNumber(data.balance)
                };

                return resolve(dataResult);
            });
        });
    }

    public getRequestExtensionInfo(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest) {

        if (!this.web3Single.isHexStrictBytes32(_requestId)) throw Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\'');

        this.instanceSynchroneExtensionEscrow.methods.escrows(_requestId).call((err: Error, data: any) => {
            if (err) return _callbackGetRequest(err, data);

            let dataResult: any = {
                currencyContract: data.currencyContract,
                escrow: data.escrow,
                state: data.state,
                balance: new BigNumber(data.balance)
            };

            return _callbackGetRequest(err, dataResult);
        });
    }

}