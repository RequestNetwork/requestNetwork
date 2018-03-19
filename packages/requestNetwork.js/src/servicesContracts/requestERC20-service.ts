import RequestCoreService from '../servicesCore/requestCore-service';
import Ipfs from '../servicesExternal/ipfs-service';

import Erc20Service from '../servicesExternal/erc20-service';

import { Web3Single } from '../servicesExternal/web3-single';

import * as ServiceContracts from '../servicesContracts';

import * as Types from '../types';

import * as ETH_UTIL from 'ethereumjs-util';
// @ts-ignore
import * as Web3PromiEvent from 'web3-core-promievent';

// @ts-ignore
const ETH_ABI = require('../lib/ethereumjs-abi-perso.js');

const BN = Web3Single.BN();

const EMPTY_BYTES_20 = '0x0000000000000000000000000000000000000000';

/**
 * The RequestERC20Service class is the interface for the Request Ethereum currency contract
 */
export default class RequestERC20Service {
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

    // RequestERC20 on blockchain
    /**
     * RequestERC20 contract's abi
     */
    protected abiRequestERC20Last: any;
    /**
     * RequestERC20 contract's address
     */
    protected addressRequestERC20Last: string;
    /**
     * RequestERC20 contract's web3 instance
     */
    protected instanceRequestERC20Last: any;

    private web3Single: Web3Single;

    /**
     * constructor to Instantiates a new RequestERC20Service
     */
    constructor() {
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCoreLast = this.web3Single.getContractInstance('last-RequestCore').abi;
        this.requestCoreServices = new RequestCoreService();

        const requestERC20LastArtifact = this.web3Single.getContractInstance('last-RequestERC20');
        if (!requestERC20LastArtifact) {
            throw Error('RequestERC20 Artifact: no config for network : "' + this.web3Single.networkName + '"');
        }
        this.abiRequestERC20Last = requestERC20LastArtifact.abi;
        this.addressRequestERC20Last = requestERC20LastArtifact.address;
        this.instanceRequestERC20Last = requestERC20LastArtifact.instance;
    }

