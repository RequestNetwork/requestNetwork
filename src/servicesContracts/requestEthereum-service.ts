import BigNumber from 'bignumber.js';

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

    public async createRequestAsPayeeAsync (
        _payer: string,
        _amountInitial: any,
        _data ? : string,
        _extension ? : string,
        _extensionParams ? : Array < any > ,
        _options ? : any,
        ): Promise < any > {
        _amountInitial = new BigNumber(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);

        return new Promise(async (resolve, reject) => {
            try {
                let account = _options.from || await this.web3Single.getDefaultAccount();
                // check _data is a proper JSON
                if (_amountInitial.lt(0)) return reject(Error('_amountInitial must a positive integer'));
                if (!this.web3Single.isAddressNoChecksum(_payer)) return reject(Error('_payer must be a valid eth address'));
                if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return reject(Error('_extension must be a valid eth address'));
                if (_extensionParams && _extensionParams.length > 9) return reject(Error('_extensionParams length must be less than 9'));
                if ( this.web3Single.areSameAddressesNoChecksum(account,_payer) ) {
                    return reject(Error('_from must be different than _payer'));
                }

                _options.value = await this.requestCoreServices.getCollectEstimationAsync(_amountInitial, this.addressRequestEthereum, _extension);

                let paramsParsed: any[];
                if (!_extension || _extension == '') {
                    paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
                } else if(ServiceExtensions.getServiceFromAddress(_extension)) {
                    let parsing = ServiceExtensions.getServiceFromAddress(_extension).parseParameters(_extensionParams);
                    if(parsing.error) {
                      return reject(parsing.error);
                    }
                    paramsParsed = parsing.result;
                } else {
                    return reject(Error('_extension is not supported'));
                }

                this.ipfs.addFile(_data, (err: Error, hash: string) => {
                    if (err) return reject(err);

                    var method = this.instanceRequestEthereum.methods.createRequestAsPayee(
                        _payer,
                        _amountInitial,
                        _extension,
                        paramsParsed,
                        hash);
                    this.web3Single.broadcastMethod(
                        method,
                        (transactionHash: string) => {
                            // we do nothing here!
                        },
                        (receipt: any) => {
                            // we do nothing here!
                        },
                        async (confirmationNumber: number, receipt: any) => {
                            if (confirmationNumber == _options.numberOfConfirmation) {
                                try {
                                    let event = this.web3Single.decodeLog(this.abiRequestCore, 'Created', receipt.events[0]);
                                    let request = await this.getRequestAsync(event.requestId);
                                    return resolve({ request: request, transactionHash: receipt.transactionHash});
                                } catch(e) {
                                    return reject(e);
                                }
                            }
                        },
                        (error: Error) => {
                            return reject(error);
                        },
                        _options);
                });
            } catch(e) {
                return reject(e);
            }
        });
    }

    public async createRequestAsPayee(
        _payer: string,
        _amountInitial: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _data ? : string,
        _extension ? : string,
        _extensionParams ? : Array < any >,
        _options ? : any): Promise<any> {
        _amountInitial = new BigNumber(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);
        try {
            let account = _options.from || await this.web3Single.getDefaultAccount();

            if (_amountInitial.lt(0)) return _callbackTransactionError(Error('_amountInitial must a positive integer'));
            if (!this.web3Single.isAddressNoChecksum(_payer)) return _callbackTransactionError(Error('_payer must be a valid eth address'));
            if (_extension && _extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return _callbackTransactionError(Error('_extension must be a valid eth address'));
            if (_extensionParams && _extensionParams.length > 9) return _callbackTransactionError(Error('_extensionParams length must be less than 9'));
            if ( this.web3Single.areSameAddressesNoChecksum(account, _payer) ) {
                return _callbackTransactionError(Error('account must be different than _payer'));
            }

            _options.value = await this.requestCoreServices.getCollectEstimationAsync(_amountInitial, this.addressRequestEthereum, _extension);

            let paramsParsed: any[];
            if (!_extension || _extension == '') {
                paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
            } else if(ServiceExtensions.getServiceFromAddress(_extension)) {
                let parsing = ServiceExtensions.getServiceFromAddress(_extension).parseParameters(_extensionParams);
                if(parsing.error) {
                  return _callbackTransactionError(parsing.error);
                }
                paramsParsed = parsing.result;
            } else {
                return _callbackTransactionError(Error('_extension is not supported'));
            }

            this.ipfs.addFile(_data, (err: Error, hash: string) => {
                if (err) return _callbackTransactionError(err);

                var method = this.instanceRequestEthereum.methods.createRequestAsPayee(
                    _payer,
                    _amountInitial,
                    _extension,
                    paramsParsed,
                    hash);

                this.web3Single.broadcastMethod(
                    method,
                    _callbackTransactionHash,
                    _callbackTransactionReceipt,
                    _callbackTransactionConfirmation,
                    _callbackTransactionError,
                    _options);
            });
        } catch(e) {
            return _callbackTransactionError(e);
        }
    }


    public acceptAsync(
        _requestId: string,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);

        return new Promise(async (resolve, reject) => {
            try {
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();
                if ( request.state != Types.State.Created) {
                    return reject(Error('request state is not \'created\''));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account,request.payer) ) {
                    return reject(Error('account must be the payer'));
                }

                var method = this.instanceRequestEthereum.methods.accept(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        // we do nothing here!
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            try {
                                var event = this.web3Single.decodeLog(this.abiRequestCore, 'Accepted', receipt.events[0]);
                                let request = await this.getRequestAsync(event.requestId);
                                return resolve({ request: request, transactionHash: receipt.transactionHash});
                            } catch(e) {
                                return reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return reject(error);
                    },
                    _options);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public async accept(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _options = this.web3Single.setUpOptions(_options);

        try {
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();
            if ( request.state != Types.State.Created) {
                return _callbackTransactionError(Error('request state is not \'created\''));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                return _callbackTransactionError(Error('from must be the payer'));
            }

            var method = this.instanceRequestEthereum.methods.accept(_requestId);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            return _callbackTransactionError(e);
        }
    }

    public cancelAsync(
        _requestId: string,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        
        return new Promise(async (resolve, reject) => {
            try {
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return reject(Error('account must be the payer or the payee'));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created ) {
                    return reject(Error('payer can cancel request in state \'created\''));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payee) && request.state == Types.State.Canceled ) {
                    return reject(Error('payee cannot cancel request already canceled'));
                }
                if ( request.balance != 0 ) {
                    return reject(Error('impossible to cancel a Request with a balance != 0'));
                }
                var method = this.instanceRequestEthereum.methods.cancel(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        // we do nothing here!
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            try {
                                var event = this.web3Single.decodeLog(this.abiRequestCore, 'Canceled', receipt.events[0]);
                                let request = await this.getRequestAsync(event.requestId);
                                return resolve({ request: request, transactionHash: receipt.transactionHash});
                            } catch(e) {
                                return reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return reject(error);
                    },
                    _options);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public async cancel(
        _requestId: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _options = this.web3Single.setUpOptions(_options);
        
        try {
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
               return _callbackTransactionError(Error('account must be the payer or the payee'));
            }
            if ( this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created ) {
                return _callbackTransactionError(Error('payer can cancel request in state \'created\''));
            }
            if ( this.web3Single.areSameAddressesNoChecksum(account, request.paye) && request.state == Types.State.Canceled ) {
                return _callbackTransactionError(Error('payee cannot cancel request already \'canceled\''));
            }
            if ( request.balance != 0 ) {
                return _callbackTransactionError(Error('impossible to cancel a Request with a balance != 0'));
            }
            var method = this.instanceRequestEthereum.methods.cancel(_requestId);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            return _callbackTransactionError(e);
        }
    }

    public paymentActionAsync(
        _requestId: string,
        _amount: any,
        _additionals: any,
        _options ? : any): Promise < any > {

        _additionals = new BigNumber(_additionals);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);

        return new Promise(async (resolve, reject) => {
            try {
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();
                // TODO check if this is possible ? (quid if other tx pending)

                if (_options.value.lt(0)) return reject(Error('_amount must a positive integer'));
                if (_additionals.lt(0)) return reject(Error('_additionals must a positive integer'));

                if ( request.state == Types.State.Canceled ) {
                    return reject(Error('request cannot be canceled'));
                }

                var method = this.instanceRequestEthereum.methods.paymentAction(_requestId, _additionals);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        // we do nothing here!
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            try {
                                var event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateBalance', request.state == Types.State.Created ? receipt.events[1] : receipt.events[0]);
                                let requestAfter = await this.getRequestAsync(event.requestId);
                                return resolve({ request: requestAfter, transactionHash: receipt.transactionHash});
                            } catch(e) {
                                return reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return reject(error);
                    },
                    _options);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public async paymentAction(
        _requestId: string,
        _amount: any,
        _additionals: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _additionals = new BigNumber(_additionals);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);
        
        try {            
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();

            // TODO use bigNumber
            if (_options.value.lt(0)) return _callbackTransactionError(Error('_amount must a positive integer'));
            if (_additionals.lt(0)) return _callbackTransactionError(Error('_additionals must a positive integer'));

            if ( request.state == Types.State.Canceled ) {
                return _callbackTransactionError(Error('request cannot be canceled'));
            }

            var method = this.instanceRequestEthereum.methods.paymentAction(_requestId, _additionals);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            return _callbackTransactionError(e);
        }
    }

    public async refundActionAsync(
        _requestId: string,
        _amount: any,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);
        
        return new Promise(async (resolve, reject) => {
            try {
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();

                if (_options.value.lt(0) ) return reject(Error('_amount must a positive integer'));

                if ( request.state != Types.State.Accepted ) {
                    return reject(Error('request must be accepted'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return reject(Error('account must be payee'));
                }

                var method = this.instanceRequestEthereum.methods.refundAction(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        // we do nothing here!
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                                try {
                                    var event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateBalance', receipt.events[0]);
                                    let request = await this.getRequestAsync(event.requestId);
                                    return resolve({ request: request, transactionHash: receipt.transactionHash});
                                } catch(e) {
                                    return reject(e);
                                }
                        }
                    },
                    (error: Error) => {
                        return reject(error);
                    },
                    _options);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public async refundAction(
        _requestId: string,
        _amount: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);
        
        try {
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();

            if (_options.value.lt(0)) return _callbackTransactionError(Error('_amount must a positive integer'));

            if ( request.state != Types.State.Accepted ) {
                return _callbackTransactionError(Error('request must be accepted'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                return _callbackTransactionError(Error('account must be payee'));
            }

            var method = this.instanceRequestEthereum.methods.refundAction(_requestId);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            return _callbackTransactionError(e);
        }
    }

    public subtractActionAsync(
        _requestId: string,
        _amount: any,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BigNumber(_amount);
        
        return new Promise(async (resolve, reject) => {
            try {
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();

                if (_amount.lt(0)) return reject(Error('_amount must a positive integer'));

                if ( request.state == Types.State.Canceled ) {
                    return reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return reject(Error('account must be payee'));
                }

                var method = this.instanceRequestEthereum.methods.subtractAction(_requestId, _amount);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        // we do nothing here!
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            try {
                                var event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateExpectedAmount', receipt.events[0]);
                                let request = await this.getRequestAsync(event.requestId);
                                return resolve({ request: request, transactionHash: receipt.transactionHash});
                            } catch(e) {
                                return reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return reject(error);
                    },
                    _options);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public async subtractAction(
        _requestId: string,
        _amount: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _amount = new BigNumber(_amount);
        _options = this.web3Single.setUpOptions(_options);

        try {
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();

            if (_amount.lt(0)) return _callbackTransactionError(Error('_amount must a positive integer'));

            if ( request.state == Types.State.Canceled ) {
                return _callbackTransactionError(Error('request must be accepted or created'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                return _callbackTransactionError(Error('account must be payee'));
            }

            var method = this.instanceRequestEthereum.methods.subtractAction(_requestId, _amount);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            return _callbackTransactionError(e);
        }
    }




    public additionalActionAsync(
        _requestId: string,
        _amount: any,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BigNumber(_amount);
        
        return new Promise(async (resolve, reject) => {
            try {
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();

                if (_amount.lt(0)) return reject(Error('_amount must a positive integer'));

                if ( request.state == Types.State.Canceled ) {
                    return reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return reject(Error('account must be payer'));
                }

                var method = this.instanceRequestEthereum.methods.additionalAction(_requestId, _amount);

                this.web3Single.broadcastMethod(
                    method,
                    (transactionHash: string) => {
                        // we do nothing here!
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber == _options.numberOfConfirmation) {
                            try {
                                var event = this.web3Single.decodeLog(this.abiRequestCore, 'UpdateExpectedAmount', receipt.events[0]);
                                let request = await this.getRequestAsync(event.requestId);
                                return resolve({ request: request, transactionHash: receipt.transactionHash});
                            } catch(e) {
                                return reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return reject(error);
                    },
                    _options);
            } catch(e) {
                return reject(e);
            }
        });
    }

    public async additionalAction(
        _requestId: string,
        _amount: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _amount = new BigNumber(_amount);
        _options = this.web3Single.setUpOptions(_options);

        try {
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();

            if (_amount.lt(0)) return _callbackTransactionError(Error('_amount must a positive integer'));

            if ( request.state == Types.State.Canceled ) {
                return _callbackTransactionError(Error('request must be accepted or created'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                return _callbackTransactionError(Error('account must be payer'));
            }

            var method = this.instanceRequestEthereum.methods.additionalAction(_requestId, _amount);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            return _callbackTransactionError(e);
        }
    }

    public withdrawAsync(_options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        
        return new Promise((resolve, reject) => {
            var method = this.instanceRequestEthereum.methods.withdraw();

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
                        try {
                            return resolve({ transactionHash: receipt.transactionHash });
                        } catch(e) {
                            return reject(e);
                        }
                    }
                },
                (error: Error) => {
                    return reject(error);
                },
                _options);
        });
    }

    public withdraw(
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): void {
        _options = this.web3Single.setUpOptions(_options);
        
        var method = this.instanceRequestEthereum.methods.withdraw();

        this.web3Single.broadcastMethod(
            method,
            _callbackTransactionHash,
            _callbackTransactionReceipt,
            _callbackTransactionConfirmation,
            _callbackTransactionError,
            _options);
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
}