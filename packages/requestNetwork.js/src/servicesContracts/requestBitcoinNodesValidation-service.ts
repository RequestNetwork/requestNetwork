import BitcoinService from '../servicesExternal/bitcoin-service';

import RequestCoreService from '../servicesCore/requestCore-service';
import Ipfs from '../servicesExternal/ipfs-service';

import Web3Single from '../servicesExternal/web3-single';

import * as Types from '../types';

// @ts-ignore
import * as Web3PromiEvent from 'web3-core-promievent';

// @ts-ignore
const ETH_ABI = require('../lib/ethereumjs-abi-perso.js');

const BN = Web3Single.BN();

const EMPTY_BYTES_20 = '0x0000000000000000000000000000000000000000';

/**
 * The RequestBitcoinNodesValidationService class is the interface for the Request Bitcoin currency contract with only offchain check
 */
export default class RequestBitcoinNodesValidationService {
    /**
     * get the instance of RequestBitcoinNodesValidationService
     * @return  The instance of the RequestBitcoinNodesValidationService class.
     */
    public static getInstance() {
        if (!RequestBitcoinNodesValidationService._instance) {
            RequestBitcoinNodesValidationService._instance = new this();
        }
        return RequestBitcoinNodesValidationService._instance;
    }

    public static destroy() {
        RequestBitcoinNodesValidationService._instance = null;
    }

    private static _instance: RequestBitcoinNodesValidationService|null;

    public bitcoinService: BitcoinService;
    public web3Single: Web3Single;

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

    // RequestBitcoinNodesValidation on blockchain
    /**
     * RequestBitcoinNodesValidation contract's abi
     */
    protected abiRequestBitcoinNodesValidationLast: any;
    /**
     * RequestBitcoinNodesValidation contract's address
     */
    protected addressRequestBitcoinNodesValidationLast: string;
    /**
     * RequestBitcoinNodesValidation contract's web3 instance
     */
    protected instanceRequestBitcoinNodesValidationLast: any;

    /**
     * constructor to Instantiates a new RequestBitcoinNodesValidationService
     */
    private constructor() {
        this.bitcoinService = BitcoinService.getInstance();
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCoreLast = this.web3Single.getContractInstance('last-RequestCore').abi;
        this.requestCoreServices = RequestCoreService.getInstance();

        const requestBitcoinNodesValidationLastArtifact = this.web3Single.getContractInstance('last-RequestBitcoinNodesValidation');
        if (!requestBitcoinNodesValidationLastArtifact) {
            throw Error('RequestBitcoinNodesValidation Artifact: no config for network : "' + this.web3Single.networkName + '"');
        }
        this.abiRequestBitcoinNodesValidationLast = requestBitcoinNodesValidationLastArtifact.abi;
        this.addressRequestBitcoinNodesValidationLast = requestBitcoinNodesValidationLastArtifact.address;
        this.instanceRequestBitcoinNodesValidationLast = requestBitcoinNodesValidationLastArtifact.instance;
    }

