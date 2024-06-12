import {
  AdvancedLogicTypes,
  CurrencyTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { deepCopy } from '@requestnetwork/utils';
import { AnyToERC20PaymentDetector, AnyToEthFeeProxyPaymentDetector } from './any';
import {
  IPaymentNetworkModuleByType,
  PaymentNetworkOptions,
  ReferenceBasedDetectorOptions,
} from './types';
import { DeclarativePaymentDetector, DeclarativePaymentDetectorBase } from './declarative';
import { BigNumber } from 'ethers';

const supportedPns: (keyof ExtensionTypes.PnMeta.ICreationParameters)[] = [
  ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE,
  ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
  ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY,
];

const detectorMap: IPaymentNetworkModuleByType = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE]: DeclarativePaymentDetector,
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: AnyToERC20PaymentDetector,
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: AnyToEthFeeProxyPaymentDetector,
};

const advancedLogicMap: Partial<
  Record<
    keyof ExtensionTypes.PnMeta.ICreationParameters,
    keyof AdvancedLogicTypes.IAdvancedLogicExtensions
  >
> = {
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE]: 'declarative',
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY]: 'anyToErc20Proxy',
  [ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY]: 'anyToEthProxy',
};

/**
 * Detect payment for the meta payment network.
 * Recursively detects payments on each sub payment network
 */
export class MetaDetector extends DeclarativePaymentDetectorBase<
  ExtensionTypes.PnMeta.IMeta<any>,
  | PaymentTypes.ConversionPaymentNetworkEventParameters
  | PaymentTypes.IDeclarativePaymentEventParameters
> {
  private readonly advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
  private readonly currencyManager: CurrencyTypes.ICurrencyManager;
  private readonly options: Partial<PaymentNetworkOptions>;
  /**
   * @param paymentNetworkId
   * @param extension
   */
  public constructor({
    advancedLogic,
    currencyManager,
    options,
  }: ReferenceBasedDetectorOptions & { options?: Partial<PaymentNetworkOptions> }) {
    super(ExtensionTypes.PAYMENT_NETWORK_ID.META, advancedLogic.extensions.metaPn);
    this.options = options || {};
    this.currencyManager = currencyManager;
    this.advancedLogic = advancedLogic;
  }

  /**
   * Creates the extensions data for the creation of this extension.
   *
   * @param paymentNetworkCreationParameters Parameters to create the extension
   * @returns The extensionData object
   */
  public async createExtensionsDataForCreation(
    paymentNetworkCreationParameters: ExtensionTypes.PnMeta.ICreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // Do the same for each sub-extension
    for (const [key, value] of Object.entries(paymentNetworkCreationParameters)) {
      if (supportedPns.includes(key as keyof ExtensionTypes.PnMeta.ICreationParameters)) {
        const detectorClass = detectorMap[key as keyof typeof detectorMap];
        const extensionKey = advancedLogicMap[key as keyof typeof advancedLogicMap];
        const extension =
          this.advancedLogic.extensions[extensionKey as keyof typeof this.advancedLogic.extensions];

        if (!detectorClass || !extension) {
          throw new Error(`The payment network id: ${key} is not supported for meta-pn detection`);
        }

        const detector = new detectorClass({
          advancedLogic: this.advancedLogic,
          paymentNetworkId: key as ExtensionTypes.PAYMENT_NETWORK_ID,
          extension,
          currencyManager: this.currencyManager,
          ...this.options,
        });

        for (let index = 0; index < value.length; index++) {
          paymentNetworkCreationParameters[key as keyof ExtensionTypes.PnMeta.ICreationParameters][
            index
          ] = (await detector.createExtensionsDataForCreation(value[index])).parameters;
        }
      }
    }
    return this.extension.createCreationAction({
      ...paymentNetworkCreationParameters,
    });
  }

  /**
   * Creates the extensions data to apply an action on a sub pn
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForApplyActionOnPn(
    parameters: ExtensionTypes.PnMeta.IApplyActionToPn,
  ): ExtensionTypes.IAction {
    return this.extension.createApplyActionToPn({
      pnIdentifier: parameters.pnIdentifier,
      action: parameters.action,
      parameters: parameters.parameters,
    });
  }

  /**
   * To retrieve all events, iterate over the sub payment networks and aggregate their balances
   */
  protected async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.AllNetworkEvents<
      | PaymentTypes.ConversionPaymentNetworkEventParameters
      | PaymentTypes.IDeclarativePaymentEventParameters
    >
  > {
    const paymentExtension = this.getPaymentExtension(request);
    const events: PaymentTypes.IBalanceWithEvents<PaymentTypes.GenericEventParameters>[] = [];
    const feeBalances: PaymentTypes.IBalanceWithEvents<PaymentTypes.GenericEventParameters>[] = [];

    for (const value of Object.values(
      paymentExtension.values as Record<string, ExtensionTypes.IState<any>>,
    )) {
      if (supportedPns.includes(value.id as keyof ExtensionTypes.PnMeta.ICreationParameters)) {
        const detectorClass = detectorMap[value.id as keyof typeof detectorMap];
        const extensionKey = advancedLogicMap[value.id as keyof typeof advancedLogicMap];
        const extension =
          this.advancedLogic.extensions[extensionKey as keyof typeof this.advancedLogic.extensions];

        if (!detectorClass || !extension) {
          throw new Error(
            `The payment network id: ${value.id} is not supported for meta-pn detection`,
          );
        }

        const detector = new detectorClass({
          advancedLogic: this.advancedLogic,
          paymentNetworkId: value.id as ExtensionTypes.PAYMENT_NETWORK_ID,
          extension,
          currencyManager: this.currencyManager,
          ...this.options,
        });

        const partialRequest = deepCopy(request);
        partialRequest.extensions = {
          [value.id]: value,
        };
        partialRequest.extensionsData = [value];

        events.push(await detector.getBalance(partialRequest));
        const feeBalance = partialRequest.extensions[value.id].values.feeBalance;
        if (feeBalance) {
          feeBalances.push(feeBalance);
        }
      }
    }
    const declaredEvents = this.getDeclarativeEvents(request);
    const allPaymentEvents = [...declaredEvents, ...events.map((event) => event.events).flat()];

    // FIXME: should be at the same level as balance
    const values: any = this.getPaymentExtension(request).values;
    values.feeBalance = {
      events: feeBalances.map((event) => event.events).flat(),
      balance: feeBalances
        .reduce((sum, curr) => sum.add(curr.balance || '0'), BigNumber.from(0))
        .toString(),
    };

    return {
      paymentEvents: allPaymentEvents,
    };
  }
}
