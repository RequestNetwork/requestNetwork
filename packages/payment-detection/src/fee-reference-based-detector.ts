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
    const feeBalance = this.computeFeeBalance(balance.events).toString();

    return {
      events: balance.events,
      balance: feeBalance,
    };
  }

  protected filterEvents(
    request: RequestLogicTypes.IRequest,
    events: PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[],
  ): PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[] {
    // for a PN with fees, we ignore events with wrong fees.
    const { feeAddress } = this.getPaymentExtension(request).values;
    return events.filter(
      (x) => !x.parameters?.feeAddress || x.parameters.feeAddress === feeAddress,
    );
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
}