    /**
     * create a request as payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _tokenAddress              Address token used for payment
     * @param   _payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
     * @param   _expectedAmounts           amount initial expected per payees for the request
     * @param   _payer                     address of the payer
     * @param   _payeesPaymentAddress      payment addresses of the payees (the position 0 will be the main payee) (optional)
     * @param   _payerRefundAddress        refund address of the payer (optional)
     * @param   _data                      Json of the request's details (optional)
     * @param   _extension                 address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams           array of parameters for the extension (optional) NOT USED YET
     * @param   _options                   options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public createRequestAsPayee(
        _tokenAddress: string,
        _payeesIdAddress: string[],
        _expectedAmounts: any[],
        _payer: string,
        _payeesPaymentAddress ?: Array<string|undefined>,
        _payerRefundAddress ?: string,
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[] ,
        _options ?: any,
        ): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _expectedAmounts = _expectedAmounts.map((amount) => new BN(amount));

        let _payeesPaymentAddressParsed: string[] = [];
        if (_payeesPaymentAddress) {
            _payeesPaymentAddressParsed = _payeesPaymentAddress.map((addr) => addr ? addr : EMPTY_BYTES_20);
        }

        const expectedAmountsTotal = _expectedAmounts.reduce((a, b) => a.add(b), new BN(0));

        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            if (!this.web3Single.isAddressNoChecksum(_tokenAddress)) {
                return promiEvent.reject(Error('_tokenAddress must be a valid eth address'));
            }
            if (_payeesIdAddress.length !== _expectedAmounts.length) {
                return promiEvent.reject(Error('_payeesIdAddress and _expectedAmounts must have the same size'));
            }
            if (_payeesPaymentAddress && _payeesIdAddress.length < _payeesPaymentAddress.length) {
                return promiEvent.reject(Error('_payeesPaymentAddress cannot be bigger than _payeesIdAddress'));
            }
            if (!this.web3Single.isArrayOfAddressesNoChecksum(_payeesIdAddress)) {
                return promiEvent.reject(Error('_payeesIdAddress must be valid eth addresses'));
            }
            if (!this.web3Single.isArrayOfAddressesNoChecksum(_payeesPaymentAddressParsed)) {
                return promiEvent.reject(Error('_payeesPaymentAddress must be valid eth addresses'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, _payeesIdAddress[0]) ) {
                return promiEvent.reject(Error('account broadcaster must be the main payee'));
            }
            if (_expectedAmounts.filter((amount) => amount.isNeg()).length !== 0) {
                return promiEvent.reject(Error('_expectedAmounts must be positives integer'));
            }
            if (!this.web3Single.isAddressNoChecksum(_payer)) {
                return promiEvent.reject(Error('_payer must be a valid eth address'));
            }
            if (_payerRefundAddress && !this.web3Single.isAddressNoChecksum(_payerRefundAddress)) {
                return promiEvent.reject(Error('_payerRefundAddress must be a valid eth address'));
            }

            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }

            if ( this.web3Single.areSameAddressesNoChecksum(account, _payer) ) {
                return promiEvent.reject(Error('_from must be different than _payer'));
            }

            if ( ! await this.isTokenWhiteListed(_tokenAddress) ) {
                return promiEvent.reject(Error('token must be whitelisted'));
            }

            // get the amount to collect
            try {
                const collectEstimation = await this.instanceRequestERC20Last.methods.collectEstimation(_tokenAddress, expectedAmountsTotal).call();

                _options.value = collectEstimation;

                // add file to ipfs
                const hashIpfs = await this.ipfs.addFile(_data);

                const method = this.instanceRequestERC20Last.methods.createRequestAsPayeeAction(
                    _tokenAddress,
                    _payeesIdAddress,
                    _payeesPaymentAddressParsed,
                    _expectedAmounts,
                    _payer,
                    _payerRefundAddress,
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
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const event = this.web3Single.decodeEvent(this.abiRequestCoreLast, 'Created', eventRaw);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (errBroadcast) => {
                        return promiEvent.reject(errBroadcast);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
        });
        return promiEvent.eventEmitter;
    }

    /**
     * sign a request as payee
     * @param   _tokenAddress              Address token used for payment
     * @param   _payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
     * @param   _expectedAmounts           amount initial expected per payees for the request
     * @param   _expirationDate            timestamp is second of the date after what the signed request is not broadcastable
     * @param   _payeesPaymentAddress      payment addresses of the payees (the position 0 will be the main payee) (optional)
     * @param   _data                      Json of the request's details (optional)
     * @param   _extension                 address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams           array of parameters for the extension (optional) NOT USED YET
     * @param   _from                      address of the payee, default account will be used otherwise (optional)
     * @return  promise of the object containing the request signed
     */
    public signRequestAsPayee(
        _tokenAddress: string,
        _payeesIdAddress: string[],
        _expectedAmounts: any[],
        _expirationDate: number,
        _payeesPaymentAddress ?: Array<string|undefined>,
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[],
        _from ?: string,
        ): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        _expectedAmounts = _expectedAmounts.map((amount) => new BN(amount));

