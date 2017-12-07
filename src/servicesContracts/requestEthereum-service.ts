import BigNumber from 'bignumber.js';

import * as Web3PromiEvent from 'web3-core-promievent';

import * as Types from '../types';
import Artifacts from '../artifacts';
import RequestCoreService from '../servicesCore/requestCore-service';
import * as ServiceExtensions from '../servicesExtensions';

const requestEthereum_Artifact = Artifacts.RequestEthereumArtifact;
const requestCore_Artifact = Artifacts.RequestCoreArtifact;

import { Web3Single } from '../servicesExternal/web3-single';
import Ipfs from '../servicesExternal/ipfs-service';

export default class RequestEthereumService {
    private web3Single: Web3Single;
    protected ipfs: any;

    // RequestEthereum on blockchain
    protected abiRequestCore: any;
    protected requestCoreServices:any;

    protected abiRequestEthereum: any;
    protected addressRequestEthereum: string;
    protected instanceRequestEthereum: any;

    constructor() {
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCore = requestCore_Artifact.abi;
        this.requestCoreServices = new RequestCoreService();

        this.abiRequestEthereum = requestEthereum_Artifact.abi;
        if(!requestEthereum_Artifact.networks[this.web3Single.networkName]) {
            throw Error('RequestEthereum Artifact does not have configuration for network : "'+this.web3Single.networkName+'"');
        }
        this.addressRequestEthereum = requestEthereum_Artifact.networks[this.web3Single.networkName].address;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }



