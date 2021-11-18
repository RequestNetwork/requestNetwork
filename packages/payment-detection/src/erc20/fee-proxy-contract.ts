import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import { CurrencyDefinition, ICurrencyManager } from '@requestnetwork/currency';
import { BalanceError, NetworkNotSupported, VersionNotSupported } from '../balance-error';
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
  TExtension extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  TPaymentEventParameters extends
    | PaymentTypes.IERC20FeePaymentEventParameters
    | PaymentTypes.IDeclarativePaymentEventParameters
> extends DeclarativePaymentDetectorBase<
  TExtension,
  TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor(
    paymentNetworkId: PaymentTypes.PAYMENT_NETWORK_ID,
    extension: TExtension,
    protected _currencyManager: ICurrencyManager,
  ) {
    super(paymentNetworkId, extension, (request) => this.getEvents(request));
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

  private async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.IPaymentNetworkEvent<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >[]
  > {
    const paymentNetwork = request.extensions[this._paymentNetworkId];

    if (!paymentNetwork) {
      throw new BalanceError(
        `The request does not have the extension : ${this._paymentNetworkId}`,
        PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
      );
    }
    const { paymentAddress, refundAddress, feeAddress, salt } = paymentNetwork.values;

    const paymentEvents = await this.extractTransferEvents(
      request,
      salt,
      paymentAddress,
      PaymentTypes.EVENTS_NAMES.PAYMENT,
      paymentNetwork,
    );

    const refundEvents = await this.extractTransferEvents(
      request,
      salt,
      refundAddress,
      PaymentTypes.EVENTS_NAMES.REFUND,
      paymentNetwork,
    );

    const events = [...paymentEvents, ...refundEvents];

    const feeEvents = this.getFeeEvents(feeAddress, events);
    const feeBalance = this.computeFeeBalance(feeEvents).toString();

    // TODO (PROT-1219): this is not ideal, since we're directly changing the request extension
    // once the fees feature and similar payment extensions are more well established, we should define
    // a better place to retrieve them from the request object them.
    paymentNetwork.values.feeBalance = {
      events: feeEvents,
      balance: feeBalance,
    };

    return events;
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
  private async extractTransferEvents(
    request: RequestLogicTypes.IRequest,
    salt: string,
    toAddress: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    paymentNetwork: ExtensionTypes.IState,
  ): Promise<PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[]> {
    if (!toAddress) {
      return [];
    }
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

    // TODO type
    return (await infoRetriever.getTransferEvents()) as PaymentTypes.IPaymentNetworkEvent<TPaymentEventParameters>[];
  }

  /**
   * Extract the fee balance from a list of payment events
   *
   * @param feeAddress The fee address the extracted fees will be paid to
   * @param paymentEvents The payment events to extract fees from
   */
  protected getFeeEvents(
    feeAddress: string,
    paymentEvents: PaymentTypes.IPaymentNetworkEvent<
      TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >[],
  ): PaymentTypes.IPaymentNetworkEvent<
    TPaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
  >[] {
    if (!feeAddress) {
      return [];
    }

    return paymentEvents.filter((event) =>
      // Skip if feeAddress or feeAmount are not set, or if feeAddress doesn't match the PN one
      Boolean(
        event.parameters &&
          'feeAddress' in event.parameters &&
          event.parameters.feeAddress &&
          event.parameters.feeAmount &&
          event.parameters.feeAddress === feeAddress,
      ),
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
export class ERC20FeeProxyPaymentDetector extends ERC20FeeProxyPaymentDetectorBase<
  ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased,
  PaymentTypes.IERC20FeePaymentEventParameters
> {
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
