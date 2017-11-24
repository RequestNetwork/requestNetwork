import config from '../config';
import BigNumber from 'bignumber.js';

import * as Types from '../types';
import Artifacts from '../artifacts';
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
    protected addressRequestCore: string;
    protected instanceRequestCore: any;

    protected abiRequestEthereum: any;
    protected addressRequestEthereum: string;
    protected instanceRequestEthereum: any;

    constructor(web3Provider ? : any) {
        this.web3Single = new Web3Single(web3Provider);
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCore = requestCore_Artifact.abi;
        this.addressRequestCore = config.ethereum.contracts.requestCore;
        this.instanceRequestCore = new this.web3Single.web3.eth.Contract(this.abiRequestCore, this.addressRequestCore);

        this.abiRequestEthereum = requestEthereum_Artifact.abi;
        this.addressRequestEthereum = config.ethereum.contracts.requestEthereum;
        this.instanceRequestEthereum = new this.web3Single.web3.eth.Contract(this.abiRequestEthereum, this.addressRequestEthereum);
    }

    public async createRequestAsPayeeAsync (
        _payer: string,
        _amountInitial: any,
        _details: string,
        _extension ? : string,
        _extensionParams ? : Array < any > ,
        _options ? : any,
        ): Promise < any > {
        _amountInitial = new BigNumber(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);

        return new Promise(async (resolve, reject) => {
            let account = _options.from || await this.web3Single.getDefaultAccount();
            // check _details is a proper JSON
            if (_amountInitial.lt(0)  ) return reject(Error('_amountInitial must a positive integer'));
            if (!this.web3Single.isAddressNoChecksum(_payer)) return reject(Error('_payer must be a valid eth address'));
            if (_extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return reject(Error('_extension must be a valid eth address'));
            if (_extensionParams.length > 9) return reject(Error('_extensionParams length must be less than 9'));
            if ( this.web3Single.areSameAddressesNoChecksum(account,_payer) ) {
                return reject(Error('_from must be different than _payer'));
            }

            let paramsParsed: any[];
            if (ServiceExtensions.getServiceFromAddress(_extension)) {
                let parsing = ServiceExtensions.getServiceFromAddress(_extension,this.web3Single.web3.currentProvider).parseParameters(_extensionParams);
                if(parsing.error) {
                  return reject(parsing.error);
                }
                paramsParsed = parsing.result;
            } else {
                paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
            }

            this.ipfs.addFile(JSON.parse(_details), (err: Error, hash: string) => {
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
                            let event = this.web3Single.decodeLog(this.abiRequestCore, 'Created', receipt.events[0]);
                            let request = await this.getRequestAsync(event.requestId);
                            return resolve({ request: request, transactionHash: receipt.transactionHash});
                        }
                    },
                    (error: Error) => {
                        return reject(error);
                    },
                    _options);
            });
        });
    }

    public async createRequestAsPayee(
        _payer: string,
        _amountInitial: any,
        _extension: string,
        _extensionParams: Array < any > ,
        _details: string,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _amountInitial = new BigNumber(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);
        let account = _options.from || await this.web3Single.getDefaultAccount();

        if (_amountInitial.lt(0)) return _callbackTransactionError(Error('_amountInitial must a positive integer'));
        if (!this.web3Single.isAddressNoChecksum(_payer)) return _callbackTransactionError(Error('_payer must be a valid eth address'));
        if (_extension != '' && !this.web3Single.isAddressNoChecksum(_extension)) return _callbackTransactionError(Error('_extension must be a valid eth address'));
        if (_extensionParams.length > 9) return _callbackTransactionError(Error('_extensionParams length must be less than 9'));
        if ( this.web3Single.areSameAddressesNoChecksum(account, _payer) ) {
            return _callbackTransactionError(Error('account must be different than _payer'));
        }

        let paramsParsed: any[];
        if (ServiceExtensions.getServiceFromAddress(_extension)) {
            let parsing = ServiceExtensions.getServiceFromAddress(_extension,this.web3Single.web3.currentProvider).parseParameters(_extensionParams);
            if(parsing.error) {
                return _callbackTransactionError(Error(parsing.error));
            }
            paramsParsed = parsing.result;
        } else {
            paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
        }

        this.ipfs.addFile(JSON.parse(_details), (err: Error, hash: string) => {
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
    }


    public acceptAsync(
        _requestId: string,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);

        return new Promise(async (resolve, reject) => {
            try {
                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();
                if ( request.state != Types.State.Created) {
                    return reject(Error('request state is not \'created\''));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account,request.payer) ) {
                    return reject(Error('account must be the payer'));
                }

                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

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
                            var event = this.web3Single.decodeLog(this.abiRequestCore, 'Accepted', receipt.events[0]);
                            let request = await this.getRequestAsync(event.requestId);
                            return resolve({ request: request, transactionHash: receipt.transactionHash});
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
            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();
            if ( request.state != Types.State.Created) {
                return _callbackTransactionError(Error('request state is not \'created\''));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                return _callbackTransactionError(Error('from must be the payer'));
            }
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            var method = this.instanceRequestEthereum.methods.accept(_requestId);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            throw e;
        }
    }

    public cancelAsync(
        _requestId: string,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        
        return new Promise(async (resolve, reject) => {
            try {
                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return reject(Error('account must be the payer or the payee'));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created ) {
                    return reject(Error('payer can cancel request in state \'created\''));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payee) && request.state == Types.State.Canceled ) {
                    return reject(Error('payer cannot cancel request already canceled'));
                }
                if ( request.amountPaid != 0 ) {
                    return reject(Error('impossible to cancel a Request with a balance != 0'));
                }
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

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
                            var event = this.web3Single.decodeLog(this.abiRequestCore, 'Canceled', receipt.events[0]);
                            let request = await this.getRequestAsync(event.requestId);
                            return resolve({ request: request, transactionHash: receipt.transactionHash});
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
            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) && !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
               return _callbackTransactionError(Error('account must be the payer or the payee'));
            }
            if ( this.web3Single.areSameAddressesNoChecksum(account, request.payer) && request.state != Types.State.Created ) {
                return _callbackTransactionError(Error('payer can cancel request in state \'created\''));
            }
            if ( this.web3Single.areSameAddressesNoChecksum(account, request.paye) && request.state == Types.State.Canceled ) {
                return _callbackTransactionError(Error('payer cannot cancel request already \'canceled\''));
            }
            if ( request.amountPaid != 0 ) {
                return _callbackTransactionError(Error('impossible to cancel a Request with a balance != 0'));
            }
            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            var method = this.instanceRequestEthereum.methods.cancel(_requestId);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            throw e;
        }
    }

    public payAsync(
        _requestId: string,
        _amount: any,
        _tips: any,
        _options ? : any): Promise < any > {

        _tips = new BigNumber(_tips);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);

        return new Promise(async (resolve, reject) => {
            try {
                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();

                // TODO check from == payer ?
                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
                // TODO use bigNumber
                if (_options.value.lt(0)) return reject(Error('_amount must a positive integer'));
                // TODO use bigNumber
                if (_tips.lt(0)) return reject(Error('_tips must a positive integer'));

                if ( request.state != Types.State.Accepted ) {
                    return reject(Error('request must be accepted'));
                }
                if ( _options.value.lt(_tips) ) {
                    return reject(Error('tips declare must be lower than amount sent'));
                }
                if ( request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract).lt(_amount) ) {
                    return reject(Error('You cannot pay more than amount needed'));
                }

                var method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);

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
                            var event = this.web3Single.decodeLog(this.abiRequestCore, 'Payment', receipt.events[0]);
                            let request = await this.getRequestAsync(event.requestId);
                            return resolve({ request: request, transactionHash: receipt.transactionHash});
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

    public async pay(
        _requestId: string,
        _amount: any,
        _tips: any,
        _callbackTransactionHash: Types.CallbackTransactionHash,
        _callbackTransactionReceipt: Types.CallbackTransactionReceipt,
        _callbackTransactionConfirmation: Types.CallbackTransactionConfirmation,
        _callbackTransactionError: Types.CallbackTransactionError,
        _options ? : any): Promise<any> {
        _tips = new BigNumber(_tips);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);
        
        try {
            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();

            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            // TODO use bigNumber
            if (_options.value.lt(0) /* || !_amount.isInteger()*/ ) return _callbackTransactionError(Error('_amount must a positive integer'));
            // TODO use bigNumber
            if (_tips.lt(0) /* || !_tips.isInteger()*/ ) return _callbackTransactionError(Error('_tips must a positive integer'));
            if ( request.state != Types.State.Accepted ) {
                return _callbackTransactionError(Error('request must be accepted'));
            }
            if ( _options.value.lt(_tips) ) {
                return _callbackTransactionError(Error('tips declare must be lower than amount sent'));
            }
            if ( request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract).lt(_amount) ) {
                return _callbackTransactionError(Error('You cannot pay more than amount needed'));
            }

            var method = this.instanceRequestEthereum.methods.pay(_requestId, _tips);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            throw e;
        }
    }


    public async paybackAsync(
        _requestId: string,
        _amount: any,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BigNumber(_amount);
        
        return new Promise(async (resolve, reject) => {
            try {
                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();

                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
                // TODO use bigNumber
                if (_options.value.lt(0) ) return reject(Error('_amount must a positive integer'));

                if ( request.state != Types.State.Accepted ) {
                    return reject(Error('request must be accepted'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return reject(Error('account must be payee'));
                }
                if ( _options.value.gt(request.amountPaid) ) {
                    return reject(Error('You cannot payback more than what has been paid'));
                }

                var method = this.instanceRequestEthereum.methods.payback(_requestId);

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
                            var event = this.web3Single.decodeLog(this.abiRequestCore, 'Refunded', receipt.events[0]);
                            let request = await this.getRequestAsync(event.requestId);
                            return resolve({ request: request, transactionHash: receipt.transactionHash});
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

    public async payback(
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
            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();

            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            // TODO use bigNumber
            if (_options.value.lt(0)) return _callbackTransactionError(Error('_amount must a positive integer'));

            if ( request.state != Types.State.Accepted ) {
                return _callbackTransactionError(Error('request must be accepted'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                return _callbackTransactionError(Error('account must be payee'));
            }
            if ( _options.value.gt(request.amountPaid) ) {
                return _callbackTransactionError(Error('You cannot payback more than what has been paid'));
            }

            var method = this.instanceRequestEthereum.methods.payback(_requestId);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            throw e;
        }
    }


    public discountAsync(
        _requestId: string,
        _amount: any,
        _options ? : any): Promise < any > {
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BigNumber(_amount);
        
        return new Promise(async (resolve, reject) => {
            try {
                let request = await this.getRequestAsync(_requestId);    
                let account = _options.from || await this.web3Single.getDefaultAccount();

                // TODO check if this is possible ? (quid if other tx pending)
                if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
                // TODO use bigNumber
                if (_amount.lt(0)) return reject(Error('_amount must a positive integer'));

                if ( request.state == Types.State.Canceled ) {
                    return reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return reject(Error('account must be payee'));
                }

                if ( request.amountPaid.add(_amount).gt(request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract))) {
                    return reject(Error('You cannot discount more than necessary'));
                }

                var method = this.instanceRequestEthereum.methods.discount(_requestId, _amount);

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
                            var event = this.web3Single.decodeLog(this.abiRequestCore, 'AddSubtract', receipt.events[0]);
                            let request = await this.getRequestAsync(event.requestId);
                            return resolve({ request: request, transactionHash: receipt.transactionHash});
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

    public async discount(
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
            let request = await this.getRequestAsync(_requestId);    
            let account = _options.from || await this.web3Single.getDefaultAccount();

            // TODO check if this is possible ? (quid if other tx pending)
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackTransactionError(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));
            // TODO use bigNumber
            if (_amount.lt(0)) return _callbackTransactionError(Error('_amount must a positive integer'));

            if ( request.state == Types.State.Canceled ) {
                return _callbackTransactionError(Error('request must be accepted or created'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                return _callbackTransactionError(Error('account must be payee'));
            }
            if ( _amount.add(request.amountPaid).gt(request.amountInitial.add(request.amountAdditional).sub(request.amountSubtract))) {
                return _callbackTransactionError(Error('You cannot payback more than what has been paid'));
            }

            var method = this.instanceRequestEthereum.methods.discount(_requestId, _amount);

            this.web3Single.broadcastMethod(
                method,
                _callbackTransactionHash,
                _callbackTransactionReceipt,
                _callbackTransactionConfirmation,
                _callbackTransactionError,
                _options);
        } catch(e) {
            throw e;
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
                        return resolve({ transactionHash: receipt.transactionHash });
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

    public getRequestAsync(
        _requestId: string): Promise < any > {
        return new Promise((resolve, reject) => {
            if (!this.web3Single.isHexStrictBytes32(_requestId)) return reject(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''));

            this.instanceRequestCore.methods.requests(_requestId).call(async(err: Error, data: any) => {
                if (err) return reject(err);

                let dataResult: any = {
                    requestId: _requestId,
                    creator: data.creator,
                    payee: data.payee,
                    payer: data.payer,
                    amountInitial: new BigNumber(data.amountInitial),
                    subContract: data.subContract,
                    amountPaid: new BigNumber(data.amountPaid),
                    amountAdditional: new BigNumber(data.amountAdditional),
                    amountSubtract: new BigNumber(data.amountSubtract),
                    state: data.state,
                    extension: data.extension,
                    details: data.details,
                };

                if (ServiceExtensions.getServiceFromAddress(data.extension)) {
                    let extensionDetails = await ServiceExtensions.getServiceFromAddress(data.extension,this.web3Single.web3.currentProvider).getRequestAsync(_requestId);
                    dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
                }

                if (dataResult.details) {
                    try {
                        dataResult.details = {hash:dataResult.details, data:JSON.parse(await this.ipfs.getFileAsync(dataResult.details))};
                    } catch (e) {
                        return reject(e);
                    }
                }
                return resolve(dataResult);
            });
        });
    }

    public getRequest(
        _requestId: string,
        _callbackGetRequest: Types.CallbackGetRequest) {
        if (!this.web3Single.isHexStrictBytes32(_requestId)) return _callbackGetRequest(Error('_requestId must be a 32 bytes hex string (eg.: \'0x0000000000000000000000000000000000000000000000000000000000000000\''),undefined);

        this.instanceRequestCore.methods.requests(_requestId).call(async(err: Error, data: any) => {
            if (err) return _callbackGetRequest(err, data);

            let dataResult: any = {
                requestId: _requestId,
                creator: data.creator,
                payee: data.payee,
                payer: data.payer,
                amountInitial: new BigNumber(data.amountInitial),
                subContract: data.subContract,
                amountPaid: new BigNumber(data.amountPaid),
                amountAdditional: new BigNumber(data.amountAdditional),
                amountSubtract: new BigNumber(data.amountSubtract),
                state: data.state,
                extension: data.extension,
                details: data.details,
            };

            if (ServiceExtensions.getServiceFromAddress(data.extension)) {
                let extensionDetails = await ServiceExtensions.getServiceFromAddress(data.extension,this.web3Single.web3.currentProvider).getRequestAsync(_requestId);
                dataResult.extension = Object.assign(extensionDetails, { address: dataResult.extension });
            }

            if (dataResult.details) {
                // get IPFS data :
                this.ipfs.getFile(dataResult.details, (err: Error, data: string) => {
                    if (err) return _callbackGetRequest(err, dataResult);
                    dataResult.details = {hash:dataResult, data:JSON.parse(data)};
                    return _callbackGetRequest(err, dataResult);
                });
            } else {
                return _callbackGetRequest(err, dataResult);
            }
        });
    }        
}