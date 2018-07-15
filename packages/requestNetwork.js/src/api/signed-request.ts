import * as Types from '../types';
import currencyUtils from '../utils/currency';

/**
 * Class representing a ECDSA-signed Request.
 * A signed request is an optimization where, for example, a merchand website creates a request, sign it and send it to his buyer.
 * The buyer can broacast and pay the Request. This saves time and transaction fees because only 1 transaction is sent on the blockchain.
 * More details: https://github.com/RequestNetwork/Request/wiki#ecdsa-request-how-to-sign-a-request-and-let-the-user-broadcast-it-for-online-payments-points-of-sale
 *
 * Signed request should be created with `requestNetwork.createSignedRequest()`.
 *
 * A signed request can be serialized and deserialized with `serializeForUri` and `new SignedRequest` to send it from a web server to a client.
 *
 * @class SignedRequest
 */
export default class SignedRequest {
    /**
     * Data of the Signed Request
     *
     * @type {Types.ISignedRequestData}
     */
    public readonly signedRequestData: Types.ISignedRequestData;

    /**
     * Currency of the Request
     *
     * @readonly
     * @type {Types.Currency}
     */
    public readonly currency: Types.Currency;

    /**
     * Creates an instance of SignedRequest from a Signed Request data or serialized Signed Request
     *
     * @param {(Types.ISignedRequestData|string)} signedRequest Data of the Signed Request, or serialized (string format) Signed Request
     */
    constructor(signedRequest: Types.ISignedRequestData|string) {
        this.signedRequestData = typeof signedRequest === 'string' ?
            this.deserializeForUri(signedRequest) :
            signedRequest;

        this.currency = currencyUtils.currencyFromContractAddress(
            this.signedRequestData.currencyContract,
        );
    }

    /**
     * Is the Signed Request valid?
     *
     * @param {Types.IPayer} payer Payer of the request (idAddress necessary)
     * @returns {boolean}
     */
    public isValid(payer: Types.IPayer): boolean {
        return this.getInvalidErrorMessage(payer) === '';
    }

    /**
     * Return the error message if the Signed Request is invalid
     *
     * @param {Types.IPayer} payer  Payer of the request (idAddress necessary)
     * @returns {string}
     */
    public getInvalidErrorMessage(payer: Types.IPayer): string {
        if (payer.refundAddress && payer.idAddress !== payer.refundAddress) {
            throw new Error('Different idAddress and paymentAddress for Payer of signed request not yet supported');
        }

        const currency: Types.Currency = currencyUtils.currencyFromContractAddress(
            this.signedRequestData.currencyContract,
        );

        return currencyUtils.serviceForCurrency(currency).validateSignedRequest(this.signedRequestData, payer.idAddress);
    }

    /**
     * Serialize the Signed Request into a string format that can be send over an URI
     *
     * @returns {string}
     */
    public serializeForUri(): string {
        return JSON.stringify(this.signedRequestData);
    }

    /**
     * Deserialize the Signed Request into a Signed Request data format
     *
     * @private
     * @param {string} serializedRequest The serialized Signed Request
     * @returns {Types.ISignedRequestData}
     */
    private deserializeForUri(serializedRequest: string): Types.ISignedRequestData {
        return JSON.parse(serializedRequest);
    }
}
