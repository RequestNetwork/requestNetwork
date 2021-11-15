import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { CurrencyDefinition, ICurrencyManager } from '@requestnetwork/currency';
import {
  BalanceError,
  getBalanceErrorObject,
  NetworkNotSupported,
  VersionNotSupported,
} from '../balance-error';
import PaymentReferenceCalculator from '../payment-reference-calculator';
import ProxyInfoRetriever from './proxy-info-retriever';

import { BigNumber } from 'ethers';
import { networkSupportsTheGraph } from '../thegraph';
import TheGraphInfoRetriever from './thegraph-info-retriever';
import { loadCurrencyFromContract } from './currency';
import { DeclarativePaymentDetectorBase } from '../declarative';
import { makeGetDeploymentInformation } from '../utils';

const PROXY_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
  ['0.2.0']: '0.2.0',
};

/**
 * Handle payment networks with ERC20 fee proxy contract extension, or derived
 * FIXME: inherit ReferenceBasedDetector
 */
export class ERC20FeeProxyPaymentDetectorBase<
    TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased = ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased
  >
  extends DeclarativePaymentDetectorBase<TExtension>
  implements PaymentTypes.IPaymentNetwork<TExtension> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor(
    paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    protected _currencyManager: ICurrencyManager,
  ) {
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
    paymentNetworkCreationParameters: PaymentTypes.IFeeReferenceBasedCreationParameters,
  ): Promise<ExtensionTypes.IAction> {
    // If no salt is given, generate one
    const salt =
      paymentNetworkCreationParameters.salt || (await Utils.crypto.generate8randomBytes());

    return this.extension.createCreationAction({
      feeAddress: paymentNetworkCreationParameters.feeAddress,
      feeAmount: paymentNetworkCreationParameters.feeAmount,
      paymentAddress: paymentNetworkCreationParameters.paymentAddress,
      refundAddress: paymentNetworkCreationParameters.refundAddress,
      salt,
    });
  }

  /**
   * Creates the extensions data to add payment address
   *
   * @param parameters to add payment information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddPaymentAddress(
    parameters: ExtensionTypes.PnFeeReferenceBased.IAddPaymentAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddPaymentAddressAction({
      paymentAddress: parameters.paymentAddress,
    });
  }

  /**
   * Creates the extensions data to add refund address
   *
   * @param Parameters to add refund information
   * @returns The extensionData object
   */
  public createExtensionsDataForAddRefundAddress(
    parameters: ExtensionTypes.PnFeeReferenceBased.IAddRefundAddressParameters,
  ): ExtensionTypes.IAction {
    return this.extension.createAddRefundAddressAction({
      refundAddress: parameters.refundAddress,
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

  /**
   * Gets the balance and the payment/refund events
   *
   * @param request the request to check
   * @returns A promise resulting to the balance and the payment/refund events
   */
  public async getBalance(
    request: RequestLogicTypes.IRequest,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    try {
      const paymentNetwork = request.extensions[this._paymentNetworkId];

      if (!paymentNetwork) {
        throw new BalanceError(
          `The request does not have the extension : ${this._paymentNetworkId}`,
          PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        );
      }
      const paymentAddress = paymentNetwork.values.paymentAddress;
      const refundAddress = paymentNetwork.values.refundAddress;
      const feeAddress = paymentNetwork.values.feeAddress;
      const salt = paymentNetwork.values.salt;

      let payments: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
      if (paymentAddress) {
        payments = await this.extractBalanceAndEvents(
          request,
          salt,
          paymentAddress,
          PaymentTypes.EVENTS_NAMES.PAYMENT,
          paymentNetwork,
        );
      }

      let refunds: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
      if (refundAddress) {
        refunds = await this.extractBalanceAndEvents(
          request,
          salt,
          refundAddress,
          PaymentTypes.EVENTS_NAMES.REFUND,
          paymentNetwork,
        );
      }

      const fees = this.extractFeeAndEvents(feeAddress, [...payments.events, ...refunds.events]);
      // TODO (PROT-1219): this is not ideal, since we're directly changing the request extension
      // once the fees feature and similar payment extensions are more well established, we should define
      // a better place to retrieve them from the request object them.
      paymentNetwork.values.feeBalance = fees;

      const balance: string = BigNumber.from(payments.balance || 0)
        .sub(BigNumber.from(refunds.balance || 0))
        .toString();

      const events: PaymentTypes.ERC20PaymentNetworkEvent[] = [
        ...payments.events,
        ...refunds.events,
      ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      return {
        balance,
        events,
      };
    } catch (error) {
      return getBalanceErrorObject(error);
    }
  }

  /**
   * Extracts the balance and events of a request
   *
   * @private
   * @param request Address to check
   * @param salt Payment reference salt
   * @param toAddress Payee address
   * @param eventName Indicate if it is an address for payment or refund
   * @param paymentNetwork Payment network state
   * @returns The balance and events
   */
  public async extractBalanceAndEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.IBalanceWithEvents> {
    const network = request.currency.network;

    if (!network) {
      throw new NetworkNotSupported(`Payment network not supported by ERC20 payment detection`);
    }

    const deploymentInformation = ERC20FeeProxyPaymentDetectorBase.getDeploymentInformation(
      network,
      paymentNetwork.version,
    );

    if (!deploymentInformation) {
      throw new VersionNotSupported(
        `Payment network version not supported: ${paymentNetwork.version}`,
      );
    }

    const proxyContractAddress: string | undefined = deploymentInformation.address;
    const proxyCreationBlockNumber: number = deploymentInformation.creationBlockNumber;

    if (!proxyContractAddress) {
      throw new NetworkNotSupported(
        `Network not supported for this payment network: ${request.currency.network}`,
      );
    }
    const declaredEvents = (await super.getBalance(request)).events;

    const paymentReference = PaymentReferenceCalculator.calculate(
      request.requestId,
      salt,
      toAddress,
    );

    const infoRetriever = networkSupportsTheGraph(network)
      ? new TheGraphInfoRetriever(
          paymentReference,
          proxyContractAddress,
          request.currency.value,
          toAddress,
          eventName,
          network,
        )
      : new ProxyInfoRetriever(
          paymentReference,
          proxyContractAddress,
          proxyCreationBlockNumber,
          request.currency.value,
          toAddress,
          eventName,
          network,
        );
    const events = [...declaredEvents, ...(await infoRetriever.getTransferEvents())];

    const balance = events
      .reduce((acc, event) => acc.add(BigNumber.from(event.amount)), BigNumber.from(0))
      .toString();

    return {
      balance,
      events,
    };
  }

  /**
   * Extract the fee balance from a list of payment events
   *
   * @param feeAddress The fee address the extracted fees will be paid to
   * @param paymentEvents The payment events to extract fees from
   */
  public extractFeeAndEvents(
    feeAddress: string,
    paymentEvents: PaymentTypes.ERC20PaymentNetworkEvent[],
  ): PaymentTypes.IBalanceWithEvents {
    if (!feeAddress) {
      return {
        balance: '0',
        events: [],
      };
    }

    return paymentEvents.reduce(
      (
        feeBalance: PaymentTypes.IBalanceWithEvents,
        event: PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20FeePaymentEventParameters>,
      ): PaymentTypes.IBalanceWithEvents => {
        // Skip if feeAddress or feeAmount are not set, or if feeAddress doesn't match the PN one
        if (
          !event.parameters?.feeAddress ||
          !event.parameters?.feeAmount ||
          event.parameters.feeAddress !== feeAddress
        ) {
          return feeBalance;
        }

        feeBalance = {
          balance: BigNumber.from(feeBalance.balance)
            .add(BigNumber.from(event.parameters.feeAmount))
            .toString(),
          events: [...feeBalance.events, event],
        };

        return feeBalance;
      },
      { balance: '0', events: [] },
    );
  }

  /**
   * Get the detected payment network ID
   */
  get paymentNetworkId(): PaymentTypes.PAYMENT_NETWORK_ID {
    return this._paymentNetworkId;
  }

  protected async getCurrency(
    storageCurrency: RequestLogicTypes.ICurrency,
  ): Promise<CurrencyDefinition> {
    const currency = this._currencyManager.fromStorageCurrency(storageCurrency);
    if (currency) {
      return currency;
    }

    if (storageCurrency.type !== RequestLogicTypes.CURRENCY.ERC20) {
      throw new Error(`Currency ${storageCurrency.value} not known`);
    }

    const contractCurrency = await loadCurrencyFromContract(storageCurrency);
    if (!contractCurrency) {
      throw new Error(
        `Cannot retrieve currency for contrat ${storageCurrency.value} (${storageCurrency.network})`,
      );
    }
    return contractCurrency;
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20FeeProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}

/**
 * Handle payment networks with ERC20 fee proxy contract extension
 */
export class ERC20FeeProxyPaymentDetector<
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased = ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased
> extends ERC20FeeProxyPaymentDetectorBase<TExtension> {
  constructor({
    advancedLogic,
    currencyManager,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    currencyManager: ICurrencyManager;
  }) {
    super(
      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
      advancedLogic.extensions.feeProxyContractErc20,
      currencyManager,
    );
  }
}
