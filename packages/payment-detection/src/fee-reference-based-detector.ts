import { BigNumber } from 'ethers';
import {
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ReferenceBasedDetector } from './reference-based-detector';
import { generate8randomBytes } from '@requestnetwork/utils';

/**
 * Abstract class to extend to get the payment balance of reference based requests
 */
export abstract class FeeReferenceBasedDetector<
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters extends PaymentTypes.IDeclarativePaymentEventParameters<string> & {
    feeAddress?: string;
    feeAmount?: string;
  },
> extends ReferenceBasedDetector<TExtension, TPaymentEventParameters> {
  /**
   * @param paymentNetworkId Example : ExtensionTypes.PAYMENT_NETWORK_ID.ETH_INPUT_DATA
   * @param extension The advanced logic payment network extension, reference based
   */
  protected constructor(
    paymentNetworkId: ExtensionTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    currencyManager: CurrencyTypes.ICurrencyManager,
  ) {
    super(paymentNetworkId, extension, currencyManager);
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
      paymentNetworkCreationParameters.salt || (await generate8randomBytes());

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
    // FIXME: should be at the same level as balance
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
    this.checkRequiredParameter(feeAddress, 'feeAddress');
    const feeBalance = this.computeFeeBalance(balance.events, feeAddress).toString();

    return {
      events: balance.events,
      balance: feeBalance,
    };
  }

  // Sum fee that are directed to the right fee address
  protected computeFeeBalance(
    feeEvents: PaymentTypes.IPaymentNetworkEvent<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >[],
    feeAddress: string,
  ): BigNumber {
    return feeEvents.reduce(
      (sum, curr) =>
        curr.parameters &&
        'feeAmount' in curr.parameters &&
        curr.parameters.feeAmount &&
        (!curr.parameters?.feeAddress || curr.parameters.feeAddress === feeAddress)
          ? sum.add(curr.parameters.feeAmount)
          : sum,
      BigNumber.from(0),
    );
  }
}
