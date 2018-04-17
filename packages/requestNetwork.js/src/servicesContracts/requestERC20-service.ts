import RequestCoreService from '../servicesCore/requestCore-service';
import Ipfs from '../servicesExternal/ipfs-service';

import Erc20Service from '../servicesExternal/erc20-service';

import * as ServicesContracts from '../servicesContracts';

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
const DEFAULT_GAS_ERC20_PAYMENTACTION = '120000';
const DEFAULT_GAS_ERC20_BROADCASTACTION = '700000';
const DEFAULT_GAS_ERC20_REFUNDACTION = '100000';
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

    private web3Single: Web3Single;

    /**
     * constructor to Instantiates a new RequestERC20Service
     */
    constructor() {
        this.web3Single = Web3Single.getInstance();
        this.ipfs = Ipfs.getInstance();

        this.abiRequestCoreLast = this.web3Single.getContractInstance('last-RequestCore').abi;
        this.requestCoreServices = new RequestCoreService();
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

            const instanceRequestERC20Last = this.getLastInstanceRequestERC20(_tokenAddress);
            if (!instanceRequestERC20Last) {
                return promiEvent.reject(Error('token not supported'));
            }

            // get the amount to collect
            try {
                const collectEstimation = await instanceRequestERC20Last.instance.methods.collectEstimation(expectedAmountsTotal).call();

                _options.value = collectEstimation;

                // add file to ipfs
                const hashIpfs = await this.ipfs.addFile(_data);

                const method = instanceRequestERC20Last.instance.methods.createRequestAsPayeeAction(
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
     * create a request as payer
     * @dev emit the event 'broadcasted' with {transaction: {hash}} when the transaction is submitted
     * @param   _payeesIdAddress           ID addresses of the payees (the position 0 will be the main payee)
     * @param   _expectedAmounts           amount initial expected per payees for the request
     * @param   _payerRefundAddress        refund address of the payer (optional)
     * @param   _amountsToPay              amounts to pay for each payee (optional)
     * @param   _additionals               amounts of additional for each payee (optional)
     * @param   _data                      Json of the request's details (optional)
     * @param   _extension                 address of the extension contract of the request (optional) NOT USED YET
     * @param   _extensionParams           array of parameters for the extension (optional) NOT USED YET
     * @param   _options                   options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the object containing the request and the transaction hash ({request, transactionHash})
     */
    public createRequestAsPayer(
        _tokenAddress: string,
        _payeesIdAddress: string[],
        _expectedAmounts: any[],
        _payerRefundAddress ?: string,
        _amountsToPay ?: any[],
        _additionals ?: any[],
        _data ?: string,
        _extension ?: string,
        _extensionParams ?: any[],
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();

        _expectedAmounts = _expectedAmounts.map((amount) => new BN(amount));
        let amountsToPayParsed: any[] = [];
        if (_amountsToPay) {
            amountsToPayParsed = _amountsToPay.map((amount) => new BN(amount || 0));
        }
        let additionalsParsed: any[] = [];
        if (_additionals) {
            additionalsParsed = _additionals.map((amount) => new BN(amount || 0));
        }
        const expectedAmountsTotal = _expectedAmounts.reduce((a, b) => a.add(b), new BN(0));
        const amountsToPayTotal = amountsToPayParsed.reduce((a, b) => a.add(b), new BN(0));

        _options = this.web3Single.setUpOptions(_options);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            const account = _options.from || defaultAccount;

            // some controls on the arrays
            if (_payeesIdAddress.length !== _expectedAmounts.length) {
                return promiEvent.reject(Error('_payeesIdAddress and _expectedAmounts must have the same size'));
            }
            if (_amountsToPay && _payeesIdAddress.length < _amountsToPay.length) {
                return promiEvent.reject(Error('_amountsToPay cannot be bigger than _payeesIdAddress'));
            }
            if (_additionals && _payeesIdAddress.length < _additionals.length) {
                return promiEvent.reject(Error('_additionals cannot be bigger than _payeesIdAddress'));
            }
            if (!this.web3Single.isArrayOfAddressesNoChecksum(_payeesIdAddress)) {
                return promiEvent.reject(Error('_payeesIdAddress must be valid eth addresses'));
            }
            if (_expectedAmounts.filter((amount) => amount.isNeg()).length !== 0) {
                return promiEvent.reject(Error('_expectedAmounts must be positives integer'));
            }
            if (amountsToPayParsed.filter((amount) => amount.isNeg()).length !== 0) {
                return promiEvent.reject(Error('_amountsToPay must be positives integer'));
            }
            if (additionalsParsed.filter((amount) => amount.isNeg()).length !== 0) {
                return promiEvent.reject(Error('_additionals must be positives integer'));
            }
            if (_extension) {
                return promiEvent.reject(Error('extensions are disabled for now'));
            }
            if (_payerRefundAddress && !this.web3Single.isAddressNoChecksum(_payerRefundAddress)) {
                return promiEvent.reject(Error('_payerRefundAddress must be a valid eth address'));
            }
            if (this.web3Single.areSameAddressesNoChecksum(account, _payeesIdAddress[0]) ) {
                return promiEvent.reject(Error('_from must be different than the main payee'));
            }

            try {
                const instanceRequestERC20Last = this.getLastInstanceRequestERC20(_tokenAddress);
                if (!instanceRequestERC20Last) {
                    return promiEvent.reject(Error('token not supported'));
                }

                const tokenErc20 = new Erc20Service(_tokenAddress);
                // check token Balance
                const balanceAccount = new BN(await tokenErc20.balanceOf(account));
                if ( !_options.skipERC20checkAllowance && balanceAccount.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('balance of token is too low'));
                }
                // check allowance
                const allowance = new BN(await tokenErc20.allowance(account, instanceRequestERC20Last.address));
                if ( !_options.skipERC20checkAllowance && allowance.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('allowance of token is too low'));
                }

                // add file to ipfs
                const hashIpfs = await this.ipfs.addFile(_data);

                // get the amount to collect
                const collectEstimation = await instanceRequestERC20Last.instance.methods.collectEstimation(expectedAmountsTotal).call();

                _options.value = new BN(collectEstimation);

                const method = instanceRequestERC20Last.instance.methods.createRequestAsPayerAction(
                                _payeesIdAddress,
                                _expectedAmounts,
                                _payerRefundAddress,
                                amountsToPayParsed,
                                additionalsParsed,
                                hashIpfs);

                _options = this.web3Single.setUpOptions(_options);
                if (_options.skipERC20checkAllowance) {
                    _options.gas = DEFAULT_GAS_ERC20_BROADCASTACTION;
                    _options.skipERC20checkAllowance = undefined;
                    _options.skipSimulation = true;
                }

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

            if (!this.web3Single.isAddressNoChecksum(_tokenAddress)) {
                return promiEvent.reject(Error('_tokenAddress must be a valid eth address'));
            }

            const instanceRequestERC20Last = this.getLastInstanceRequestERC20(_tokenAddress);
            if (!instanceRequestERC20Last) {
                return promiEvent.reject(Error('token not supported'));
            }

            try {
                // add file to ipfs
                const hashIpfs = await this.ipfs.addFile(_data);

                const signedRequest = await this.createSignedRequest(
                                instanceRequestERC20Last.address,
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
     * @param   _amountsToPay      amounts to pay for each payee (optional)
     * @param   _additionals       amounts of additional for each payee (optional)
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation, skipERC20checkAllowance)
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
                const contract = this.web3Single.getContractInstance(_signedRequest.currencyContract);
                const tokenAddressERC20 = await contract.instance.methods.addressToken().call();
                const instanceRequestERC20Last = this.getLastInstanceRequestERC20(tokenAddressERC20);
                if (!instanceRequestERC20Last) {
                    return promiEvent.reject(Error('token not supported'));
                }

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

                const tokenErc20 = new Erc20Service(tokenAddressERC20);
                // check token Balance
                const balanceAccount = new BN(await tokenErc20.balanceOf(account));
                if ( !_options.skipERC20checkAllowance && balanceAccount.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('balance of token is too low'));
                }
                // check allowance
                const allowance = new BN(await tokenErc20.allowance(account, contract.address));
                if ( !_options.skipERC20checkAllowance && allowance.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('allowance of token is too low'));
                }

                // get the amount to collect
                const collectEstimation = await instanceRequestERC20Last.instance.methods.collectEstimation(expectedAmountsTotal).call();

                _options.value = new BN(collectEstimation);

                const method = instanceRequestERC20Last.instance.methods.broadcastSignedRequestAsPayerAction(
                                                    this.requestCoreServices.createBytesRequest(_signedRequest.payeesIdAddress, _signedRequest.expectedAmounts, 0, _signedRequest.data),
                                                    _signedRequest.payeesPaymentAddress,
                                                    amountsToPayParsed,
                                                    additionalsParsed,
                                                    _signedRequest.expirationDate,
                                                    _signedRequest.signature);

                _options = this.web3Single.setUpOptions(_options);
                if (_options.skipERC20checkAllowance) {
                    _options.gas = DEFAULT_GAS_ERC20_BROADCASTACTION;
                    _options.skipERC20checkAllowance = undefined;
                    _options.skipSimulation = true;
                }

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
     * add additionals to a request as payer
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
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation, skipERC20checkAllowance)
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
                if (!_options.skipERC20checkAllowance && balanceAccount.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('balance of token is too low'));
                }
                // check allowance
                const allowance = new BN(await tokenErc20.allowance(account, contract.address));
                if (!_options.skipERC20checkAllowance && allowance.lt(amountsToPayTotal) ) {
                    return promiEvent.reject(Error('allowance of token is too low'));
                }

                const method = contract.instance.methods.paymentAction(
                                                                    _requestId,
                                                                    amountsToPayParsed,
                                                                    additionalsParsed);

                _options = this.web3Single.setUpOptions(_options);
                if (_options.skipERC20checkAllowance) {
                    _options.gas = DEFAULT_GAS_ERC20_PAYMENTACTION;
                    _options.skipERC20checkAllowance = undefined;
                    _options.skipSimulation = true;
                }

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
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation, skipERC20checkAllowance)
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
                if ( !_options.skipERC20checkAllowance && balanceAccount.lt(_amountToRefund) ) {
                    return promiEvent.reject(Error('balance of token is too low'));
                }
                // check allowance
                const allowance = new BN(await tokenErc20.allowance(account, contract.address));
                if ( !_options.skipERC20checkAllowance && allowance.lt(_amountToRefund) ) {
                    return promiEvent.reject(Error('allowance of token is too low'));
                }

                const method = contract.instance.methods.refundAction(_requestId, _amountToRefund);

                _options = this.web3Single.setUpOptions(_options);
                if (_options.skipERC20checkAllowance) {
                    _options.gas = DEFAULT_GAS_ERC20_REFUNDACTION;
                    _options.skipERC20checkAllowance = undefined;
                    _options.skipSimulation = true;
                }

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
     * get the token address of a currency contract
     * @param   _currencyContractAddress     currency contract
     * @return  promise of the token address
     */
    public async getTokenAddressFromCurrencyContract(
        _currencyContractAddress: string): Promise<string> {
        const contract = this.web3Single.getContractInstance(_currencyContractAddress);
        if (! contract) return '';
        return contract.instance.methods.addressToken().call();
    }

    /**
     * Do a token allowance for a request
     * @param   _requestId     requestId of the request
     * @param   _amount        amount to allowed
     * @param   _options       options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the amount allowed
     */
    public approveTokenForRequest(
        _requestId: string,
        _amount: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _amount = new BN(_amount);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) {
                return promiEvent.reject(err);
            }
            _options.from = _options.from ? _options.from : defaultAccount;

            const request = await this.getRequest(_requestId);
            const tokenErc20 = new Erc20Service(request.currencyContract.tokenAddress);

            const result = await tokenErc20.approve(request.currencyContract.address, _amount, _options)
                    .on('broadcasted', (data: any) => {
                        return promiEvent.eventEmitter.emit('broadcasted', data);
                    });
            return promiEvent.resolve(result);
        });

        return promiEvent.eventEmitter;
    }

    /**
     * Do a token allowance for a signed request
     * @param   _signedRequest     object signed request
     * @param   _amount            amount to allowed
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the amount allowed
     */
    public approveTokenForSignedRequest(
        _signedRequest: any,
        _amount: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _amount = new BN(_amount);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            _options.from = _options.from ? _options.from : defaultAccount;

            const contract = this.web3Single.getContractInstance(_signedRequest.currencyContract);
            const tokenAddressERC20 = await contract.instance.methods.addressToken().call();
            const instanceRequestERC20Last = this.getLastInstanceRequestERC20(tokenAddressERC20);
            if (!instanceRequestERC20Last) {
                return promiEvent.reject(Error('token not supported'));
            }

            if ( _signedRequest.currencyContract.toLowerCase() !== instanceRequestERC20Last.address ) {
                return promiEvent.reject('currency contract given is not the last contract');
            }

            const tokenErc20 = new Erc20Service(tokenAddressERC20);

            const result = await tokenErc20.approve(_signedRequest.currencyContract, _amount, _options)
                    .on('broadcasted', (data: any) => {
                        return promiEvent.eventEmitter.emit('broadcasted', data);
                    });
            return promiEvent.resolve(result);
        });

        return promiEvent.eventEmitter;
    }

    /**
     * Do a token allowance for a token address
     * @param   _tokenAddress      token address
     * @param   _amount            amount to allowed
     * @param   _options           options for the method (gasPrice, gas, value, from, numberOfConfirmation)
     * @return  promise of the amount allowed
     */
    public approveTokenFromTokenAddress(
        _tokenAddress: string,
        _amount: any,
        _options ?: any): Web3PromiEvent {
        const promiEvent = Web3PromiEvent();
        _amount = new BN(_amount);

        this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
            if (!_options.from && err) return promiEvent.reject(err);
            _options.from = _options.from ? _options.from : defaultAccount;

            const instanceRequestERC20Last = this.getLastInstanceRequestERC20(_tokenAddress);
            if (!instanceRequestERC20Last) {
                return promiEvent.reject(Error('token not supported'));
            }

            const tokenErc20 = new Erc20Service(_tokenAddress);

            const result = await tokenErc20.approve(instanceRequestERC20Last.address, _amount, _options)
                    .on('broadcasted', (data: any) => {
                        return promiEvent.eventEmitter.emit('broadcasted', data);
                    });
            return promiEvent.resolve(result);
        });

        return promiEvent.eventEmitter;
    }

    /**
     * Get a token allowance for a request
     * @param   _currencyContractAddress       currency contract address
     * @param   _options                       options for the method (here only from)
     * @return  promise of the amount allowed
     */
    public getTokenAllowance(
        _currencyContractAddress: string,
        _options: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            this.web3Single.getDefaultAccountCallback(async (err, defaultAccount) => {
                if (!_options.from && err) {
                    return reject(err);
                }
                _options.from = _options.from ? _options.from : defaultAccount;

                const contract = this.web3Single.getContractInstance(_currencyContractAddress);
                const tokenAddressERC20 = await contract.instance.methods.addressToken().call();
                const tokenErc20 = new Erc20Service(tokenAddressERC20);

                return resolve(await tokenErc20.allowance(_options.from, _currencyContractAddress));
            });
        });
    }

    /**
     * Get info from currency contract (generic method)
     * @dev return {} always
     * @param   _requestId    requestId of the request
     * @return  promise of the information from the currency contract of the request
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

                const tokenAddress: string = await currencyContract.instance.methods.addressToken().call();

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

            const hashComputed = this.hashRequest(
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

            const contract = this.web3Single.getContractInstance(_signedRequest.currencyContract);
            const tokenAddressERC20 = await contract.instance.methods.addressToken().call();
            const instanceRequestERC20Last = this.getLastInstanceRequestERC20(tokenAddressERC20);
            if (!instanceRequestERC20Last) {
                return reject(Error('token not supported'));
            }
            if ( ! this.web3Single.areSameAddressesNoChecksum(instanceRequestERC20Last.address, _signedRequest.currencyContract)) {
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
        return Promise.resolve([]);
    }

    /**
     * internal create the object signed request
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
        currencyContract: string,
        payeesIdAddress: string[],
        expectedAmounts: any[],
        payeesPaymentAddress: Array<string|undefined>,
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

        for (const k in payeesPaymentAddress) {
            if (payeesPaymentAddress.hasOwnProperty(k)) {
                payeesPaymentAddress[k] = payeesPaymentAddress[k] === EMPTY_BYTES_20 ? undefined : payeesPaymentAddress[k];
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
     * @param   expirationDate            timestamp is second of the date after what the signed request is not broadcastable
     * @return  promise of the object containing the request's hash
     */
    private hashRequest(
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

    private getLastInstanceRequestERC20(_tokenAddress: string): any {
        return this.web3Single.getContractInstance('last-requesterc20-' + _tokenAddress);
    }
}