    public createRequestAsPayee (
        _payer: string,
        _amountInitial: any,
        _data ? : string,
        _extension ? : string,
        _extensionParams ? : Array < any > ,
        _options ? : any,
        ): Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _amountInitial = new BigNumber(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            if (_amountInitial.lt(0)) return promiEvent.reject(Error('_amountInitial must a positive integer'));
            if (!this.web3Single.isAddressNoChecksum(_payer)) return promiEvent.reject(Error('_payer must be a valid eth address'));
            if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return promiEvent.reject(Error('_extension must be a valid eth address'));
            if (_extensionParams && _extensionParams.length > 9) return promiEvent.reject(Error('_extensionParams length must be less than 9'));
            if ( this.web3Single.areSameAddressesNoChecksum(account,_payer) ) {
                return promiEvent.reject(Error('_from must be different than _payer'));
            }

            this.requestCoreServices.getCollectEstimation(_amountInitial, this.addressRequestEthereum, _extension, (err,collectEstimation) => {
                if(err) return promiEvent.reject(err);
                _options.value = collectEstimation;

                // parse extension parameters
                let paramsParsed: any[];
                if (!_extension || _extension == '') {
                    paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
                } else if(ServiceExtensions.getServiceFromAddress(_extension)) {
                    let parsing = ServiceExtensions.getServiceFromAddress(_extension).parseParameters(_extensionParams);
                    if(parsing.error) {
                      return promiEvent.reject(parsing.error);
                    }
                    paramsParsed = parsing.result;
                } else {
                    return promiEvent.reject(Error('_extension is not supported'));
                }

                this.ipfs.addFile(_data, (err: Error, hash: string) => {
                    if (err) return promiEvent.reject(err);

                    var method = this.instanceRequestEthereum.methods.createRequestAsPayee(
                        _payer,
                        _amountInitial,
                        _extension,
                        paramsParsed,
                        hash);
                    this.web3Single.broadcastMethod(
                        method,
                        (transactionHash: string) => {
                            return promiEvent.eventEmitter.emit('broadcasted',{ transactionHash: transactionHash});
                        },
                        (receipt: any) => {
                            // we do nothing here!
                        },
                        (confirmationNumber: number, receipt: any) => {
                            if (confirmationNumber == _options.numberOfConfirmation) 
                            {
                                let event = this.web3Single.decodeLog(this.abiRequestCore, 'Created', receipt.events[0]);
                                this.getRequest(event.requestId, (err,request) => {
                                    if(err) return promiEvent.reject(err);
                                    promiEvent.resolve({ request: request, transactionHash: receipt.transactionHash});
                                });
                            }
                        },
                        (err: Error) => {
                            return promiEvent.reject(err);
                        },
                        _options);
                });

             });
        });
        return promiEvent.eventEmitter;
    }


    public accept(
        _requestId: string,
        _options ? : any): Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if (request.state != Types.State.Created) {
                    return promiEvent.reject(Error('request state is not \'created\''));
                }
                if (!this.web3Single.areSameAddressesNoChecksum(account,request.payer) ) {
                    return promiEvent.reject(Error('account must be the payer'));
                }

                var method = this.instanceRequestEthereum.methods.accept(_requestId);

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
                            let event = this.web3Single.decodeLog(this.abiRequestCore, 'Accepted', receipt.events[0]);
                            this.getRequest(event.requestId, (err,request) => {
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

    public cancel(
        _requestId: string,
        _options ? : any): Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return promiEvent.reject(Error('account must be the payer or the payee'));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created ) {
                    return promiEvent.reject(Error('payer can cancel request in state \'created\''));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payee) && request.state == Types.State.Canceled ) {
                    return promiEvent.reject(Error('payee cannot cancel request already canceled'));
                }
                if ( request.balance != 0 ) {
                    return promiEvent.reject(Error('impossible to cancel a Request with a balance != 0'));
                }

                var method = this.instanceRequestEthereum.methods.cancel(_requestId);

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
                            let event = this.web3Single.decodeLog(this.abiRequestCore, 'Canceled', receipt.events[0]);
                            this.getRequest(event.requestId, (err,request) => {
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

    public paymentAction(
        _requestId: string,
        _amount: any,
        _additionals: any,
        _options ? : any): Web3PromiEvent {
        let promiEvent = Web3PromiEvent();

        _additionals = new BigNumber(_additionals);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if (_options.value.lt(0)) return promiEvent.reject(Error('_amount must a positive integer'));
                if (_additionals.lt(0)) return promiEvent.reject(Error('_additionals must a positive integer'));
                if ( request.state == Types.State.Canceled ) {
                    return promiEvent.reject(Error('request cannot be canceled'));
                }

                var method = this.instanceRequestEthereum.methods.paymentAction(_requestId, _additionals);

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
                            let event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateBalance', request.state == Types.State.Created ? receipt.events[1] : receipt.events[0]);
                            this.getRequest(event.requestId, (err,request) => {
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

    public refundAction(
        _requestId: string,
        _amount: any,
        _options ? : any): Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if ( request.state != Types.State.Accepted ) {
                    return promiEvent.reject(Error('request must be accepted'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return promiEvent.reject(Error('account must be payee'));
                }

                var method = this.instanceRequestEthereum.methods.refundAction(_requestId);

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
                            let event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateBalance', receipt.events[0]);
                            this.getRequest(event.requestId, (err,request) => {
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

    public subtractAction(
        _requestId: string,
        _amount: any,
        _options ? : any):  Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BigNumber(_amount);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if (_amount.lt(0)) return promiEvent.reject(Error('_amount must a positive integer'));

                if ( request.state == Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return promiEvent.reject(Error('account must be payee'));
                }

                var method = this.instanceRequestEthereum.methods.subtractAction(_requestId, _amount);

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
                            let event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateExpectedAmoun', receipt.events[0]);
                            this.getRequest(event.requestId, (err,request) => {
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

    public additionalAction(
        _requestId: string,
        _amount: any,
        _options ? : any):  Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BigNumber(_amount);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            this.getRequest(_requestId, (err,request) => {
                if (err) return promiEvent.reject(err);

                if (_amount.lt(0)) return promiEvent.reject(Error('_amount must a positive integer'));

                if ( request.state == Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be payer'));
                }

                var method = this.instanceRequestEthereum.methods.additionalAction(_requestId, _amount);

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
                            let event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateExpectedAmoun', receipt.events[0]);
                            this.getRequest(event.requestId, (err,request) => {
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




    public withdraw(_options ? : any):  Web3PromiEvent {
        let promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccount((err,defaultAccount) => {
            if(!_options.from && err) return promiEvent.reject(err);
            let account = _options.from || defaultAccount;

            var method = this.instanceRequestEthereum.methods.withdraw();
                
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
                        return promiEvent.resolve({ transactionHash: receipt.transactionHash });
                    }
                },
                (error: Error) => {
                    return promiEvent.reject(error);
                },
                _options);
        });

        return promiEvent.eventEmitter;
    }


    public getRequestCurrencyContractInfoAsync(
        _requestId: string): Promise < any > {
        return new Promise(async (resolve, reject) => {
            return resolve({});
        });
    }

    public getRequestCurrencyContractInfo(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest): void {
            return _callbackGetRequest(null,{});
    }


    // public getRequestAsync(
    //     _requestId: string): Promise < any > {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let dataResult = await this.requestCoreServices.getRequestAsync(_requestId);
    //             return resolve(dataResult);
    //         } catch(e) {
    //             return reject(e);
    //         }
    //     });
    // }

    public getRequest(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest): void {
        this.requestCoreServices.getRequest(_requestId,_callbackGetRequest);
    }        
}