import Web3PromiEvent = require('web3-core-promievent');
import RequestBitcoinNodesValidationService from '../servicesContracts/requestBitcoinNodesValidation-service';
import RequestERC20Service from '../servicesContracts/requestERC20-service';
import RequestEthereumService from '../servicesContracts/requestEthereum-service';
import RequestCoreService from '../servicesCore/requestCore-service';
import BitcoinService from '../servicesExternal/bitcoin-service';
import Ipfs from '../servicesExternal/ipfs-service';
import Web3Single from '../servicesExternal/web3-single';
import * as Types from '../types';
import currencyUtils from '../utils/currency';
import Request from './request';
import SignedRequest from './signed-request';

/**
 * Class serving as entry-point into the requestNetwork.js library.
 * Create an instance to initialize the library and use it to create requests.
 *
 * @class RequestNetwork
 */
export default class RequestNetwork {
    /**
     * RequestCoreService instance to interact directly with the core of the library
     * Not the recommended way to interract with the library.
     *
     * @type {RequestCoreService}
     * @memberof RequestNetwork
     */
    public requestCoreService: RequestCoreService;

    /**
     * RequestBitcoinNodesValidationService instance to interact directly with the bitcoin currency contract
     * Not the recommended way to interract with the library.
     *
     * @type {RequestBitcoinNodesValidationService}
     * @memberof RequestNetwork
     */
    public requestBitcoinNodesValidationService: RequestBitcoinNodesValidationService;

    /**
     * RequestERC20Service instance to interact directly with the ERC20 currency contract
     * Not the recommended way to interract with the library.
     *
     * @type {RequestERC20Service}
     * @memberof RequestNetwork
     */
    public requestERC20Service: RequestERC20Service;

    /**
     * RequestEthereumService instance to interact directly with the ethereum currency contract
     * Not the recommended way to interract with the library.
     *
     * @type {RequestEthereumService}
     * @memberof RequestNetwork
     */
    public requestEthereumService: RequestEthereumService;

    /**
     * Creates an instance of RequestNetwork.
     * Recommended usage: new RequestNetwork({ provider, ethNetworkId, useIpfsPublic, bitoinNetworkId})
     * Supported usage (for backward-compatibility): new RequestNetwork(provider, ethNetworkId, useIpfsPublic)
     * note: bitoinNetworkId parameter is only available in options because the "supported usage" is only to ensure a backward compatibilty
     *
     * @param {object=} options
     * @param {object=} options.provider - The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with the Ethereum network. (can be a provider instance or an url as string)
     * @param {number=} options.ethNetworkId - the Ethereum network ID.
     * @param {boolean=} options.useIpfsPublic - use public ipfs node if true, private one specified in “src/config.json ipfs.nodeUrlDefault.private” otherwise (default : true)
     * @param {number=} options.bitoinNetworkId - the bitcoin network ID
     * @memberof RequestNetwork
     */
    constructor(options?: { provider?: any, ethNetworkId?: number, useIpfsPublic?: boolean, bitoinNetworkId?: number} | any, ethNetworkId?: number, useIpfsPublic?: boolean) {
        let bitoinNetworkId;
        // Parameter handling
        let provider = options;
        if (options && (options.provider || options.ethNetworkId || options.useIpfsPublic || options.bitoinNetworkId)) {
            provider = options.provider;
            ethNetworkId = options.ethNetworkId;
            useIpfsPublic = options.useIpfsPublic;
            bitoinNetworkId = options.bitoinNetworkId;
        }
        if (typeof useIpfsPublic === 'undefined') {
            useIpfsPublic = true;
        }
        if (provider && ! ethNetworkId) {
            throw new Error('if you give provider you have to give the networkId too');
        }

        // init web3 wrapper singleton
        Web3Single.init(provider, ethNetworkId);

        // init bitcoin service wrapper singleton
        BitcoinService.init(bitoinNetworkId);

        // init ipfs wrapper singleton
        Ipfs.init(useIpfsPublic);

        // Initialize the services
        // Let currencyUtils instanciate the currency services
        this.requestCoreService = RequestCoreService.getInstance();
        this.requestBitcoinNodesValidationService = currencyUtils.serviceForCurrency(Types.Currency.BTC);
        this.requestERC20Service = currencyUtils.serviceForCurrency(Types.Currency.REQ);
        this.requestEthereumService = currencyUtils.serviceForCurrency(Types.Currency.ETH);
    }

