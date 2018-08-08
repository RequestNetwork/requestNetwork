import Web3PromiEvent = require('web3-core-promievent');
import RequestCoreService from '../servicesCore/requestCore-service';
import * as Types from '../types';
import currencyUtils from '../utils/currency';

/**
 * Util function to wrap a function call into a PromiseEventEmitter for an action on a Request.
 * Creates a new promiEvent to wrap the promiEvent returned by the services.
 * It is necessary, in order to add the Request object in the resolution of the promise.
 */
function promiEventLibraryWrap(
    request: Request,
    callback: () => PromiseEventEmitter<{ transaction: any }>,
    events: string[] = ['broadcasted'],
): PromiseEventEmitter<{request: Request, transaction: any}> {
    const outPromiseEvent = Web3PromiEvent();
    const inPromiseEvent = callback();

    // Adds the request to the resolution of the input promiEvent
    inPromiseEvent.then(({ transaction }: { transaction: any }) =>
        outPromiseEvent.resolve({ request, transaction }),
    );

    inPromiseEvent.catch((error: any) => outPromiseEvent.reject(error));

    events.forEach(eventName =>
        inPromiseEvent.on(eventName, (param: any) => outPromiseEvent.eventEmitter.emit(eventName, param)),
    );

    return outPromiseEvent.eventEmitter;
}

/**
 * Class representing a Request.
 * Instances of this class can be accepted, paid, refunded, etc.
 * Use the member function `getData` to access the properties of the Request.
 *
 * Requests should be created with `RequestNetwork.createRequest()`.
 *
 * @class Request
 */
export default class Request {
    /**
     * Unique ID of the request
     *
     * @readonly
     * @type {string}
     */
    public readonly requestId: string;

    /**
     * Currency of the Request
     *
     * @readonly
     * @type {Types.Currency}
     */
    public readonly currency: Types.Currency;

    /**
     * Service to use for this request, depends on the currency
     *
     * @private
     * @readonly
     * @type {*}
     */
    private readonly requestService: any;

    private requestCoreService: RequestCoreService;

    /**
     * Creates an instance of Request.
     *
     * @param {string} requestId ID of the Request
     * @param {Types.Currency} currency Currency of the Request
     */
    constructor(requestId: string, currency: Types.Currency) {
        this.requestId = requestId;
        this.currency = currency;
        this.requestCoreService = RequestCoreService.getInstance();

        this.requestService = currencyUtils.serviceForCurrency(currency);
    }

    /**
     * Pay a Request
     *
     * @param {Types.Amount[]} [amountsToPay=[]] Amounts to pay. Ordered array, with an item for each payee
     * @param {Types.Amount[]} [additions=[]] Additiona payment amounts. Ordered array, with an item for each payee
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public pay(
        amountsToPay: Types.Amount[] = [],
        additions: Types.Amount[] = [],
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        return promiEventLibraryWrap(this, () =>
            this.requestService.paymentAction(
                this.requestId,
                amountsToPay,
                additions,
                transactionOptions,
            ),
        );
    }

    /**
     * Accept a Request
     *
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public accept(
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        return promiEventLibraryWrap(this, () =>
            this.requestService.accept(
                this.requestId,
                transactionOptions,
            ),
        );
    }

    /**
     * Cancel a Request
     *
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public cancel(
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        return promiEventLibraryWrap(this, () =>
            this.requestService.cancel(
                this.requestId,
                transactionOptions,
            ),
        );
    }

    /**
     * Refund a Request
     *
     * @param {Types.Amount[]} [amountToRefund=[]] Amounts to refund. Ordered array, with an item for each payee
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public refund(
        amountToRefund: Types.Amount,
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        return promiEventLibraryWrap(this, () =>
            this.requestService.refundAction(
                this.requestId,
                amountToRefund,
                transactionOptions,
            ),
        );
    }

    /**
     * Add a subtraction (for example, a discount)
     *
     * @deprecated
     * @param {Types.Amount[]} [amounts=[]] Amounts to subtract. Ordered array, with an item for each payee
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public addSubtractions(
        amounts: Types.Amount[],
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        console.warn('Deprecated. See reduceExpectedAmounts');
        return this.reduceExpectedAmounts(amounts, transactionOptions)
    }

    /**
     * Reduce the amount due to each payee. This can be called by the payee e.g. to apply discounts or
     * special offers.
     *
     * @param {Types.Amount[]} [amounts=[]] Reduction amounts for each payee. Ordered array, with an item for each payee
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public reduceExpectedAmounts(
        amounts: Types.Amount[],
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        return promiEventLibraryWrap(this, () =>
            this.requestService.reduceExpectedAmounts(
                this.requestId,
                amounts,
                transactionOptions,
            ),
        );
    }

    /**
     * Add an additional (for example, a tip)
     *
     * @deprecated('Renamed to increaseExpectedAmounts')
     * @param {Types.Amount[]} [amounts=[]] Amounts to add. Ordered array, with an item for each payee
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public addAdditionals(
        amounts: Types.Amount[],
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        console.warn('Deprecated. See increaseExpectedAmounts');
        return this.increaseExpectedAmounts(amounts, transactionOptions)
    }

    /**
     * Increase the amount due to each payee. This can be called by the payer e.g. to add extra
     * payments to the Request for tips or bonuses.
     *
     * @param {Types.Amount[]} [amounts=[]] Amounts to add. Ordered array, with an item for each payee
     * @param {Types.ITransactionOptions} [transactionOptions={}] Ethereum transaction options
     * @returns {PromiseEventEmitter<{request: Request, transaction: any}>} A promiEvent resolving to {request,transaction} and emitting the event 'broadcasted'
     */
    public increaseExpectedAmounts(
        amounts: Types.Amount[],
        transactionOptions: Types.ITransactionOptions = {},
    ): PromiseEventEmitter<{request: Request, transaction: any}> {
        return promiEventLibraryWrap(this, () =>
            this.requestService.additionalAction(
                this.requestId,
                amounts,
                transactionOptions,
            ),
        );
    }

    /**
     * Get the data of a Request
     * Use this method to get fresh data from the blockchain
     *
     * @returns {Promise<Types.IRequestData>} Promise resolving to the data of the request
     */
    public async getData(): Promise<Types.IRequestData> {
        return this.requestCoreService.getRequest(this.requestId);
    }

    /**
     * Get the events of the Request
     *
     * @param {number} [fromBlock] search events from this block number
     * @param {number} [toBlock] search events until this block number
     * @returns {Promise<Types.IEvent[]>} Promise resolving to an array of events
     */
    public getHistory(fromBlock?: number, toBlock?: number): Promise<Types.IEvent[]> {
        return this.requestCoreService.getRequestEvents(this.requestId, fromBlock, toBlock);
    }
}
