import { erc20EscrowToPayArtifact } from '@requestnetwork/smart-contracts';
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ICurrencyManager } from '@requestnetwork/currency';
import { VersionNotSupported } from '../balance-error';

import { makeGetDeploymentInformation } from '../utils';
import EscrowERC20InfoRetriever from './escrow-info-retriever';
import { ERC20FeeProxyPaymentDetector } from './fee-proxy-contract';

const ESCROW_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ERC20 fee proxy contract extension, or derived
 */

export class CustomProxyDetector extends ERC20FeeProxyPaymentDetector {
  /**
   * TODO
   */
  constructor({
    advancedLogic,
    currencyManager,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    currencyManager: ICurrencyManager;
  }) {
    super({ advancedLogic, currencyManager });
  }

  protected async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.IPaymentNetworkEvent<
      // TODO missing the custom event parameters
      PaymentTypes.IERC20FeePaymentEventParameters | PaymentTypes.IDeclarativePaymentEventParameters
    >[]
  > {
    const paymentEvents = await super.getEvents(request);
    // TODO, should get custom events here
    const customEvents = await super.getEvents(request);
    return [...paymentEvents, ...customEvents];
  }

  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES | PaymentTypes.ESCROW_EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnFeeReferenceBased.ICreationParameters>,
    // TODO: " | PaymentTypes.IPaymentNetworkBaseEvent<PaymentTypes.ESCROW_EVENTS_NAMES>" is wrong, should get event parameters like in IERC20FeePaymentEventParameters
  ): Promise<
    | PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20FeePaymentEventParameters>[]
    | PaymentTypes.IPaymentNetworkBaseEvent<PaymentTypes.ESCROW_EVENTS_NAMES>[]
  > {
    if (
      eventName === PaymentTypes.EVENTS_NAMES.PAYMENT ||
      eventName === PaymentTypes.EVENTS_NAMES.REFUND
    ) {
      return super.extractEvents(
        eventName,
        address,
        paymentReference,
        requestCurrency,
        paymentChain,
        paymentNetwork,
      );
    }

    const deploymentInformation = CustomProxyDetector.getDeploymentInformation(
      paymentChain,
      paymentNetwork.version,
    );

    if (!deploymentInformation) {
      throw new VersionNotSupported(
        // TODO check this
        `Payment network version not supported: ${paymentNetwork.version}`,
      );
    }

    const customContractAddress: string | undefined = deploymentInformation.address;
    const customCreationBlockNumber: number = deploymentInformation.creationBlockNumber;

    const infoRetriever = /*? new TheGraphInfoRetriever(
          paymentReference,
          proxyContractAddress,
          requestCurrency.value,
          address,
          eventName,
          paymentChain,
        )
      : */ new EscrowERC20InfoRetriever( // TODO networkSupportsTheGraph(paymentChain)
      paymentReference,
      customContractAddress,
      customCreationBlockNumber,
      eventName,
      paymentChain,
    );

    return infoRetriever.getContractEvents() as Promise<
      PaymentTypes.IPaymentNetworkBaseEvent<PaymentTypes.ESCROW_EVENTS_NAMES>[]
    >;
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20EscrowToPayArtifact,
    ESCROW_CONTRACT_ADDRESS_MAP,
  );
}
