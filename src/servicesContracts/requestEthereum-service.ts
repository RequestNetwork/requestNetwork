import RequestCoreService from '../servicesCore/requestCore-service';
import Ipfs from '../servicesExternal/ipfs-service';

import { Web3Single } from '../servicesExternal/web3-single';

import * as ServiceContracts from '../servicesContracts';

import * as Types from '../types';

import * as ETH_UTIL from 'ethereumjs-util';
// @ts-ignore
import * as Web3PromiEvent from 'web3-core-promievent';

// @ts-ignore
const ETH_ABI = require('../lib/ethereumjs-abi-perso.js');

const BN = Web3Single.BN();

/**
 * The RequestEthereumService class is the interface for the Request Ethereum currency contract
 */
export default class RequestEthereumService {
    protected ipfs: any;

    // RequestCore on blockchain
    /**
     * RequestCore contract's abi
     */
    protected abiRequestCoreLast: any;
    /**
     * RequestCore service from this very lib
     */
    protected requestCoreServices: any;

    // RequestEthereum on blockchain
    /**
     * RequestEthereum contract's abi
     */
    protected abiRequestEthereumLast: any;
    /**
     * RequestEthereum contract's address
     */
    protected addressRequestEthereumLast: string;
    /**
     * RequestEthereum contract's web3 instance
     */
    protected instanceRequestEthereumLast: any;

    private web3Single: Web3Single;

    /**
     * constructor to Instantiates a new RequestEthereumService
     */
    constructor() {
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCoreLast = this.web3Single.getContractInstance('last-RequestCore').abi;
        this.requestCoreServices = new RequestCoreService();

        const requestEthereumLastArtifact = this.web3Single.getContractInstance('last-RequestEthereum');
        if (!requestEthereumLastArtifact) {
            throw Error('RequestEthereum Artifact: no config for network : "' + this.web3Single.networkName + '"');
        }
        this.abiRequestEthereumLast = requestEthereumLastArtifact.abi;
        this.addressRequestEthereumLast = requestEthereumLastArtifact.address;
        this.instanceRequestEthereumLast = requestEthereumLastArtifact.instance;
    }