    /**
     * Async factory function to create a Request
     *
     * @param {Types.Role} as Who is creating the Request (Payer or Payee)
     * @param {Types.Currency} currency Currency of the Request (ETH, BTC, REQ, etc.)
     * @param {Types.IPayee[]} payees Array of payees
     * @param {Types.IPayer} payer The payer
     * @param {Types.IRequestCreationOptions} [requestOptions={}] Request creation options. Includes request data, extension and ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     * @memberof RequestNetwork
     */
    public createRequest(
        as: Types.Role,
        currency: Types.Currency,
        payees: Types.IPayee[],
        payer: Types.IPayer,
        requestOptions: Types.IRequestCreationOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        // new promiEvent to wrap the promiEvent returned by the services. It is necessary, in order to add the Request object in the resolution of the promise
        const promiEvent = Web3PromiEvent();
        let promise;

        // Create an ERC20 Request
        if (currencyUtils.isErc20(currency)) {
            const addressTestToken = currencyUtils.erc20TokenAddress(currency, Web3Single.getInstance().networkName);
            const requestERC20: RequestERC20Service = currencyUtils.serviceForCurrency(currency);

            if (as === Types.Role.Payee) {
                // ERC20 Request as Payee
                promise = requestERC20.createRequestAsPayee(
                    addressTestToken,
                    payees.map(payee => payee.idAddress),
                    payees.map(payee => payee.expectedAmount),
                    payer.idAddress,
                    payees.map(payee => payee.paymentAddress),
                    payer.refundAddress,
                    requestOptions.data && JSON.stringify(requestOptions.data),
                    undefined, // _extension,
                    undefined, // _extensionParams,
                    requestOptions.transactionOptions,
                );
            }

            if (as === Types.Role.Payer) {
                // ERC20 Request as Payer
                promise = requestERC20.createRequestAsPayer(
                    addressTestToken,
                    payees.map(payee => payee.idAddress),
                    payees.map(payee => payee.expectedAmount),
                    payer.refundAddress,
                    payees.map(payee => payee.amountToPayAtCreation),
                    payees.map(payee => payee.additional),
                    requestOptions.data && JSON.stringify(requestOptions.data),
                    undefined, // _extension
                    undefined, // _extensionParams
                    Object.assign({}, requestOptions.transactionOptions, { from: payer.idAddress }),
                );
            }
        }

        // Create an ETH Request
        if (currency === Types.Currency.ETH) {
            const requestEthereumService: RequestEthereumService = currencyUtils.serviceForCurrency(currency);
            if (as === Types.Role.Payee) {
                // Create an ETH Request as Payee
                promise = requestEthereumService.createRequestAsPayee(
                    payees.map(payee => payee.idAddress),
                    payees.map(payee => payee.expectedAmount),
                    payer.idAddress,
                    payees.map(payee => payee.paymentAddress),
                    payer.refundAddress,
                    requestOptions.data && JSON.stringify(requestOptions.data),
                    undefined, // _extension,
                    undefined, // _extensionParams,
                    requestOptions.transactionOptions,
                );
            }

            if (as === Types.Role.Payer) {
                // Create an ETH Request as Payer
                promise = requestEthereumService.createRequestAsPayer(
                    payees.map(payee => payee.idAddress),
                    payees.map(payee => payee.expectedAmount),
                    payer.refundAddress,
                    payees.map(payee => payee.amountToPayAtCreation),
                    payees.map(payee => payee.additional),
                    requestOptions.data && JSON.stringify(requestOptions.data),
                    undefined, // _extension
                    undefined, // _extensionParams
                    Object.assign({}, requestOptions.transactionOptions, { from: payer.idAddress }),
                );
            }
        }

        // Create a BTCRequest
        if (currency === Types.Currency.BTC) {
            const requestBitcoinNodesValidationService: RequestBitcoinNodesValidationService = currencyUtils.serviceForCurrency(currency);
            if (as === Types.Role.Payee) {
                if (payer.refundAddress) {
                    throw new Error('payer.refundAddress cannot be provided for currency BTC. Use payer.bitcoinRefundAddresses instead.');
                }
                // Create a BTCRequest as Payee
                promise = requestBitcoinNodesValidationService.createRequestAsPayee(
                    payees.map(payee => payee.idAddress),
                    payees.map(payee => payee.expectedAmount),
                    payer.idAddress,
                    payees.map(payee => payee.paymentAddress),
                    payer.bitcoinRefundAddresses || [],
                    requestOptions.data && JSON.stringify(requestOptions.data),
                    undefined, // _extension,
                    undefined, // _extensionParams,
                    requestOptions.transactionOptions,
                );
            }

            if (as === Types.Role.Payer) {
                // Create a BTCRequest as Payer
                throw new Error(`'createRequestAsPayer' not implemented for BTC`);
            }
        }

        if (!promise) {
            throw new Error('Currency not implemented');
        }

        // Add the Request in the resolution of the promise
        promise.then(({ request, transaction }: { request: Types.IRequestData, transaction: { hash: string } }) => {
            return promiEvent.resolve({
                // pass requestCoreService as a hack until the services are singletons
                request: new Request(request.requestId, currency, this.requestCoreService),
                transaction,
            });
        });

        promise.catch((error: any) => promiEvent.reject(error));

        promise.on('broadcasted', (param: any) => promiEvent.eventEmitter.emit('broadcasted', param));

        return promiEvent.eventEmitter;
    }