    /**
     * create a request as payee
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
     * @param   _expectedAmounts           amount initial expected per payees for the request
     * @param   _payer                     address of the payer
     * @param   _payeesPaymentAddress      Bitcoin payment addresses of the payees (the position 0 will be the main payee)
     * @param   _payerRefundAddress        Bitcoin refund addresses of the payer (the position 0 will be the main payee)
     * @param   _data                      Json of the request's details (optional)
     * @param   _extension                 address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams           array of parameters for the extension (optional) NOT USED YET
     * @param   _options                   options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public createRequestAsPayee(
        _payeesIdAddress: string[],
        _expectedAmounts: any[],
        _payer: string,
        _payeesPaymentAddress: string[],
        _payerRefundAddress?: string[],
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[] ,
        _options ?: any,
        ): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        _expectedAmounts = _expectedAmounts.map((amount) => new BN(amount));

        const expectedAmountsTotal = _expectedAmounts.reduce((a, b) => a.add(b), new BN(0));

        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            if (_payeesIdAddress.length !== _expectedAmounts.length || _payeesIdAddress.length !== _payeesPaymentAddress.length || (_payerRefundAddress && _payeesIdAddress.length !== _payerRefundAddress.length)) {
                return promiEvent.reject(Error('_payeesIdAddress, _expectedAmounts, _payerRefundAddress and _payeesPaymentAddress must have the same size'));
            }
            if (!this.web3Single.isArrayOfAddressesNoChecksum(_payeesIdAddress)) {
                return promiEvent.reject(Error('_payeesIdAddress must be valid eth addresses'));
            }
            if (!this.bitcoinService.isArrayOfBitcoinAddresses(_payeesPaymentAddress)) {
                return promiEvent.reject(Error('_payeesPaymentAddress must be valid bitcoin addresses'));
            }

            if ( !this.web3Single.areSameAddressesNoChecksum(account, _payeesIdAddress[0]) ) {
                return promiEvent.reject(Error('account broadcaster must be the main payee'));
            }

            if (_expectedAmounts.some((amount: any) => amount.isNeg())) {
                return promiEvent.reject(Error('_expectedAmounts must be positive integers'));
            }

            if (!this.web3Single.isAddressNoChecksum(_payer)) {
                return promiEvent.reject(Error('_payer must be a valid eth address'));
            }
            
            // by default empty refund address
            let _payerRefundAddressParsed:string[] = [];
            if (_payerRefundAddress) {
                _payerRefundAddressParsed = _payerRefundAddress
            }

            if (!this.bitcoinService.isArrayOfBitcoinAddresses(_payerRefundAddressParsed)) {
                return promiEvent.reject(Error('_payerRefundAddress must be valid bitcoin addresses'));
            }

            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }

            if ( this.web3Single.areSameAddressesNoChecksum(account, _payer) ) {
                return promiEvent.reject(Error('_from must be different than _payer'));
            }
            // get the amount to collect
            try {

                const collectEstimation = await this.instanceRequestBitcoinNodesValidationLast.methods.collectEstimation(expectedAmountsTotal).call();

                _options.value = collectEstimation;

                // add file to ipfs
                const hashIpfs = await this.ipfs.addFile(_data);

                const method = this.instanceRequestBitcoinNodesValidationLast.methods.createRequestAsPayeeAction(
                    _payeesIdAddress,
                    this.createBytesForPaymentBitcoinAddress(_payeesPaymentAddress),
                    _expectedAmounts,
                    _payer,
                    this.createBytesForPaymentBitcoinAddress(_payerRefundAddressParsed),
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
     * @param   _payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee, must be the broadcaster address)
     * @param   _expectedAmounts           amount initial expected per payees for the request
     * @param   _expirationDate            timestamp in second of the date after which the signed request is not broadcastable
     * @param   _payeesPaymentAddress      Bitcoin payment addresses of the payees (the position 0 will be the main payee)
     * @param   _data                      Json of the request's details (optional)
     * @param   _extension                 address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams           array of parameters for the extension (optional) NOT USED YET
     * @param   _from                      address of the payee, default account will be used otherwise (optional)
     * @return  promise of the object containing the request signed
     */
    public signRequestAsPayee(
        _payeesIdAddress: string[],
        _expectedAmounts: any[],
        _expirationDate: number,
        _payeesPaymentAddress: string[],
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[],
        _from ?: string,
        ): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();

