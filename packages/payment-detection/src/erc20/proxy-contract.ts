import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import ProxyInfoRetriever from './proxy-info-retriever';
import TheGraphInfoRetriever from './thegraph-info-retriever';
import { networkSupportsTheGraph } from '../thegraph';
import { makeGetDeploymentInformation } from '../utils';
import { ReferenceBasedDetector } from '../reference-based-detector';

const PROXY_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ERC20 proxy contract extension
 */
export class ERC20ProxyPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IERC20PaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(
      PaymentTypes.PAYMENT_NETWORK_ID.ERC20_PROXY_CONTRACT,
      advancedLogic.extensions.proxyContractErc20,
    );
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param tokenContractAddress the address of the token contract
   * @returns The balance and events
   */
  protected async extractEvents(
    eventName: PaymentTypes.EVENTS_NAMES,
    address: string | undefined,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnReferenceBased.ICreationParameters>,
  ): Promise<PaymentTypes.AllNetworkEvents<PaymentTypes.IERC20PaymentEventParameters>> {
    if (!address) {
      return {
        paymentEvents: [],
      };
    }

    const {
      address: proxyContractAddress,
      creationBlockNumber: proxyCreationBlockNumber,
    } = ERC20ProxyPaymentDetector.getDeploymentInformation(paymentChain, paymentNetwork.version);

    if (networkSupportsTheGraph(paymentChain)) {
      const graphInfoRetriever = new TheGraphInfoRetriever(
        paymentReference,
        proxyContractAddress,
        requestCurrency.value,
        address,
        eventName,
        paymentChain,
      );
      return graphInfoRetriever.getTransferEvents();
    } else {
      const proxyInfoRetriever = new ProxyInfoRetriever(
        paymentReference,
        proxyContractAddress,
        proxyCreationBlockNumber,
        requestCurrency.value,
        address,
        eventName,
        paymentChain,
      );
      const paymentEvents = await proxyInfoRetriever.getTransferEvents();
      return {
        paymentEvents,
      };
    }
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20ProxyArtifact,
    PROXY_CONTRACT_ADDRESS_MAP,
  );
}
