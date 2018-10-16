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
import utils from './utils';

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
     * Recommended usage: new RequestNetwork({ provider, ethNetworkId, useIpfsPublic, bitcoinNetworkId})
     * Supported usage (for backward-compatibility): new RequestNetwork(provider, ethNetworkId, useIpfsPublic)
     * note: bitcoinNetworkId parameter is only available in options because the "supported usage" is only to ensure a backward compatibilty
     *
     * @param {object=} options
     * @param {object=} options.provider - The Web3.js Provider instance you would like the requestNetwork.js library to use for interacting with the Ethereum network. (can be a provider instance or an url as string)
     * @param {number=} options.ethNetworkId - the Ethereum network ID.
     * @param {boolean=} options.useIpfsPublic - use public ipfs node if true, private one specified in “src/config.json ipfs.nodeUrlDefault.private” otherwise (default : true)
     * @param {number=} options.bitcoinNetworkId - the bitcoin network ID
     * @param {object=} options.ipfsCustomNode - define a custom ipfs node like {host, port, protocol}, if given with useIpfsPublic will throw an error
     * @memberof RequestNetwork
     */
    constructor(options?: { provider?: any, ethNetworkId?: number, useIpfsPublic?: boolean, bitcoinNetworkId?: number, ipfsCustomNode?: object } | any, ethNetworkId?: number, useIpfsPublic?: boolean) {
        let bitcoinNetworkId;

        // Parameter handling
        let provider = options;
        if (options && (options.provider || options.ethNetworkId || options.useIpfsPublic || options.bitcoinNetworkId)) {
            provider = options.provider;
            ethNetworkId = options.ethNetworkId;
            useIpfsPublic = options.useIpfsPublic;
            bitcoinNetworkId = options.bitcoinNetworkId;
        }

        // old school way to get ipfs config
        let ipfsNode = useIpfsPublic;

        if (options && options.ipfsCustomNode) {
            if (typeof ipfsNode !== 'undefined') {
                throw new Error('options.ipfsCustomNode is given with useIpfsPublic');
            }
            ipfsNode = options.ipfsCustomNode;
        } else if (typeof ipfsNode === 'undefined') {
            // default configuration is default public node
            ipfsNode = true;
        }

        if (provider && !ethNetworkId) {
            throw new Error('if you give provider you have to give the networkId too');
        }

        // init web3 wrapper singleton
        Web3Single.init(provider, ethNetworkId);

        // init bitcoin service wrapper singleton
        BitcoinService.init(bitcoinNetworkId);

        // init ipfs wrapper singleton
        Ipfs.init(ipfsNode);

        // Initialize the services
        RequestCoreService.destroy();
        this.requestCoreService = RequestCoreService.getInstance();

        RequestBitcoinNodesValidationService.destroy();
        this.requestBitcoinNodesValidationService = RequestBitcoinNodesValidationService.getInstance();

        RequestERC20Service.destroy();
        this.requestERC20Service = RequestERC20Service.getInstance();

        RequestEthereumService.destroy();
        this.requestEthereumService = RequestEthereumService.getInstance();
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
    ): PromiseEventEmitter<{ request: Request, transaction: any }> {
        // new promiEvent to wrap the promiEvent returned by the services. It is necessary, in order to add the Request object in the resolution of the promise
        const promiEvent = Web3PromiEvent();
        let promise;

        // Check payees parameter
        if (payees.length === 0 || !utils.isArrayOfPayeeInfos(payees)) {
            throw new Error(`Invalid payees array`);
        }

        // Check payer parameter
        if (!utils.isPayerInfo(payer)) {
            throw new Error(`Invalid payer`);
        }

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
            } else if (as === Types.Role.Payer) {
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
            } else {
                throw new Error(`Role should be Payer or Payee`);
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
                request: new Request(request.requestId, currency),
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
        return new Request(requestId, currency);
    }

    /**
     * Create a Request instance from a transaction hash.
     * In the case of an unmined transaction for request creation, the request object will be null.
     *
     * @param {string} txHash Transaction hash
     * @returns {Promise<{request, transaction, warnings, errors}>}
     * @memberof RequestNetwork
     */
    public async fromTransactionHash(
        txHash: string,
    ): Promise<{
        request: Request | null,
        transaction: any,
        warnings: any,
        errors: any,
    }> {
        const { request: requestData, transaction, errors, warnings } = await this.requestCoreService.getRequestByTransactionHash(txHash);

        let request = null;
        if (requestData && requestData.requestId) {
            request = new Request(
                requestData.requestId,
                currencyUtils.currencyFromContractAddress(requestData.currencyContract.address),
            );
        }

        return {
            request,
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

        // Check payees parameter
        if (payees.length === 0 || !utils.isArrayOfPayeeInfos(payees)) {
            throw new Error(`Invalid payees array`);
        }

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
     * @param {Types.Amount[]} [additions=[]] Optional array of additional payment amounts for each payee
     * @param {Types.IRequestCreationOptions} [requestOptions={}] Request creation options. Includes request data, extension and ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     * @memberof RequestNetwork
     */
    public broadcastSignedRequest(
        signedRequest: SignedRequest,
        payer: Types.IPayer,
        additions: Types.Amount[] = [],
        broadcastCurrencyOptions: Types.IBroadcastCurrencyOptions = {},
        requestOptions: Types.IRequestCreationOptions = {},
    ): PromiseEventEmitter<{ request: Request, transaction: any }> {
        let promise;
        const currency: Types.Currency = signedRequest.currency;

        // Check signed request correctness
        if (!(signedRequest instanceof SignedRequest)) {
            throw new Error(`signedRequest should be an instance of SignedRequest`);
        }

        // Check payer parameter
        if (!utils.isPayerInfo(payer)) {
            throw new Error(`Invalid payer`);
        }

        // Check amount
        if (!utils.isArrayOfPositiveAmounts(additions)) {
            throw new Error(`additions must be an array of positive number`);
        }

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
                additions,
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
                additions,
                Object.assign({ from: payer.idAddress }, requestOptions.transactionOptions),
            );
        }

        if (!promise) {
            throw new Error('Currency not implemented');
        }

        promise.then(({ request, transaction }: { request: Types.IRequestData, transaction: { hash: string } }) => {
            return promiEvent.resolve({
                request: new Request(request.requestId, currency),
                transaction,
            });
        });

        promise.catch((error: any) => promiEvent.reject(error));

        promise.on('broadcasted', (param: any) => promiEvent.eventEmitter.emit('broadcasted', param));

        return promiEvent.eventEmitter;
    }
}