    /**
     * Create a Request instance from an existing Request's ID
     *
     * @param {string} requestId The ID of the Request
     * @returns {Request} The Request
     * @memberof RequestNetwork
     */
    public async fromRequestId(requestId: string): Promise<Request> {
        const requestData = await this.requestCoreService.getRequest(requestId);
        const currency: Types.Currency = currencyUtils.currencyFromContractAddress(requestData.currencyContract.address);
        return new Request(requestId, currency, this.requestCoreService);
    }

    /**
     * Create a Request instance from a transaction hash.
     * In the case of an unmined transaction for request creation, an object with { requestData, currency } is available.
     *
     * @param {string} txHash Transaction hash
     * @returns {Request} The Request
     * @memberof RequestNetwork
     */
    public async fromTransactionHash(
        txHash: string,
    ): Promise<{
        request: Request|null,
        unminedRequestData: { requestData: any, currency: Types.Currency } | null,
        transaction: any,
        warnings: any,
        errors: any,
    }> {
        const { request: requestData, transaction, errors, warnings } = await this.requestCoreService.getRequestByTransactionHash(txHash);
        const currency: Types.Currency = currencyUtils.currencyFromContractAddress(requestData.currencyContract.address);

        let request = null;
        let unminedRequestData = null;

        if (requestData.requestId) {
            request = new Request(requestData.requestId, currency, this.requestCoreService);
        } else {
            unminedRequestData = {requestData, currency};
        }

        return {
            request,
            unminedRequestData,
            transaction,
            warnings,
            errors,
        };
    }

    /**
     * Create a signed Request. Refer to the SignedRequest class for the details.
     *
     * @param {Types.Role} as Who is creating the Request (only Payee is implemented for now)
     * @param {Types.Currency} currency Currency of the Request (ETH, BTC, REQ, etc.)
     * @param {Types.IPayee[]} payees Array of payees
     * @param {number} expirationDate Timestamp in second of the date after which the signed request is not broadcastable
     * @param {Types.IRequestCreationOptions} [requestOptions={}] Request creation options. Includes request data, extension and ethereum transaction options
     * @returns {Promise<SignedRequest>} Promise resolving to an instance of SignedRequest
     * @memberof RequestNetwork
     */
    public async createSignedRequest(
        as: Types.Role,
        currency: Types.Currency,
        payees: Types.IPayee[],
        expirationDate: number,
        requestOptions: Types.IRequestCreationOptions = {},
    ): Promise<SignedRequest> {
        if (as !== Types.Role.Payee) {
            throw new Error('Role not implemented');
        }

        let signedRequestData = null;

        if (currencyUtils.isErc20(currency)) {
            const addressTestToken = currencyUtils.erc20TokenAddress(currency, Web3Single.getInstance().networkName);
            const requestERC20: RequestERC20Service = currencyUtils.serviceForCurrency(currency);
            // Create an ERC20 Signed Request as Payee
            signedRequestData = await requestERC20.signRequestAsPayee(
                addressTestToken,
                payees.map(payee => payee.idAddress),
                payees.map(payee => payee.expectedAmount),
                expirationDate,
                payees.map(payee => payee.paymentAddress),
                requestOptions.data && JSON.stringify(requestOptions.data),
                undefined, // _extension,
                undefined, // _extensionParams,
                requestOptions.transactionOptions && requestOptions.transactionOptions.from,
            );
        }
        if (currency === Types.Currency.ETH) {
            const requestEthereumService = currencyUtils.serviceForCurrency(currency);

            // Create an ETH Signed Request as Payee
            signedRequestData = await requestEthereumService.signRequestAsPayee(
                payees.map(payee => payee.idAddress),
                payees.map(payee => payee.expectedAmount),
                expirationDate,
                payees.map(payee => payee.paymentAddress),
                requestOptions.data && JSON.stringify(requestOptions.data),
                undefined, // _extension,
                undefined, // _extensionParams,
                requestOptions.transactionOptions && requestOptions.transactionOptions.from,
            );
        }
        if (currency === Types.Currency.BTC) {
            const requestBitcoinNodesValidationService = currencyUtils.serviceForCurrency(currency);

            // Create an BTC Signed Request as Payee
            signedRequestData = await requestBitcoinNodesValidationService.signRequestAsPayee(
                payees.map(payee => payee.idAddress),
                payees.map(payee => payee.expectedAmount),
                expirationDate,
                payees.map(payee => payee.paymentAddress),
                requestOptions.data && JSON.stringify(requestOptions.data),
                undefined, // _extension,
                undefined, // _extensionParams,
                requestOptions.transactionOptions && requestOptions.transactionOptions.from,
            );
        }

        return new SignedRequest(signedRequestData);
    }