        let payeesPaymentAddressParsed: string[] = [];
        if (_payeesPaymentAddress) {
            payeesPaymentAddressParsed = _payeesPaymentAddress.map((addr) => addr ? addr : EMPTY_BYTES_20);
        }

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_from && err) return promiEvent.reject(err);
            const account: string = _from || defaultAccount || '';

            if (_payeesIdAddress.length !== _expectedAmounts.length) {
                return promiEvent.reject(Error('_payeesIdAddress and _expectedAmounts must have the same size'));
            }
            if (_payeesPaymentAddress && _payeesIdAddress.length < _payeesPaymentAddress.length) {
                return promiEvent.reject(Error('_payeesPaymentAddress cannot be bigger than _payeesIdAddress'));
            }

            if (!this.web3Single.isAddressNoChecksum(_tokenAddress)) {
                return promiEvent.reject(Error('_tokenAddress must be a valid eth address'));
            }

            if ( ! await this.isTokenWhiteListed(_tokenAddress) ) {
                return promiEvent.reject(Error('token must be whitelisted'));
            }

            const todaySolidityTime: number = (new Date().getTime()) / 1000;
            if ( _expirationDate <= todaySolidityTime ) {
                return promiEvent.reject(Error('_expirationDate must be greater than now'));
            }
            if (_expectedAmounts.filter((amount) => amount.isNeg()).length !== 0) {
                return promiEvent.reject(Error('_expectedAmounts must be positives integer'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, _payeesIdAddress[0]) ) {
                return promiEvent.reject(Error('account broadcaster must be the main payee'));
            }
            if (!this.web3Single.isArrayOfAddressesNoChecksum(_payeesIdAddress)) {
                return promiEvent.reject(Error('_payeesIdAddress must be valid eth addresses'));
            }
            if (!this.web3Single.isArrayOfAddressesNoChecksum(payeesPaymentAddressParsed)) {
                return promiEvent.reject(Error('_payeesPaymentAddress must be valid eth addresses'));
            }
            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }

            try {
                // add file to ipfs
                const hashIpfs = await this.ipfs.addFile(_data);

                const signedRequest = await this.createSignedRequest(
                                _tokenAddress,
                                this.addressRequestERC20Last,
                                _payeesIdAddress,
                                _expectedAmounts,
                                payeesPaymentAddressParsed,
                                _expirationDate,
                                hashIpfs,
                                '',
                                []);

                promiEvent.resolve(signedRequest);
            } catch (e) {
                promiEvent.reject(e);
            }
        });
        return promiEvent.eventEmitter;
    }

    /**
     * broadcast a signed transaction and fill it with his address as payer
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _signedRequest     object signed request
     * @param   _amountsToPay      amounts to pay in wei for each payee (optional)
     * @param   _additionals       amounts of additional in wei for each payee (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public broadcastSignedRequestAsPayer(
        _signedRequest: any,
        _amountsToPay ?: any[],
        _additionals ?: any[],
        _options ?: any,
        ): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        let amountsToPayParsed: any[] = [];
        if (_amountsToPay) {
            amountsToPayParsed = _amountsToPay.map((amount) => new BN(amount || 0));
        }
        let additionalsParsed: any[] = [];
        if (_additionals) {
            additionalsParsed = _additionals.map((amount) => new BN(amount || 0));
        }
        const amountsToPayTotal = amountsToPayParsed.reduce((a, b) => a.add(b), new BN(0));

        _signedRequest.expectedAmounts = _signedRequest.expectedAmounts.map((amount: any) => new BN(amount));
        const expectedAmountsTotal = _signedRequest.expectedAmounts.reduce((a: any, b: any) => a.add(b), new BN(0));

        if (_signedRequest.payeesPaymentAddress) {
            _signedRequest.payeesPaymentAddress = _signedRequest.payeesPaymentAddress.map((addr: any) => addr ? addr : EMPTY_BYTES_20);
        } else {
            _signedRequest.payeesPaymentAddress = [];
        }

        _signedRequest.data = _signedRequest.data ? _signedRequest.data : '';
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                await this.isSignedRequestHasError(_signedRequest, account);

                if (_amountsToPay && _signedRequest.payeesIdAddress.length < _amountsToPay.length) {
                    return promiEvent.reject(Error('_amountsToPay cannot be bigger than _payeesIdAddress'));
                }
                if (_additionals && _signedRequest.payeesIdAddress.length < _additionals.length) {
                    return promiEvent.reject(Error('_additionals cannot be bigger than _payeesIdAddress'));
                }
                if (amountsToPayParsed.filter((amount) => amount.isNeg()).length !== 0) {
                    return promiEvent.reject(Error('_amountsToPay must be positives integer'));
                }
                if (additionalsParsed.filter((amount) => amount.isNeg()).length !== 0) {
                    return promiEvent.reject(Error('_additionals must be positives integer'));
                }
                if (this.web3Single.areSameAddressesNoChecksum(account, _signedRequest.payeesIdAddress[0]) ) {
                    return promiEvent.reject(Error('_from must be different than the main payee'));
                }
                if (_signedRequest.extension) {
                    return promiEvent.reject(Error('extensions are disabled for now'));
                }

                // get the amount to collect
                const collectEstimation = await this.instanceRequestERC20Last.methods.collectEstimation(_signedRequest.tokenAddress, expectedAmountsTotal).call();

                _options.value = new BN(collectEstimation);

                const method = this.instanceRequestERC20Last.methods.broadcastSignedRequestAsPayer(
                                                    _signedRequest.tokenAddress,
                                                    this.requestCoreServices.createBytesRequest(_signedRequest.payeesIdAddress, _signedRequest.expectedAmounts, 0, _signedRequest.data),
                                                    _signedRequest.payeesPaymentAddress,
                                                    amountsToPayParsed,
                                                    additionalsParsed,
                                                    _signedRequest.expirationDate,
                                                    _signedRequest.signature);

                // submit transaction
                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const event = this.web3Single.decodeEvent(this.abiRequestCoreLast, 'Created', eventRaw);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (errBroadcast) => {
                        return promiEvent.reject(errBroadcast);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
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

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (request.state !== Types.State.Created) {
                    return promiEvent.reject(Error('request state is not \'created\''));
                }
                if (!this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be the payer'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.acceptAction(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi, 'Accepted', eventRaw);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
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

        this.web3Single.getDefaultAccountCallback( async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer)
                        && !this.web3Single.areSameAddressesNoChecksum(account, request.payee.address) ) {
                    return promiEvent.reject(Error('account must be the payer or the payee'));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payer)
                        && request.state !== Types.State.Created ) {
                    return promiEvent.reject(Error('payer can cancel request in state \'created\''));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payee.address)
                        && request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('payee cannot cancel request already canceled'));
                }

                let balanceTotal = request.payee.balance;
                for (const subPayee of request.subPayees) {
                   balanceTotal = balanceTotal.add(subPayee.balance);
                }

                if ( !balanceTotal.isZero() ) {
                    return promiEvent.reject(Error('impossible to cancel a Request with a balance !== 0'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.cancelAction(_requestId);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi, 'Canceled', eventRaw);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
        });

        return promiEvent.eventEmitter;
    }

    /**
     * add addtionals to a request as payer
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _additionals       amounts of additionals in wei for each payee
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public additionalAction(
        _requestId: string,
        _additionals: any[],
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        let additionalsParsed: any[] = [];
        if (_additionals) {
            additionalsParsed = _additionals.map((amount) => new BN(amount || 0));
        }

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (_additionals && request.subPayees.length + 1 < _additionals.length) {
                    return promiEvent.reject(Error('_additionals cannot be bigger than _payeesIdAddress'));
                }
                if (additionalsParsed.filter((amount) => amount.isNeg()).length !== 0) {
                    return promiEvent.reject(Error('additionals must be positives integer'));
                }
                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be payer'));
                }

                let subtractsTooLong = false;
                for (const k in additionalsParsed) {
                    if (k === '0') continue;
                    if (!request.subPayees.hasOwnProperty(parseInt(k, 10) - 1)) {
                        subtractsTooLong = true;
                        break;
                    }
                }
                if (subtractsTooLong) {
                    return promiEvent.reject(Error('additionals size must be lower than number of payees'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.additionalAction(_requestId, additionalsParsed);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const eventRaw = receipt.events[0];
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi,
                                                                        'UpdateExpectedAmount',
                                                                        eventRaw);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
        });

        return promiEvent.eventEmitter;
    }

    /**
     * add subtracts to a request as payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _subtracts         amounts of subtracts in wei for each payee
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public subtractAction(
        _requestId: string,
        _subtracts: any[],
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        let subtractsParsed: any[] = [];
        if (_subtracts) {
            subtractsParsed = _subtracts.map((amount) => new BN(amount || 0));
        }

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (_subtracts && request.subPayees.length + 1 < _subtracts.length) {
                    return promiEvent.reject(Error('_subtracts cannot be bigger than _payeesIdAddress'));
                }
                if (subtractsParsed.filter((amount) => amount.isNeg()).length !== 0) {
                    return promiEvent.reject(Error('subtracts must be positives integer'));
                }
                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee.address) ) {
                    return promiEvent.reject(Error('account must be payee'));
                }
                if (request.payee.expectedAmount.lt(subtractsParsed[0])) {
                    return promiEvent.reject(Error('subtracts must be lower than amountExpected\'s'));
                }
                let subtractTooHigh = false;
                let subtractsTooLong = false;
                for (const k in subtractsParsed) {
                    if (k === '0') continue;
                    if (!request.subPayees.hasOwnProperty(parseInt(k, 10) - 1)) {
                        subtractsTooLong = true;
                        break;
                    }
                    if (request.subPayees[parseInt(k, 10) - 1].expectedAmount.lt(subtractsParsed[k])) {
                        subtractTooHigh = true;
                        break;
                    }
                }
                if (subtractsTooLong) {
                    return promiEvent.reject(Error('subtracts size must be lower than number of payees'));
                }
                if (subtractTooHigh) {
                    return promiEvent.reject(Error('subtracts must be lower than amountExpected\'s'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.subtractAction(_requestId, subtractsParsed);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi,
                                                                        'UpdateExpectedAmount',
                                                                        receipt.events[0]);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
        });

        return promiEvent.eventEmitter;
    }

    /**
     * pay a request
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _amountsToPay      amounts to pay in token for each payee
     * @param   _additionals       amounts of additional in token for each payee (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public paymentAction(
        _requestId: string,
        _amountsToPay: any[],
        _additionals ?: any[],
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        let amountsToPayParsed: any[] = [];
        if (_amountsToPay) {
            amountsToPayParsed = _amountsToPay.map((amount) => new BN(amount || 0));
        }
        let additionalsParsed: any[] = [];
        if (_additionals) {
            additionalsParsed = _additionals.map((amount) => new BN(amount || 0));
        }
        const amountsToPayTotal = amountsToPayParsed.reduce((a, b) => a.add(b), new BN(0));
        const additionalsTotal = additionalsParsed.reduce((a, b) => a.add(b), new BN(0));
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (_amountsToPay && request.subPayees.length + 1 < _amountsToPay.length) {
                    return promiEvent.reject(Error('_amountsToPay cannot be bigger than _payeesIdAddress'));
                }
                if (_additionals && request.subPayees.length + 1 < _additionals.length) {
                    return promiEvent.reject(Error('_additionals cannot be bigger than _payeesIdAddress'));
                }
                if (amountsToPayParsed.filter((amount) => amount.isNeg()).length !== 0) {
                    return promiEvent.reject(Error('_amountsToPay must be positives integer'));
                }
                if (additionalsParsed.filter((amount) => amount.isNeg()).length !== 0) {
                    return promiEvent.reject(Error('_additionals must be positives integer'));
                }
                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request cannot be canceled'));
                }
                if ( !additionalsTotal.isZero() && !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('only payer can add additionals'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);

                const tokenErc20 = new Erc20Service(request.currencyContract.tokenAddress);
                // check token Balance
                const balanceAccount = new BN(await tokenErc20.balanceOf(account));
                if ( balanceAccount.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('balance of token is too low'));
                }
                // check allowance
                const allowance = new BN(await tokenErc20.allowance(account, contract.address));
                if ( allowance.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('allowance of token is too low'));
                }

                const method = contract.instance.methods.paymentAction(
                                                                    _requestId,
                                                                    amountsToPayParsed,
                                                                    additionalsParsed);
                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi, 'UpdateBalance',
                                        request.state === Types.State.Created && _options.from === request.payer ? receipt.events[1] : receipt.events[0]);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
        });

        return promiEvent.eventEmitter;
    }

    /**
     * refund a request as payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @dev only addresses from payeesIdAddress and payeesPaymentAddress can refund a request
     * @param   _requestId         requestId of the payer
     * @param   _amountToRefund    amount to refund in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public refundAction(
        _requestId: string,
        _amountToRefund: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);
        _amountToRefund = new BN(_amountToRefund);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (_amountToRefund.isNeg()) return promiEvent.reject(Error('_amountToRefund must a positive integer'));

                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request cannot be canceled'));
                }

                if (!this.web3Single.areSameAddressesNoChecksum(account, request.payee.address) && !this.web3Single.areSameAddressesNoChecksum(account, request.currencyContract.payeePaymentAddress) ) {
                    let foundInSubPayee = false;
                    for (const subPayee of request.subPayees) {
                        if (this.web3Single.areSameAddressesNoChecksum(account, subPayee.address)) {
                            foundInSubPayee = true;
                        }
                    }
                    for (const subPayee of request.currencyContract.subPayeesPaymentAddress) {
                        if (this.web3Single.areSameAddressesNoChecksum(account, subPayee)) {
                            foundInSubPayee = true;
                        }
                    }
                    if (!foundInSubPayee) {
                        return promiEvent.reject(Error('account must be a payee'));
                    }
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);

                const tokenErc20 = new Erc20Service(request.currencyContract.tokenAddress);
                // check token Balance
                const balanceAccount = new BN(await tokenErc20.balanceOf(account));
                if ( balanceAccount.lt(_amountToRefund) ) {
                    return promiEvent.reject(Error('balance of token is too low'));
                }
                // check allowance
                const allowance = new BN(await tokenErc20.allowance(account, contract.address));
                if ( allowance.lt(_amountToRefund) ) {
                    return promiEvent.reject(Error('allowance of token is too low'));
                }

                const method = contract.instance.methods.refundAction(_requestId, _amountToRefund);

                this.web3Single.broadcastMethod(
                    method,
                    (hash: string) => {
                        return promiEvent.eventEmitter.emit('broadcasted', {transaction: {hash}});
                    },
                    (receipt: any) => {
                        // we do nothing here!
                    },
                    async (confirmationNumber: number, receipt: any) => {
                        if (confirmationNumber === _options.numberOfConfirmation) {
                            const coreContract = this.requestCoreServices.getCoreContractFromRequestId(request.requestId);
                            const event = this.web3Single.decodeEvent(coreContract.abi,
                                                                        'UpdateBalance',
                                                                        receipt.events[0]);
                            try {
                                const requestAfter = await this.getRequest(event.requestId);
                                promiEvent.resolve({request: requestAfter, transaction: {hash: receipt.transactionHash}});
                            } catch (e) {
                                return promiEvent.reject(e);
                            }
                        }
                    },
                    (error: Error) => {
                        return promiEvent.reject(error);
                    },
                    _options);
            } catch (e) {
                promiEvent.reject(e);
            }
        });

        return promiEvent.eventEmitter;
    }

    /**
     * Do a token allowance for a request
     * @param   _requestId     requestId of the request
     * @param   _amount        amount to allowed
     * @param   _options       options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise
     */
    public approveTokenForRequest(_requestId: string, _amount: any, _options ?: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            _amount = new BN(_amount);

            this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
                if (!_options.from && err) return reject(err);
                _options.from = _options.from ? _options.from : defaultAccount;

                const request = await this.getRequest(_requestId);
                const tokenErc20 = new Erc20Service(request.currencyContract.tokenAddress);

                try {
                    await tokenErc20.approve(request.currencyContract.address, _amount, _options);
                    return resolve();
                } catch (e) {
                    return reject(e);
                }
            });
        });
    }

    /**
     * Do a token allowance for a request
     * @param   _signedRequest     object signed request
     * @param   _amount        amount to allowed
     * @param   _options       options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise
     */
    public approveTokenForSignedRequest(_signedRequest: any, _amount: any, _options ?: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            _amount = new BN(_amount);

            if ( _signedRequest.currencyContract !== this.addressRequestERC20Last ) {
                return reject('currency contract given is not the last contract');
            }

            this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
                if (!_options.from && err) return reject(err);
                _options.from = _options.from ? _options.from : defaultAccount;

                const tokenErc20 = new Erc20Service(_signedRequest.tokenAddress);

                try {
                    await tokenErc20.approve(_signedRequest.currencyContract, _amount, _options);
                    return resolve();
                } catch (e) {
                    return reject(e);
                }
            });
        });
    }

    /**
     * Get info from currency contract (generic method)
     * @dev return {} always
     * @param   _requestId    requestId of the request
     * @return  promise of the information from the currency contract of the request (always {} here)
     */
    public getRequestCurrencyContractInfo(
        _requestId: string,
        currencyContractAddress: string,
        coreContract: any): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try {
                const currencyContract = this.web3Single.getContractInstance(currencyContractAddress);

                let payeePaymentAddress: string|undefined = await currencyContract.instance.methods.payeesPaymentAddress(_requestId, 0).call();
                payeePaymentAddress = payeePaymentAddress !== EMPTY_BYTES_20 ? payeePaymentAddress : undefined;

                // get subPayees payment addresses
                const subPayeesCount = await coreContract.instance.methods.getSubPayeesCount(_requestId).call();
                const subPayeesPaymentAddress: string[] = [];
                for (let i = 0; i < subPayeesCount; i++) {
                    const paymentAddress = await currencyContract.instance.methods.payeesPaymentAddress(_requestId, i + 1).call();
                    subPayeesPaymentAddress.push(paymentAddress !== EMPTY_BYTES_20 ? paymentAddress : undefined);
                }

                let payerRefundAddress: string|undefined = await currencyContract.instance.methods.payerRefundAddress(_requestId).call();
                payerRefundAddress = payerRefundAddress !== EMPTY_BYTES_20 ? payerRefundAddress : undefined;

                const tokenAddress: string = await currencyContract.instance.methods.requestTokens(_requestId).call();

                return resolve({tokenAddress, payeePaymentAddress, subPayeesPaymentAddress, payerRefundAddress});
            } catch (e) {
                return reject(e);
            }
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
     * check if a signed request is valid
     * @param   _signedRequest    Signed request
     * @param   _payer             Payer of the request
     * @return  return a string with the error, or ''
     */
    public isSignedRequestHasError(_signedRequest: any, _payer: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            _signedRequest.expectedAmounts = _signedRequest.expectedAmounts.map((amount: any) => new BN(amount));

            if (_signedRequest.payeesPaymentAddress) {
                _signedRequest.payeesPaymentAddress = _signedRequest.payeesPaymentAddress.map((addr: any) => addr ? addr : EMPTY_BYTES_20);
            } else {
                _signedRequest.payeesPaymentAddress = [];
            }

            if ( ! this.web3Single.isAddressNoChecksum(_signedRequest.tokenAddress)) {
                return reject(Error('_tokenAddress must be a valid eth address'));
            }
            if ( ! await this.isTokenWhiteListed(_signedRequest.tokenAddress) ) {
                return reject(Error('token must be whitelisted'));
            }

            const hashComputed = this.hashRequest(
                            _signedRequest.tokenAddress,
                            _signedRequest.currencyContract,
                            _signedRequest.payeesIdAddress,
                            _signedRequest.expectedAmounts,
                            '',
                            _signedRequest.payeesPaymentAddress,
                            _signedRequest.data ? _signedRequest.data : '',
                            _signedRequest.expirationDate);

            if ( ! _signedRequest) {
                return reject(Error('_signedRequest must be defined'));
            }
            // some controls on the arrays
            if (_signedRequest.payeesIdAddress.length !== _signedRequest.expectedAmounts.length) {
                return reject(Error('_payeesIdAddress and _expectedAmounts must have the same size'));
            }

            if (_signedRequest.expectedAmounts.filter((amount: any) => amount.isNeg()).length !== 0) {
                return reject(Error('_expectedAmounts must be positives integer'));
            }
            if ( ! this.web3Single.areSameAddressesNoChecksum(this.addressRequestERC20Last, _signedRequest.currencyContract)) {
                return reject(Error('currencyContract must be the last currencyContract of requestERC20'));
            }
            if (_signedRequest.expirationDate < (new Date().getTime()) / 1000) {
                return reject(Error('expirationDate must be greater than now'));
            }
            if (hashComputed !== _signedRequest.hash) {
                return reject(Error('hash is not valid'));
            }
            if ( ! this.web3Single.isArrayOfAddressesNoChecksum(_signedRequest.payeesIdAddress)) {
                return reject(Error('payeesIdAddress must be valid eth addresses'));
            }
            if ( ! this.web3Single.isArrayOfAddressesNoChecksum(_signedRequest.payeesPaymentAddress)) {
                return reject(Error('payeesPaymentAddress must be valid eth addresses'));
            }
            if (this.web3Single.areSameAddressesNoChecksum(_payer, _signedRequest.payeesIdAddress[0])) {
                return reject(Error('_from must be different than main payee'));
            }
            if ( ! this.web3Single.isValidSignatureForSolidity(_signedRequest.signature, _signedRequest.hash, _signedRequest.payeesIdAddress[0])) {
                return reject(Error('payee is not the signer'));
            }
            return resolve();
        });
    }
    
    private async isTokenWhiteListed(_tokenAddress: string): Promise<boolean> {
        return (await this.instanceRequestERC20Last.methods.tokensWhiteList(_tokenAddress).call()).whiteListed;
    }

    /**
     * internal create the object signed request
     * @param   tokenAddress              Address token used for payment
     * @param   currencyContract          Address of the ethereum currency contract
     * @param   payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee, must be the signer address)
     * @param   expectedAmounts           amount initial expected per payees for the request
     * @param   payeesPaymentAddress      payment addresses of the payees (the position 0 will be the main payee)
     * @param   expirationDate            timestamp is second of the date after what the signed request is not broadcastable
     * @param   data                      Json of the request's details (optional)
     * @param   extension                 address of the extension contract of the request (optional) NOT USED YET
     * @param   extensionParams           array of parameters for the extension (optional) NOT USED YET
     * @return  promise of the object containing the request signed
     */
    private async createSignedRequest(
        tokenAddress: string,
        currencyContract: string,
        payeesIdAddress: string[],
        expectedAmounts: any[],
        payeesPaymentAddress: Array<string|undefined>,
        expirationDate: number,
        data ?: string,
        extension ?: string,
        extensionParams ?: any[]): Promise<any> {

        const hash = this.hashRequest(tokenAddress,
                                        currencyContract,
                                        payeesIdAddress,
                                        expectedAmounts,
                                        '',
                                        payeesPaymentAddress,
                                        data ? data : '',
                                        expirationDate);

        const signature = await this.web3Single.sign(hash, payeesIdAddress[0]);

        extension = extension ? extension : undefined;
        extensionParams = extension ? extensionParams : undefined;
        data = data ? data : undefined;

        for (const k in expectedAmounts) {
            if (expectedAmounts.hasOwnProperty(k)) {
                expectedAmounts[k] = expectedAmounts[k].toString();
            }
        }

        for (const k in payeesPaymentAddress) {
            if (payeesPaymentAddress.hasOwnProperty(k)) {
                payeesPaymentAddress[k] = payeesPaymentAddress[k] === EMPTY_BYTES_20 ? undefined : payeesPaymentAddress[k];
            }
        }

        return {tokenAddress,
                currencyContract,
                data,
                expectedAmounts,
                expirationDate,
                extension,
                extensionParams,
                hash,
                payeesIdAddress,
                payeesPaymentAddress,
                signature};
    }

    /**
     * internal compute the hash of the request
     * @param   tokenAddress              Address token used for payment
     * @param   currencyContract          Address of the ethereum currency contract
     * @param   payees                    ID addresses of the payees (the position 0 will be the main payee, must be the signer address)
     * @param   expectedAmounts           amount initial expected per payees for the request
     * @param   payer                     payer of the request
     * @param   payeesPaymentAddress      payment addresses of the payees (the position 0 will be the main payee)
     * @param   data                      Json of the request's details (optional)
     * @param   expirationDate            timestamp is second of the date after what the signed request is not broadcastable
     * @return  promise of the object containing the request's hash
     */
    private hashRequest(
        tokenAddress: string,
        currencyContract: string,
        payees: string[],
        expectedAmounts: any[],
        payer: string,
        payeesPayment: any[],
        data: string,
        expirationDate: number): any {

        interface InterfaceAbi {
            value: any;
            type: string;
        }

        const requestParts: InterfaceAbi[] = [
            {value: currencyContract, type: 'address'},
            {value: payees[0], type: 'address'},
            {value: payer, type: 'address'},
            {value: payees.length, type: 'uint8'}];

        for (const k in payees) {
            if (payees.hasOwnProperty(k)) {
                requestParts.push({value: payees[k], type: 'address'});
                requestParts.push({value: expectedAmounts[k], type: 'int256'});
            }
        }

        requestParts.push({value: data.length, type: 'uint8'});
        requestParts.push({value: data, type: 'string'});

        requestParts.push({value: tokenAddress, type: 'address'});

        requestParts.push({value: payeesPayment, type: 'address[]'});
        requestParts.push({value: expirationDate, type: 'uint256'});

        const types: any[] = [];
        const values: any[] = [];
        requestParts.forEach((o, i) => {
            types.push(o.type);
            values.push(o.value);
        });

        return this.web3Single.web3.utils.bytesToHex(ETH_ABI.soliditySHA3(types, values));
    }
}
