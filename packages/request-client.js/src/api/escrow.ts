import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import { Erc20PaymentNetwork } from '@requestnetwork/payment-detection';
import { AdvancedLogic } from '@requestnetwork/advanced-logic';

/**
 * Class representing an escrow.
 * Instanced of this class can e
 */

export default class Escrow {
  /**
   * The Request this Escrow is connected with
   */
  private request: RequestLogicTypes.IRequest;
  /**
   * Data of the escrow
   */
  private escrowData: PaymentTypes.EscrowData | null = null;

  private customProxyDetector: Erc20PaymentNetwork.CustomProxyDetector;

  /**
   * Creates an instance of Request
   *
   * @param requestLogic Instance of the request-logic layer
   * @param requestId ID of the Request
   * @param paymentNetwork Instance of a payment network to manage the request
   * @param contentDataManager Instance of content data manager
   * @param requestLogicCreateResult return from the first request creation (optimization)
   * @param options options
   */
  constructor(request: RequestLogicTypes.IRequest, currencyManager: ICurrencyManager) {
    const advancedLogic = new AdvancedLogic(currencyManager);
    this.request = request;
    this.customProxyDetector = new Erc20PaymentNetwork.CustomProxyDetector({
      advancedLogic,
      currencyManager,
    });
  }

  /**
   * Gets the escrow data and returns it
   *
   * @returns escrow data
   */
  public async getEscrowData(): Promise<PaymentTypes.EscrowData | null> {
    this.escrowData = await this.customProxyDetector.getEscrow(this.request);
    return this.escrowData;
  }
}
