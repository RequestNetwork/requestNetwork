import { BigNumber } from 'ethers';
import { ExtensionTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { ReferenceBasedDetector } from './reference-based-detector';

/**
 * Abstract class to extend to get the payment balance of reference based requests
 */
export abstract class FeeReferenceBasedDetector<
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters extends { feeAmount?: string; feeAddress?: string }
> extends ReferenceBasedDetector<TExtension, TPaymentEventParameters> {
  /**
   * @param paymentNetworkId Example : PaymentTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA
   * @param extension The advanced logic payment network extension, reference based
   */

  public constructor(paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID, extension: TExtension) {
    super(paymentNetworkId, extension);
  }

  /**
   * Creates the extensions data for the creation of this extension.
   * Will set a salt if none is already given
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnFeeReferenceBased.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    paymentNetworkCreationParameters.salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      ...paymentNetworkCreationParameters,
    });
  }

  /**
   * Creates the extensions data to add fee address and amount
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddFeeInformation(
    parameters: ExtensionTypes.PnFeeReferenceBased.IAddFeeParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddFeeAction({
      feeAddress: parameters.feeAddress,
      feeAmount: parameters.feeAmount,
    });
  }

  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.IBalanceWithEvents<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >
  > {
    const balance = await super.getBalance(request);
    if (balance.error) {
      return balance;
    }
    // for retro compatibility, the feeBalance is stored in the payment extension
    const values: any = this.getPaymentExtension(request).values;
    values.feeBalance = await this.getFeeBalance(request, balance);

    return balance;
  }

  public async getFeeBalance(
    request: RequestLogicTypes.IRequest,
    balance: PaymentTypes.IBalanceWithEvents<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >,
  ): Promise<
    PaymentTypes.IBalanceWithEvents<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >
  > {
    const { feeAddress } = this.getPaymentExtension(request).values;
    if (!this.checkRequiredParameter(feeAddress, 'feeAddress')) {
      throw new Error('unreachable');
    }
    const feeEvents = this.extractFeeEvents(feeAddress, balance.events);
    const feeBalance = this.computeFeeBalance(feeEvents).toString();

    return {
      events: feeEvents,
      balance: feeBalance,
    };
  }

  protected computeFeeBalance(
    feeEvents: PaymentTypes.IPaymentNetworkEvent<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >[],
  ): BigNumber {
    return feeEvents.reduce(
      (sum, curr) =>
        curr.parameters && 'feeAmount' in curr.parameters && curr.parameters.feeAmount
          ? sum.add(curr.parameters.feeAmount)
          : sum,
      BigNumber.from(0),
    );
  }

  /**
   * Extract the fee balance from a list of payment events
   *
   * @param feeAddress The fee address the extracted fees will be paid to
   * @param paymentEvents The payment events to extract fees from
   */
  protected extractFeeEvents(
    feeAddress: string,
    paymentEvents: PaymentTypes.IPaymentNetworkEvent<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >[],
  ): PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[] {
    if (!feeAddress) {
      return [];
    }

    return paymentEvents
      .filter((event): event is PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters> =>
        Boolean(
          event.parameters && 'feeAmount' in event.parameters && 'feeAddress' in event.parameters,
        ),
      )
      .filter(
        (event) =>
          // Skip if feeAddress or feeAmount are not set, or if feeAddress doesn't match the PN one
          event.parameters?.feeAmount && event.parameters.feeAddress === feeAddress,
      );
  }
}