        _expectedAmounts = _expectedAmounts.map((amount) => new BN(amount));

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_from && err) return promiEvent.reject(err);
            const account: string = _from || defaultAccount || '';

            if (_payeesIdAddress.length !== _expectedAmounts.length || _payeesIdAddress.length !== _payeesPaymentAddress.length) {
                return promiEvent.reject(Error('_payeesIdAddress, _payeesPaymentAddress and _expectedAmounts must have the same size'));
            }

            const todaySolidityTime: number = Date.now() / 1000;
            if ( _expirationDate <= todaySolidityTime ) {
                return promiEvent.reject(Error('_expirationDate must be greater than now'));
            }

            if (_expectedAmounts.some((amount: any) => amount.isNeg())) {
                return promiEvent.reject(Error('_expectedAmounts must be positive integers'));
            }
            if ( !this.web3Single.areSameAddressesNoChecksum(account, _payeesIdAddress[0]) ) {
                return promiEvent.reject(Error('account broadcaster must be the main payee'));
            }
            if (!this.web3Single.isArrayOfAddressesNoChecksum(_payeesIdAddress)) {
                return promiEvent.reject(Error('_payeesIdAddress must be valid eth addresses'));
            }
            if (!this.bitcoinService.isArrayOfBitcoinAddresses(_payeesPaymentAddress)) {
                return promiEvent.reject(Error('_payeesPaymentAddress must be valid bitcoin addresses'));
            }
            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }

            try {
                // add file to ipfs
                const hashIpfs = await this.ipfs.addFile(_data);

                const signedRequest = await this.createSignedRequest(
                                this.addressRequestBitcoinNodesValidationLast,
                                _payeesIdAddress,
                                _expectedAmounts,
                                _payeesPaymentAddress,
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
     * @param   _signedRequest         object signed request
     * @param   _payeesRefundAddress   Bitcoin refund addresses of the payer (the position 0 will be the main payee)
     * @param   _additions             Extra payment amounts in wei for each payee (optional)
     * @param   _options               options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public broadcastSignedRequestAsPayer(
        _signedRequest: any,
        _payerRefundAddress?: string[],
        _additions ?: any[],
        _options ?: any,
        ): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();

        let additionsParsed: any[] = [];
        if (_additions) {
            additionsParsed = _additions.map((amount) => new BN(amount || 0));
        }

        _signedRequest.expectedAmounts = _signedRequest.expectedAmounts.map((amount: any) => new BN(amount));
        const expectedAmountsTotal = _signedRequest.expectedAmounts.reduce((a: any, b: any) => a.add(b), new BN(0));

        _signedRequest.data = _signedRequest.data || '';
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;
            const error = this.validateSignedRequest(_signedRequest, account);
            if (error !== '') return promiEvent.reject(Error(error));

            if (_additions && _signedRequest.payeesIdAddress.length < _additions.length) {
                return promiEvent.reject(Error('_additions can not be bigger than _payeesIdAddress'));
            }
            if (_payerRefundAddress && _signedRequest.payeesIdAddress.length !== _payerRefundAddress.length) {
                return promiEvent.reject(Error('_payeesRefundAddress and _payeesIdAddress must have the same size'));
            }

            // by default empty refund address
            let _payerRefundAddressParsed:string[] = [];
            if (_payerRefundAddress) {
                _payerRefundAddressParsed = _payerRefundAddress
            }

            if (!this.bitcoinService.isArrayOfBitcoinAddresses(_payerRefundAddressParsed)) {
                return promiEvent.reject(Error('payeesRefundAddress must be valid bitcoin addresses'));
            }
            if (additionsParsed.some((amount: any) => amount.isNeg())) {
                return promiEvent.reject(Error('_additions must be positive integers'));
            }
            if (this.web3Single.areSameAddressesNoChecksum(account, _signedRequest.payeesIdAddress[0]) ) {
                return promiEvent.reject(Error('_from must be different than the main payee'));
            }
            if (_signedRequest.extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }

            try {
                // get the amount to collect
                const collectEstimation = await this.instanceRequestBitcoinNodesValidationLast.methods.collectEstimation(expectedAmountsTotal).call();

                _options.value = collectEstimation;

                const method = this.instanceRequestBitcoinNodesValidationLast.methods.broadcastSignedRequestAsPayerAction(
                                                    this.requestCoreServices.createBytesRequest(_signedRequest.payeesIdAddress, _signedRequest.expectedAmounts, 0, _signedRequest.data),
                                                    this.createBytesForPaymentBitcoinAddress(_signedRequest.payeesPaymentAddress),
                                                    this.createBytesForPaymentBitcoinAddress(_payerRefundAddressParsed),
                                                    additionsParsed,
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
        _options ?: any): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (request.state !== Types.State.Created) {
                    return promiEvent.reject(Error(`request state is not 'created'`));
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
        _options ?: any): PromiseEventEmitter<any> {
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
                    return promiEvent.reject(Error(`payer can cancel request in state 'created'`));
                }
                if ( this.web3Single.areSameAddressesNoChecksum(account, request.payee.address)
                        && request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('payee cannot cancel request already canceled'));
                }

                const totalBalance = request.subPayees.reduce(
                      (total: any, subPayee: any) => total.add(subPayee.balance),
                      request.payee.balance);

                if ( !totalBalance.isZero() ) {
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
     * Reduce the amount due to each payee. This can be called by the payee e.g. to apply discounts or
     * special offers.
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId      ID of the Request
     * @param   _amounts        Array of reduction amounts in wei for each payee
     * @param   _options        Options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public reduceExpectedAmounts(
        _requestId: string,
        _amounts: any[],
        _options ?: any): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        let amountsParsed: any[] = [];
        if (_amounts) {
            amountsParsed = _amounts.map((amount) => new BN(amount || 0));
        }

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (_amounts && request.subPayees.length + 1 < _amounts.length) {
                    return promiEvent.reject(Error('amounts can not be bigger than _payeesIdAddress'));
                }
                if (amountsParsed.some((amount: any) => amount.isNeg())) {
                    return promiEvent.reject(Error('amounts must be positive integers'));
                }
                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payee.address) ) {
                    return promiEvent.reject(Error('account must be payee'));
                }
                if (request.payee.expectedAmount.lt(amountsParsed[0])) {
                    return promiEvent.reject(Error(`amounts must be lower than expected amounts`));
                }
                let amountTooHigh = false;
                let amountsTooLong = false;
                for (const k in amountsParsed) {
                    if (k === '0') continue;
                    if (!request.subPayees.hasOwnProperty(parseInt(k, 10) - 1)) {
                        amountsTooLong = true;
                        break;
                    }
                    if (request.subPayees[parseInt(k, 10) - 1].expectedAmount.lt(amountsParsed[k])) {
                        amountTooHigh = true;
                        break;
                    }
                }
                if (amountsTooLong) {
                    return promiEvent.reject(Error('amounts size must be lower than number of payees'));
                }
                if (amountTooHigh) {
                    return promiEvent.reject(Error(`amounts must be lower than expected amounts`));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.subtractAction(_requestId, amountsParsed);

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
     * add subtracts to a request as payee
     * @deprecated('Renamed to reduceExpectedAmounts')
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _subtracts         amounts of subtracts in wei for each payee
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public subtractAction(
        _requestId: string,
        _subtracts: any[],
        _options ?: any): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        console.warn('Deprecated. See reduceExpectedAmounts');
        return this.reduceExpectedAmounts(_requestId, _subtracts, _options);
    }

   /**
     * Increase the amount due to each payee. This can be called by the payer e.g. to add extra
     * payments to the Request for tips or bonuses.
     *
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId     ID of the Request
     * @param   _amounts       Extra payment amounts in wei for each payee
     * @param   _options       Transaction options (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public increaseExpectedAmounts(
        _requestId: string,
        _amounts: any[],
        _options ?: any): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        let amountsParsed: any[] = [];
        if (_amounts) {
            amountsParsed = _amounts.map((amount) => new BN(amount || 0));
        }

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if (_amounts && request.subPayees.length + 1 < _amounts.length) {
                    return promiEvent.reject(Error('amounts can not be bigger than _payeesIdAddress'));
                }
                if (amountsParsed.some((amount: any) => amount.isNeg())) {
                    return promiEvent.reject(Error('amounts must be positive integers'));
                }
                if ( request.state === Types.State.Canceled ) {
                    return promiEvent.reject(Error('request must be accepted or created'));
                }
                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be payer'));
                }

                let amountsTooLong = false;
                for (const k in amountsParsed) {
                    if (k === '0') continue;
                    if (!request.subPayees.hasOwnProperty(parseInt(k, 10) - 1)) {
                        amountsTooLong = true;
                        break;
                    }
                }
                if (amountsTooLong) {
                    return promiEvent.reject(Error('amounts size must be lower than number of payees'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.additionalAction(_requestId, amountsParsed);

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
     * add additionals to a request as payer
     * @deprecated('Renamed to increaseExpectedAmounts')
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _requestId         requestId of the payer
     * @param   _additionals       amounts of additionals in wei for each payee
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public additionalAction(
        _requestId: string,
        _additionals: any[],
        _options ?: any): PromiseEventEmitter<any> {

        console.warn('Deprecated. See increaseExpectedAmounts');
        return this.increaseExpectedAmounts(_requestId, _additionals, _options);
    }

    /**
     * pay a request (Not implemented for bitcoin)
     * @param   _requestId         requestId of the payer
     * @param   _amountsToPay      amounts to pay in wei for each payee
     * @param   _additions         amounts of additional payments in wei for each payee (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise always rejected
     */
    public paymentAction(
        _requestId: string,
        _amountsToPay: any[],
        _additions ?: any[],
        _options ?: any): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        promiEvent.reject(Error('paymentAction not implemented for BTC'));
        return promiEvent.eventEmitter;
    }

    /**
     * refund a request as payee (Not implemented for bitcoin)
     * @param   _requestId         requestId of the payer
     * @param   _amountToRefund    amount to refund in wei
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise always rejected
     */
    public refundAction(
        _requestId: string,
        _amountToRefund: any,
        _options ?: any): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        promiEvent.reject(Error('refundAction not implemented for BTC'));
        return promiEvent.eventEmitter;
    }

    /**
     * add the refund addresses for the payer
     * @param   _requestId             requestId of the payer
     * @param   _payeesRefundAddress   Bitcoin refund addresses of the payer (the position 0 will be the main payee)
     * @param   _options               options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public addPayerRefundAddressAction(
        _requestId: string,
        _payerRefundAddress: string[],
        _options ?: any): PromiseEventEmitter<any> {
        const promiEvent = Web3PromiEvent();
        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            try {
                const request = await this.getRequest(_requestId);

                if ( request.subPayees.length + 1 !== _payerRefundAddress.length) {
                    return promiEvent.reject(Error('_payerRefundAddress must have the same size as the number of payees'));
                }

                if (!this.bitcoinService.isArrayOfBitcoinAddresses(_payerRefundAddress)) {
                    return promiEvent.reject(Error('_payerRefundAddress must be valid bitcoin addresses'));
                }

                if ( !this.web3Single.areSameAddressesNoChecksum(account, request.payer) ) {
                    return promiEvent.reject(Error('account must be the payer'));
                }

                if ( request.currencyContract.payeeRefundAddress !== '') {
                    return promiEvent.reject(Error('_payerRefundAddress has been already given'));
                }

                const contract = this.web3Single.getContractInstance(request.currencyContract.address);
                const method = contract.instance.methods.addPayerRefundAddressAction(_requestId, this.createBytesForPaymentBitcoinAddress(_payerRefundAddress));
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
                            try {
                                const requestAfter = await this.getRequest(receipt.events.RefundAddressAdded.returnValues.requestId);
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
     * Get info from currency contract (generic method)
     * @param   _requestId    requestId of the request
     * @return  promise of the information from the currency contract of the request (always {} here)
     */
    public getRequestCurrencyContractInfo(
        requestData: any,
        coreContract: any): Promise < any > {
        return new Promise(async (resolve, reject) => {
            try {
                const currencyContract = this.web3Single.getContractInstance(requestData.currencyContract);

                // get payee payment bitcoin address
                const payeePaymentAddress: string = await currencyContract.instance.methods.payeesPaymentAddress(requestData.requestId, 0).call();

                // get subPayees payment addresses
                const subPayeesCount = requestData.subPayees.length;
                const subPayeesPaymentAddress: string[] = [];
                for (let i = 0; i < subPayeesCount; i++) {
                    const paymentAddress = await currencyContract.instance.methods.payeesPaymentAddress(requestData.requestId, i + 1).call();
                    subPayeesPaymentAddress.push(paymentAddress);
                }

                // get payee Refund bitcoin Address
                const payeeRefundAddress: string = await currencyContract.instance.methods.payerRefundAddress(requestData.requestId, 0).call();

                // get subPayees refund bitcoin addresses
                const subPayeesRefundAddress: string[] = [];
                for (let i = 0; i < subPayeesCount; i++) {
                    const refundAddress = await currencyContract.instance.methods.payerRefundAddress(requestData.requestId, i + 1).call();
                    subPayeesRefundAddress.push(refundAddress);
                }

                const allPayees: string[] = [payeePaymentAddress].concat(subPayeesPaymentAddress);
                const allPayeesRefund: string[] = [payeeRefundAddress].concat(subPayeesRefundAddress);

                // get all payement on the payees addresses
                const dataPayments = await this.bitcoinService.getMultiAddress(allPayees);
                const balance: any = {};
                for (const tx of dataPayments.txs) {
                    for (const o of tx.out) {
                        if (allPayees.indexOf(o.addr) !== -1) {
                            if (!balance[o.addr]) {
                                balance[o.addr] = new BN(0);
                            }
                            balance[o.addr] = balance[o.addr].add(new BN(o.value));
                        }
                    }
                }

                // get all refund on the payees refund addresses
                const dataRefunds = await this.bitcoinService.getMultiAddress(allPayeesRefund);
                const balanceRefund: any = {};
                for (const tx of dataRefunds.txs) {
                    for (const o of tx.out) {
                        if (allPayeesRefund.indexOf(o.addr) !== -1) {
                            if (!balanceRefund[o.addr]) {
                                balanceRefund[o.addr] = new BN(0);
                            }
                            balanceRefund[o.addr] = balanceRefund[o.addr].add(new BN(o.value));
                        }
                    }
                }

                let paymentTemp: any;
                let refundTemp: any;

                // update balance of subPayees objects
                for (let i = 0; i < subPayeesCount; i++) {
                    paymentTemp = new BN(balance[subPayeesPaymentAddress[i]]);
                    refundTemp = new BN(balanceRefund[subPayeesRefundAddress[i]]);
                    requestData.subPayees[i].balance = paymentTemp.sub(refundTemp);
                }
                // update balance of payee object
                paymentTemp = new BN(balance[payeePaymentAddress]);
                refundTemp = new BN(balanceRefund[payeeRefundAddress]);
                requestData.payee.balance = paymentTemp.sub(refundTemp);

                requestData.currencyContract = {payeePaymentAddress, subPayeesPaymentAddress, payeeRefundAddress, subPayeesRefundAddress, address: requestData.currencyContract};

                return resolve(requestData);
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
     * decode data from input tx (generic method)
     * @param   _data    requestId of the request
     * @return  return an object with the name of the function and the parameters
     */
    public decodeInputData(_address: string, _data: any): any {
        const contract = this.web3Single.getContractInstance(_address);
        return this.web3Single.decodeInputData(contract.abi, _data);
    }

    /**
     * check if a signed request is valid
     * @param   _signedRequest    Signed request
     * @param   _payer             Payer of the request
     * @return  return a string with the error, or ''
     */
    public validateSignedRequest(_signedRequest: any, _payer: string): string {
        _signedRequest.expectedAmounts = _signedRequest.expectedAmounts.map((amount: any) => new BN(amount));

        const hashComputed = this.hashRequest(
                        _signedRequest.currencyContract,
                        _signedRequest.payeesIdAddress,
                        _signedRequest.expectedAmounts,
                        '',
                        _signedRequest.payeesPaymentAddress,
                        _signedRequest.data ? _signedRequest.data : '',
                        _signedRequest.expirationDate);

        if (!_signedRequest) {
            return '_signedRequest must be defined';
        }
        // some controls on the arrays
        if (_signedRequest.payeesIdAddress.length !== _signedRequest.expectedAmounts.length
                || _signedRequest.payeesIdAddress.length !== _signedRequest.payeesPaymentAddress.length ) {
            return '_payeesIdAddress, payeesPaymentAddress and _expectedAmounts must have the same size';
        }
        if (_signedRequest.expectedAmounts.some((amount: any) => amount.isNeg())) {
            return '_expectedAmounts must be positive integers';
        }
        if (!this.web3Single.areSameAddressesNoChecksum(this.addressRequestBitcoinNodesValidationLast, _signedRequest.currencyContract)) {
            return 'currencyContract must be the last currencyContract of requestBitcoinNodesValidation';
        }
        if (_signedRequest.expirationDate < Date.now() / 1000) {
            return 'expirationDate must be greater than now';
        }
        if (hashComputed !== _signedRequest.hash) {
            return 'hash is not valid';
        }
        if (!this.web3Single.isArrayOfAddressesNoChecksum(_signedRequest.payeesIdAddress)) {
            return 'payeesIdAddress must be valid eth addresses';
        }
        if (!this.bitcoinService.isArrayOfBitcoinAddresses(_signedRequest.payeesPaymentAddress)) {
            return 'payeesPaymentAddress must be valid bitcoin addresses';
        }
        if (this.web3Single.areSameAddressesNoChecksum(_payer, _signedRequest.payeesIdAddress[0])) {
            return '_from must be different than main payee';
        }
        if (!this.web3Single.isValidSignatureForSolidity(_signedRequest.signature, _signedRequest.hash, _signedRequest.payeesIdAddress[0])) {
            return 'payee is not the signer';
        }
        return '';
    }

    /**
     * Get request events from currency contract (generic method)
     * @param   _requestId    requestId of the request
     * @param   _fromBlock    search events from this block (optional)
     * @param   _toBlock    search events until this block (optional)
     * @return  promise of the object containing the events from the currency contract of the request (always {} here)
     */
    public async getRequestEventsCurrencyContractInfo(
        _request: any,
        _coreContract: any,
        _fromBlock ?: number,
        _toBlock ?: number): Promise < any > {
        try {
            const currencyContract = this.web3Single.getContractInstance(_request.currencyContract);

            // ----------------------------------
            // First, we retrieved the payments and refunds linked to the request:
            // payee payment address
            const payeePaymentAddress: string = await currencyContract.instance.methods.payeesPaymentAddress(_request.requestId, 0).call();
            // get subPayees payment addresses
            const subPayeesCount = await _coreContract.instance.methods.getSubPayeesCount(_request.requestId).call();
            const subPayeesPaymentAddress: string[] = [];
            for (let i = 0; i < subPayeesCount; i++) {
                const paymentAddress = await currencyContract.instance.methods.payeesPaymentAddress(_request.requestId, i + 1).call();
                subPayeesPaymentAddress.push(paymentAddress);
            }

            // payee refund address
            const payerRefundAddress: string = await currencyContract.instance.methods.payerRefundAddress(_request.requestId, 0).call();
            // get subPayees refund addresses
            const subPayeesRefundAddress: string[] = [];
            for (let i = 0; i < subPayeesCount; i++) {
                const refundAddress = await currencyContract.instance.methods.payerRefundAddress(_request.requestId, i + 1).call();
                subPayeesRefundAddress.push(refundAddress);
            }

            const allPayees: string[] = [payeePaymentAddress].concat(subPayeesPaymentAddress);
            const allPayeesRefund: string[] = [payerRefundAddress].concat(subPayeesRefundAddress);

            // get all payment on the payees addresses
            const dataPayments = await this.bitcoinService.getMultiAddress(allPayees);
            // get all refund on the payees addresses
            const dataRefunds = await this.bitcoinService.getMultiAddress(allPayeesRefund);

            // build the payment events from the refund transactions
            const eventPayments: any[] = [];
            for (const tx of dataPayments.txs) {
                for (const o of tx.out) {
                    if (allPayees.indexOf(o.addr) !== -1) {
                        eventPayments.push({ _meta: { hash: tx.hash, blockNumber: tx.block_height, timestamp: tx.time},
                                                data: {
                                                    0: _request.requestId,
                                                    1: allPayees.indexOf(o.addr),
                                                    2: new BN(o.value),
                                                    requestId: _request.requestId,
                                                    payeeIndex: allPayees.indexOf(o.addr),
                                                    deltaAmount: new BN(o.value),
                                                },
                                                name: 'UpdateBalance'});
                    }
                }
            }

            // build the refund events from the refund transactions
            const eventRefunds: any[] = [];
            for (const tx of dataPayments.txs) {
                for (const o of tx.out) {
                    if (allPayeesRefund.indexOf(o.addr) !== -1) {
                        eventRefunds.push({ _meta: { hash: tx.hash, blockNumber: tx.block_height, timestamp: tx.time},
                                                data: {
                                                    0: _request.requestId,
                                                    1: allPayeesRefund.indexOf(o.addr),
                                                    2: new BN(-o.value),
                                                    requestId: _request.requestId,
                                                    payeeIndex: allPayeesRefund.indexOf(o.addr),
                                                    deltaAmount: new BN(-o.value),
                                                },
                                                name: 'UpdateBalance'});
                    }
                }
            }

            // ----------------------------------
            // Second, we get the event RefundAddressAdded if it has been triggered
            const optionFilters = {
                filter: { requestId: _request._requestId },
                fromBlock: _fromBlock ? _fromBlock : currencyContract.blockNumber,
                toBlock: _toBlock ? _toBlock : 'latest'};

            let eventsRaw: any[] = [];

            eventsRaw = eventsRaw.concat(
                await currencyContract.instance.getPastEvents('RefundAddressAdded', optionFilters)
            );

            let eventsContract = [];
            eventsContract = await Promise.all(eventsRaw.map(async (e) => {
                return new Promise(async (resolveEvent, rejectEvent) => {
                    const transaction = await this.web3Single.getTransaction(e.transactionHash);
                    resolveEvent({
                        _meta: {
                            blockNumber: e.blockNumber,
                            logIndex: e.logIndex,
                            timestamp: await this.web3Single.getBlockTimestamp(e.blockNumber)},
                        data: e.returnValues,
                        name: e.event,
                        from: transaction.from});
                });
            }));


            return Promise.resolve(eventRefunds.concat(eventPayments).concat(eventsContract));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * internal create the object signed request
     * @param   currencyContract          Address of the ethereum currency contract
     * @param   payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee, must be the signer address)
     * @param   expectedAmounts           amount initial expected per payees for the request
     * @param   payeesPaymentAddress      payment addresses of the payees (the position 0 will be the main payee)
     * @param   expirationDate            timestamp in second of the date after which the signed request is not broadcastable
     * @param   data                      Json of the request's details (optional)
     * @param   extension                 address of the extension contract of the request (optional) NOT USED YET
     * @param   extensionParams           array of parameters for the extension (optional) NOT USED YET
     * @return  promise of the object containing the request signed
     */
    private async createSignedRequest(
        currencyContract: string,
        payeesIdAddress: string[],
        expectedAmounts: any[],
        payeesPaymentAddress: string[],
        expirationDate: number,
        data ?: string,
        extension ?: string,
        extensionParams ?: any[]): Promise<any> {

        const hash = this.hashRequest(currencyContract,
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

        return {currencyContract,
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
     * @param   currencyContract          Address of the ethereum currency contract
     * @param   payees                    ID addresses of the payees (the position 0 will be the main payee, must be the signer address)
     * @param   expectedAmounts           amount initial expected per payees for the request
     * @param   payer                     payer of the request
     * @param   payeesPaymentAddress      payment addresses of the payees (the position 0 will be the main payee)
     * @param   data                      Json of the request's details (optional)
     * @param   expirationDate            timestamp in second of the date after which the signed request is not broadcastable
     * @return  promise of the object containing the request's hash
     */
    private hashRequest(currencyContract: string,
                        payees: string[],
                        expectedAmounts: any[],
                        payer: string,
                        payeesPayment: string[],
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

        requestParts.push({value: this.createBytesForPaymentBitcoinAddressBuffer(payeesPayment), type: 'bytes'});
        requestParts.push({value: expirationDate, type: 'uint256'});

        const types: any[] = [];
        const values: any[] = [];
        requestParts.forEach((o, i) => {
            types.push(o.type);
            values.push(o.value);
        });

        return this.web3Single.web3.utils.bytesToHex(ETH_ABI.soliditySHA3(types, values));
    }

    /**
     * create a bytes request
     * @param   payeesPaymentAddress           bitcoin addresses of the payees
     * @return  the request in bytes
     */
    private createBytesForPaymentBitcoinAddress(_payeesPaymentAddress: string[]): any {
        return this.web3Single.web3.utils.bytesToHex(this.createBytesForPaymentBitcoinAddressBuffer(_payeesPaymentAddress));
    }

    private createBytesForPaymentBitcoinAddressBuffer(_payeesPaymentAddress: string[]): any {
        const requestParts = [];

        for (const k in _payeesPaymentAddress) {
            if (_payeesPaymentAddress.hasOwnProperty(k)) {
                requestParts.push({value: _payeesPaymentAddress[k].length, type: 'uint8'});
                requestParts.push({value: _payeesPaymentAddress[k], type: 'string'});
            }
        }

        const types: string[] = [];
        const values: any[] = [];
        requestParts.forEach((o) => {
            types.push(o.type);
            values.push(o.value);
        });

        return ETH_ABI.solidityPack(types, values);
    }
}
