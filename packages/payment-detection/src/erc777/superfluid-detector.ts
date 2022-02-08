import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { NetworkNotSupported, VersionNotSupported } from '../balance-error';
import { SuperFluidInfoRetriever } from './superfluid-retriever';
import { makeGetDeploymentInformation } from '../utils';
import { ReferenceBasedDetector } from '../reference-based-detector';

const SF_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ERC777 Superfluid streaming extension
 */
export class SuperFluidPaymentDetector extends ReferenceBasedDetector<
  ExtensionTypes.PnReferenceBased.IReferenceBased,
  PaymentTypes.IERC20PaymentEventParameters
> {
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({ advancedLogic }: { advancedLogic: AdvancedLogicTypes.IAdvancedLogic }) {
    super(PaymentTypes.PAYMENT_NETWORK_ID.ERC777_STREAM, advancedLogic.extensions.streamErc777);
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
  ): Promise<PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20PaymentEventParameters>[]> {
    if (!address) {
      return [];
    }

    try {
      SuperFluidPaymentDetector.getDeploymentInformation(paymentChain, paymentNetwork.version);
    } catch (e) {
      const errMessage = (e as Error)?.message || '';
      if (errMessage.startsWith('No deployment for network')) {
        throw new NetworkNotSupported(
          `Network not supported for this payment network: ${paymentChain}`,
        );
      }
      if (
        errMessage.startsWith('No contract matches payment network version') ||
        errMessage.startsWith('No deployment for version')
      ) {
        throw new VersionNotSupported(errMessage);
      }
      throw e;
    }

    const infoRetriever = new SuperFluidInfoRetriever(
      paymentReference,
      requestCurrency.value,
      address,
      eventName,
      paymentChain,
    );

    return infoRetriever.getTransferEvents();
  }

  /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
  public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20ProxyArtifact,
    SF_CONTRACT_ADDRESS_MAP,
  );
}