    /**
     * Broadcast a Signed Request
     *
     * @param {SignedRequest} signedRequest The previously created Signed Request
     * @param {Types.IPayer} payer The Payer broadcasting the Signed Request
     * @param {Types.Amount[]} [amountsToPayAtCreation=[]] Amounts to pays when creating the broadcasting the Request
     * @param {Types.Amount[]} [additionals=[]] Optionnal additionals to add
     * @param {Types.IRequestCreationOptions} [requestOptions={}] Request creation options. Includes request data, extension and ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     * @memberof RequestNetwork
     */
    public broadcastSignedRequest(
        signedRequest: SignedRequest,
        payer: Types.IPayer,
        additionals: Types.Amount[] = [],
        broadcastCurrencyOptions: Types.IBroadcastCurrencyOptions = {},
        requestOptions: Types.IRequestCreationOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        let promise;
        const currency: Types.Currency = signedRequest.currency;

        // new promiEvent to wrap the promiEvent returned by the service. It is necessary, in order to add the Request object in the resolution of the promise
        const promiEvent = Web3PromiEvent();

        // Broadcast an Ethereum or ERC20 Request
        if (currencyUtils.isErc20(currency) || currency === Types.Currency.ETH) {
            if (payer.refundAddress && payer.idAddress !== payer.refundAddress) {
                throw new Error('Different idAddress and paymentAddress for Payer of signed request not yet supported');
            }
            const service = currencyUtils.serviceForCurrency(currency);
            promise = service.broadcastSignedRequestAsPayer(
                signedRequest.signedRequestData,
                broadcastCurrencyOptions.amountsToPayAtCreation,
                additionals,
                Object.assign({ from: payer.idAddress }, requestOptions.transactionOptions),
            );
        }

        // Broadcast a BTCRequest
        if (currency === Types.Currency.BTC) {
            const requestBitcoinNodesValidationService: RequestBitcoinNodesValidationService = currencyUtils.serviceForCurrency(currency);

            if (payer.refundAddress) {
                throw new Error('payer.refundAddress cannot be provided for currency BTC. Use payer.bitcoinRefundAddresses instead.');
            }

            if (!payer.bitcoinRefundAddresses) {
                throw new Error('payer.bitcoinRefundAddresses must be given for currency BTC');
            }

            if (broadcastCurrencyOptions.amountsToPayAtCreation) {
                throw new Error('amountsToPayAtCreation cannot be provided broadcastCurrencyOptions for currency BTC');
            }

            // Create a BTCRequest as Payee
            promise = requestBitcoinNodesValidationService.broadcastSignedRequestAsPayer(
                signedRequest.signedRequestData,
                payer.bitcoinRefundAddresses,
                additionals,
                Object.assign({ from: payer.idAddress }, requestOptions.transactionOptions),
            );
        }

        if (!promise) {
            throw new Error('Currency not implemented');
        }

        promise.then(({ request, transaction }: { request: Types.IRequestData, transaction: { hash: string } }) => {
            return promiEvent.resolve({
                request: new Request(request.requestId, currency, this.requestCoreService),
                transaction,
            });
        });

        promise.catch((error: any) => promiEvent.reject(error));

        promise.on('broadcasted', (param: any) => promiEvent.eventEmitter.emit('broadcasted', param));

        return promiEvent.eventEmitter;
    }
}