    /**
     * create a request as payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _payer             address of the payer
     * @param   _amountInitial     amount initial expected of the request
     * @param   _data              Json of the request's details (optional)
     * @param   _extension         address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams   array of parameters for the extension (optional) NOT USED YET
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public createRequestAsPayee(
        _payer: string,
        _amountInitial: any,
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[] ,
        _options ?: any,
        ): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _amountInitial = new BN(_amountInitial);
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;
            if (_amountInitial.isNeg()) return promiEvent.reject(Error('_amountInitial must a positive integer'));
            if (!this.web3Single.isAddressNoChecksum(_payer)) {
                return promiEvent.reject(Error('_payer must be a valid eth address'));
            }
            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }
            // if (_extension && _extension !== '' && !this.web3Single.isAddressNoChecksum(_extension)) {
            //     return promiEvent.reject(Error('_extension must be a valid eth address'));
            // }
            // if (_extensionParams && _extensionParams.length > 9) {
            //     return promiEvent.reject(Error('_extensionParams length must be less than 9'));
            // }
            if ( this.web3Single.areSameAddressesNoChecksum(account, _payer) ) {
                return promiEvent.reject(Error('_from must be different than _payer'));
            }
            // get the amount to collect
            this.requestCoreServices.getCollectEstimation(  _amountInitial,
                                                            this.addressRequestEthereumLast,
                                                            _extension ).then((collectEstimation: any) => {
                _options.value = collectEstimation;

                // parse extension parameters
                let paramsParsed: any[];
                if (!_extension || _extension === '') {
                    paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
                } else if (ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _extension)) {
                    const parsing = ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _extension)
                                                                    .parseParameters(_extensionParams);
                    if (parsing.error) {
                      return promiEvent.reject(parsing.error);
                    }
                    paramsParsed = parsing.result;
                } else {
                    return promiEvent.reject(Error('_extension is not supported'));
                }
                // add file to ipfs
                this.ipfs.addFile(_data).then((hashIpfs: string) => {
                    if (err) return promiEvent.reject(err);

                    const method = this.instanceRequestEthereumLast.methods.createRequestAsPayee(
                        _payer,
                        _amountInitial,
                        _extension,
                        paramsParsed,
                        hashIpfs);
                    // submit transaction
                    this.web3Single.broadcastMethod(
                        method,
                        (hash: string) => {
                            return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                        },
                        (receipt: any) => {
                            // we do nothing here!
                        },
                        (confirmationNumber: number, receipt: any) => {
                            if (confirmationNumber === _options.numberOfConfirmation) {
                                const eventRaw = receipt.events[0];
                                const event = this.web3Single.decodeEvent(this.abiRequestCoreLast, 'Created', eventRaw);
                                this.getRequest(event.requestId).then((request) => {
                                    promiEvent.resolve({request, transaction: {hash: receipt.transactionHash}});
                                }).catch((e: Error) => promiEvent.reject(e));
                            }
                        },
                        (errBroadcast) => {
                            return promiEvent.reject(errBroadcast);
                        },
                        _options);
                }).catch((e: Error) => promiEvent.reject(e));
            }).catch((e: Error) => promiEvent.reject(e));
        });
        return promiEvent.eventEmitter;
    }

    /**
     * create a request as payer
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _payee             address of the payee
     * @param   _amountInitial     amount initial expected of the request
     * @param   _amountToPay       amount to pay in wei
     * @param   _additionals       additional to declaire in wei (optional)
     * @param   _data              Json of the request's details (optional)
     * @param   _extension         address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams   array of parameters for the extension (optional) NOT USED YET
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public createRequestAsPayer(
        _payee: string,
        _amountInitial: any,
        _amountToPay ?: any,
        _additionals ?: any,
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[] ,
        _options ?: any,
        ): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _amountInitial = new BN(_amountInitial);
        _amountToPay = new BN(_amountToPay || 0);
        _additionals = new BN(_additionals);
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;
            if (_amountInitial.isNeg()) return promiEvent.reject(Error('_amountInitial must a positive integer'));
            if (_amountToPay.isNeg()) return promiEvent.reject(Error('_amountToPay must a positive integer'));
            if (_additionals.isNeg()) return promiEvent.reject(Error('_additionals must a positive integer'));
            if (!this.web3Single.isAddressNoChecksum(_payee)) {
                return promiEvent.reject(Error('_payee must be a valid eth address'));
            }
            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }
            // if (_extension && _extension !== '' && !this.web3Single.isAddressNoChecksum(_extension)) {
            //     return promiEvent.reject(Error('_extension must be a valid eth address'));
            // }
            // if (_extensionParams && _extensionParams.length > 9) {
            //     return promiEvent.reject(Error('_extensionParams length must be less than 9'));
            // }
            if ( this.web3Single.areSameAddressesNoChecksum(account, _payee) ) {
                return promiEvent.reject(Error('_from must be different than _payee'));
            }
            // get the amount to collect
            this.requestCoreServices.getCollectEstimation(  _amountInitial,
                                                            this.addressRequestEthereumLast,
                                                            _extension ).then((collectEstimation: any) => {

                _options.value = _amountToPay.add(new BN(collectEstimation));

                // parse extension parameters
                let paramsParsed: any[];
                if (!_extension || _extension === '') {
                    paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
                } else if (ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _extension)) {
                    const parsing = ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _extension)
                                                                    .parseParameters(_extensionParams);
                    if (parsing.error) {
                      return promiEvent.reject(parsing.error);
                    }
                    paramsParsed = parsing.result;
                } else {
                    return promiEvent.reject(Error('_extension is not supported'));
                }
                // add file to ipfs
                this.ipfs.addFile(_data).then((hashIpfs: string) => {
                    if (err) return promiEvent.reject(err);

                    const method = this.instanceRequestEthereumLast.methods.createRequestAsPayer(
                        _payee,
                        _amountInitial,
                        _extension,
                        paramsParsed,
                        _additionals,
                        hashIpfs);
                    // submit transaction
                    this.web3Single.broadcastMethod(
                        method,
                        (hash: string) => {
                            return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                        },
                        (receipt: any) => {
                            // we do nothing here!
                        },
                        (confirmationNumber: number, receipt: any) => {
                            if (confirmationNumber === _options.numberOfConfirmation) {
                                const eventRaw = receipt.events[0];
                                const event = this.web3Single.decodeEvent(this.abiRequestCoreLast, 'Created', eventRaw);
                                this.getRequest(event.requestId).then((request) => {
                                    promiEvent.resolve({request, transaction: {hash: receipt.transactionHash}});
                                }).catch((e: Error) => promiEvent.reject(e));
                            }
                        },
                        (errBroadcast) => {
                            return promiEvent.reject(errBroadcast);
                        },
                        _options);
                }).catch((e: Error) => promiEvent.reject(e));
            }).catch((e: Error) => promiEvent.reject(e));
        });
        return promiEvent.eventEmitter;
    }

    /**
     * sign a request as payee
     * @param   _amountInitial     amount initial expected of the request
     * @param   _expirationDate    timestamp of the date after what the signed request is useless
     * @param   _data              Json of the request's details (optional)
     * @param   _extension         address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams   array of parameters for the extension (optional) NOT USED YET
     * @param   _from              address of the payee, default account will be used otherwise (optional)
     * @return  promise of the object containing the request signed
     */
    public signRequestAsPayee(
        _amountInitial: any,
        _expirationDate: number,
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[],
        _from ?: string): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _amountInitial = new BN(_amountInitial);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_from && err) return promiEvent.reject(err);
            const account: string = _from || defaultAccount || '';

            const expirationDateSolidityTime = _expirationDate / 1000;
            const todaySolidityTime: number = (new Date().getTime()) / 1000;
            if ( expirationDateSolidityTime <= todaySolidityTime ) {
                return promiEvent.reject(Error('_expirationDate must be greater than now')); 
            }
            if (_amountInitial.isNeg()) return promiEvent.reject(Error('_amountInitial must a positive integer'));
            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }
            // if (_extension && _extension !== '' && !this.web3Single.isAddressNoChecksum(_extension)) {
            //     return promiEvent.reject(Error('_extension must be a valid eth address'));
            // }
            // if (_extensionParams && _extensionParams.length > 9) {
            //     return promiEvent.reject(Error('_extensionParams length must be less than 9'));
            // }

            // parse extension parameters
            let paramsParsed: any[];
            if (!_extension || _extension === '') {
                paramsParsed = this.web3Single.arrayToBytes32(_extensionParams, 9);
            } else if (ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _extension)) {
                const parsing = ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _extension)
                                                                .parseParameters(_extensionParams);
                if (parsing.error) {
                  return promiEvent.reject(parsing.error);
                }
                paramsParsed = parsing.result;
            } else {
                return promiEvent.reject(Error('_extension is not supported'));
            }
            // add file to ipfs
            this.ipfs.addFile(_data).then(async (hashIpfs: string) => {
                if (err) return promiEvent.reject(err);

                const signedRequest = await this.createSignedRequest(
                                this.addressRequestEthereumLast,
                                account,
                                _amountInitial,
                                hashIpfs,
                                _extension,
                                paramsParsed,
                                expirationDateSolidityTime);
                promiEvent.resolve(signedRequest);
            }).catch((e: Error) => promiEvent.reject(e));
        });
        return promiEvent.eventEmitter;
    }

    /**
     * broadcast a signed transaction and fill it with his address as payer
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _signedRequest     object signed request
     * @param   _amountToPay       amount to pay in wei
     * @param   _additionals       additional to declaire in wei (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public broadcastSignedRequestAsPayer(
        _signedRequest: any,
        _amountToPay ?: any,
        _additionals ?: any,
        _options ?: any,
        ): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        _signedRequest.amountInitial = new BN(_signedRequest.amountInitial);
        _amountToPay = new BN(_amountToPay);
        _additionals = new BN(_additionals);
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;
            const error = this.signedRequestHasError(_signedRequest, account);
            if (error !== '') return promiEvent.reject(Error(error));
            if (_amountToPay.isNeg()) return promiEvent.reject(Error('_amountToPay must a positive integer'));
            if (_additionals.isNeg()) return promiEvent.reject(Error('_additionals must a positive integer'));

            if (_signedRequest.extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }
            // if (_extension && _extension !== '' && !this.web3Single.isAddressNoChecksum(_extension)) {
            //     return promiEvent.reject(Error('_extension must be a valid eth address'));
            // }
            // if (_extensionParams && _extensionParams.length > 9) {
            //     return promiEvent.reject(Error('_extensionParams length must be less than 9'));
            // }

            // get the amount to collect
            this.requestCoreServices.getCollectEstimation(  _signedRequest.amountInitial,
                                                            this.addressRequestEthereumLast,
                                                            _signedRequest.extension ).then((collectEstimation: any) => {

                _options.value = _amountToPay.add(new BN(collectEstimation));

                // parse extension parameters
                let paramsParsed: any[];
                if (!_signedRequest.extension || _signedRequest.extension === '') {
                    paramsParsed = this.web3Single.arrayToBytes32(_signedRequest.extensionParams, 9);
                } else if (ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _signedRequest.extension)) {
                    const parsing = ServiceContracts.getServiceFromAddress(this.web3Single.networkName, _signedRequest.extension)
                                                                    .parseParameters(_signedRequest.extensionParams);
                    if (parsing.error) {
                      return promiEvent.reject(parsing.error);
                    }
                    paramsParsed = parsing.result;
                } else {
                    return promiEvent.reject(Error('_extension is not supported'));
                }

                const signatureRPClike = ETH_UTIL.fromRpcSig(_signedRequest.signature);

                const method = this.instanceRequestEthereumLast.methods.broadcastSignedRequestAsPayer(
                                                    _signedRequest.payee,
                                                    _signedRequest.amountInitial,
                                                    _signedRequest.extension,
                                                    paramsParsed,
                                                    _additionals,
                                                    _signedRequest.data,
                                                    _signedRequest.expirationDate,
                                                    signatureRPClike.v, ETH_UTIL.bufferToHex(signatureRPClike.r), ETH_UTIL.bufferToHex(signatureRPClike.s));

                    // submit transaction
                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const event = this.web3Single.decodeEvent(this.abiRequestCoreLast, 'Created', eventRaw);
                            this.getRequest(event.requestId).then((request) => {
                                promiEvent.resolve({request, transaction: {hash: receipt.transactionHash}});
                            }).catch((e: Error) => promiEvent.reject(e));
                        }
                    },
                    (errBroadcast) => {
                        return promiEvent.reject(errBroadcast);
                    },
                    _options);
            }).catch((e: Error) => promiEvent.reject(e));
        });
        return promiEvent.eventEmitter;
    }

    /**
     * accept a request as payer
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public accept(
        _requestId: string,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            this.getRequest(_requestId).then((request) => {
                if (request.state !== Types.State.Created) {
                    return promiEvent.reject(Error('request state is not \'created\''));
                }
                if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be the payer'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.accept(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi, 'Accepted', eventRaw);
                            this.getRequest(event.requestId).then((requestAfter) => {
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            }).catch((e: Error) => promiEvent.reject(e));
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            }).catch((e: Error) => promiEvent.reject(e));
        });

        return promiEvent.eventEmitter;
    }

    /**
     * cancel a request as payer or payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public cancel(
        _requestId: string,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            this.getRequest(_requestId).then((request) => {

                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer)
                        && !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return promiEvent.reject(Error('account must be the payer or the payee'));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payer)
                        && request.state !== Types.State.Created ) {
                    return promiEvent.reject(Error('payer can cancel request in state \'created\''));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payee)
                        && request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('payee cannot cancel request already canceled'));
                }

                if ( ! request.balance.isZero() ) {
                    return promiEvent.reject(Error('impossible to cancel a Request with a balance !== 0'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.cancel(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi, 'Canceled', eventRaw);
                            this.getRequest(event.requestId).then((requestAfter) => {
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            }).catch((e: Error) => promiEvent.reject(e));
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            }).catch((e: Error) => promiEvent.reject(e));
        });

        return promiEvent.eventEmitter;
    }

    /**
     * pay a request
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            amount to pay in wei
     * @param   _additionals       additional to declaire in wei (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public paymentAction(
        _requestId: string,
        _amount: any,
        _additionals: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        _additionals = new BN(_additionals);
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BN(_amount);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            this.getRequest(_requestId).then((request) => {

                if (_options.value.isNeg()) return promiEvent.reject(Error('_amount must a positive integer'));
                if (_additionals.isNeg()) return promiEvent.reject(Error('_additionals must a positive integer'));
                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request cannot be canceled'));
                }
                if ( request.state === Types.State.Created
                        && !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be payer if the request is created'));
                }
                if ( _additionals.gt(0) && !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('only payer can add additionals'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.paymentAction(_requestId, _additionals);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi, 'UpdateBalance',
                                        request.state === Types.State.Created ? receipt.events[1] : receipt.events[0]);
                            this.getRequest(event.requestId).then((requestAfter) => {
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            }).catch((e: Error) => promiEvent.reject(e));
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            }).catch((e: Error) => promiEvent.reject(e));
        });

        return promiEvent.eventEmitter;
    }

    /**
     * refund a request as payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            amount to refund in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public refundAction(
        _requestId: string,
        _amount: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _options.value = new BN(_amount);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            this.getRequest(_requestId).then((request) => {
                if (_options.value.isNeg()) return promiEvent.reject(Error('_amount must a positive integer'));

                if ( request.state !== Types.State.Accepted ) {
                    return promiEvent.reject(Error('request must be accepted'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return promiEvent.reject(Error('account must be payee'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.refundAction(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi,
                                                                        'UpdateBalance',
                                                                        receipt.events[0]);
                            this.getRequest(event.requestId).then((requestAfter) => {
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            }).catch((e: Error) => promiEvent.reject(e));
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            }).catch((e: Error) => promiEvent.reject(e));
        });

        return promiEvent.eventEmitter;
    }

    /**
     * add subtracts to a request as payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            subtract to declare in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public subtractAction(
        _requestId: string,
        _amount: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BN(_amount);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            this.getRequest(_requestId).then((request) => {

                if (_amount.isNeg()) return promiEvent.reject(Error('_amount must a positive integer'));

                if (_amount.gt(request.expectedAmount)) {
                    return promiEvent.reject(Error('_amount must be equal or lower than amount expected'));
                }

                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee) ) {
                    return promiEvent.reject(Error('account must be payee'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.subtractAction(_requestId, _amount);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi,
                                                                        'UpdateExpectedAmount',
                                                                        receipt.events[0]);
                            this.getRequest(event.requestId).then((requestAfter) => {
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            }).catch((e: Error) => promiEvent.reject(e));
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            }).catch((e: Error) => promiEvent.reject(e));
        });

        return promiEvent.eventEmitter;
    }

    /**
     * add addtionals to a request as payer
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amount            subtract to declare in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public additionalAction(
        _requestId: string,
        _amount: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amount = new BN(_amount);

        this.web3Single.getDefaultAccountCallback((err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            this.getRequest(_requestId).then((request) => {

                if (_amount.isNeg()) return promiEvent.reject(Error('_amount must a positive integer'));

                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be payer'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.additionalAction(_requestId, _amount);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi,
                                                                        'UpdateExpectedAmount',
                                                                        eventRaw);
                            this.getRequest(event.requestId).then((requestAfter) => {
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            }).catch((e: Error) => promiEvent.reject(e));
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            }).catch((e: Error) => promiEvent.reject(e));
        });

        return promiEvent.eventEmitter;
    }

    /**
     * Get info from currency contract (generic method)
     * @dev return {} always
     * @param   _requestId    requestId of the request
     * @return  promise of the information from the currency contract of the request (always {} here)
     */
    public getRequestCurrencyContractInfo(
        _requestId: string): Promise < any > {
        return new Promise(async (resolve, reject) => {
            return resolve({});
        });
    }

    /**
     * alias of requestCoreServices.getRequest()
     */
    public getRequest(_requestId: string): Promise < any > {
        return this.requestCoreServices.getRequest(_requestId);
    }

    /**
     * alias of requestCoreServices.getRequestEvents()
     */
    public getRequestEvents(
        _requestId: string,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        return this.requestCoreServices.getRequestEvents(_requestId, _fromBlock, _toBlock);
    }

    /**
     * decode data from input tx (generic method)
     * @param   _data    requestId of the request
     * @return  return an object with the name of the function and the parameters
     */
    public decodeInputData(_address: string, _data: any): any {
        const contract = this.web3Single.getContractInstance(_address);
        return this.web3Single.decodeInputData(contract.abi, _data);
    }

    /**
     * generate web3 method of the contract from name and parameters in array (generic method)
     * @param   _data    requestId of the request
     * @return  return a web3 method object
     */
    public generateWeb3Method(_address: string, _name: string, _parameters: any[]): any {
        const contract = this.web3Single.getContractInstance(_address);
        return this.web3Single.generateWeb3Method(contract.instance, _name, _parameters);
    }

    /**
     * Get request events from currency contract (generic method)
     * @param   _requestId    requestId of the request
     * @param   _fromBlock    search events from this block (optional)
     * @param   _toBlock    search events until this block (optional)
     * @return  promise of the object containing the events from the currency contract of the request (always {} here)
     */
    public getRequestEventsCurrencyContractInfo(
        _request: any,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        return new Promise(async (resolve, reject) => {

            const contract = this.web3Single.getContractInstance(_request.currencyContract.address);
            // let events = await this.instanceSynchroneExtensionEscrow.getPastEvents('allEvents', {
            //     // allEvents and filter don't work together so far. issues created on web3 github
            //     // filter: {requestId: _requestId},
            //     fromBlock: requestEthereumArtifact.networks[this.web3Single.networkName].blockNumber,
            //     toBlock: 'latest'
            // });

            // TODO: events by event waiting for a patch of web3
            const optionFilters = {
                filter: { requestId: _request.requestId },
                fromBlock: contract.blockNumber,
                toBlock: 'latest'};

            // waiting for filter working (see above)
            let events: any[] = [];
            events = events.concat(
                        await contract.instance.getPastEvents('EtherAvailableToWithdraw', optionFilters));

            return resolve(await Promise.all(events.map(async (e) => {
                                        return new Promise(async (resolveEvent, rejectEvent) => {
                                            resolveEvent({
                                                _meta: {
                                                    blockNumber: e.blockNumber,
                                                    logIndex: e.logIndex,
                                                    timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                                                data: e.returnValues,
                                                name: e.event});
                                        });
                                    })));
        });
    }

    private async createSignedRequest(    
                            currencyContract: string,
                            payee: string,
                            amountInitial: any,
                            data ?: string,
                            extension ?: string,
                            extensionParams ?: any[],
                            expirationDate ?: number): Promise<any> {
        const hash = this.hashRequest(currencyContract,
                                        payee,
                                        '',
                                        amountInitial,
                                        data ? data : '',
                                        extension ? extension : '',
                                        extension ? extensionParams : [],
                                        expirationDate);

        const signature = await this.web3Single.sign(hash, payee);

        extension = extension ? extension : undefined;
        extensionParams = extension ? extensionParams : undefined;
        data = data ? data : undefined;
        amountInitial = amountInitial.toString();

        return {amountInitial,
                currencyContract,
                data,
                expirationDate,
                extension,
                extensionParams,
                hash,
                payee,
                signature};
    }

    private hashRequest(currencyContract: string,
                        payee: string,
                        payer: string,
                        amountInitial: any,
                        data ?: string,
                        extension ?: string,
                        extensionParams ?: any[],
                        expirationDate ?: number): any {
        const requestParts = [
            {value: currencyContract, type: 'address'},
            {value: payee, type: 'address'},
            {value: payer, type: 'address'},
            {value: amountInitial, type: 'int256'},
            {value: extension, type: 'address'},
            {value: extensionParams, type: 'bytes32[9]'},
            {value: data, type: 'string'},
            {value: expirationDate, type: 'uint256'}];
        const types: any[] = [];
        const values: any[] = [];

        for (const part of requestParts) {
            types.push(part.type);
            values.push(part.value);
        }

        return this.web3Single.web3.utils.bytesToHex(ETH_ABI.soliditySHA3(types, values));
    }

    private signedRequestHasError(_signedRequest: any, payer: string): string {
        const signatureRPClike = ETH_UTIL.fromRpcSig(_signedRequest.signature);
        const pub = ETH_UTIL.ecrecover(ETH_UTIL.hashPersonalMessage(ETH_UTIL.toBuffer(_signedRequest.hash)), signatureRPClike.v, signatureRPClike.r, signatureRPClike.s);
        const addrBuf = ETH_UTIL.pubToAddress(pub);
        const addressSigning   = ETH_UTIL.bufferToHex(addrBuf);
        _signedRequest.amountInitial = new BN(_signedRequest.amountInitial);
        const hashComputed = this.hashRequest(_signedRequest.currencyContract,
                        _signedRequest.payee,
                        '',
                        _signedRequest.amountInitial,
                        _signedRequest.data ? _signedRequest.data : '',
                        _signedRequest.extension ? _signedRequest.extension : '',
                        _signedRequest.extensionParams ? _signedRequest.extensionParams : [],
                        _signedRequest.expirationDate);

        if (!_signedRequest) {
            return '_signedRequest must be defined';
        }
        if (_signedRequest.amountInitial.isNeg()) {
            return 'amountInitial must be a positive integer';
        }
        if (!this.web3Single.areSameAddressesNoChecksum(this.addressRequestEthereumLast, _signedRequest.currencyContract)) {
            return 'currencyContract must be the last currencyContract of requestEthereum';
        }
        if (_signedRequest.expirationDate < new Date().getTime() / 1000) {
            return 'expirationDate must be greater than now';
        }
        if (hashComputed !== _signedRequest.hash) {
            return 'hash is not valid';
        }
        if (!this.web3Single.isAddressNoChecksum(_signedRequest.payee)) {
            return 'payee must be an eth address valid';
        }
        if (this.web3Single.areSameAddressesNoChecksum(payer, _signedRequest.payee)) {
            return '_from must be different than payee';
        }
        if (!this.web3Single.areSameAddressesNoChecksum(addressSigning, _signedRequest.payee)) {
            return 'payee is not the signer';
        }
        return '';
    }
}
