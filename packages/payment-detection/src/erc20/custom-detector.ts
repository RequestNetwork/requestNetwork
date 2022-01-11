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
import { ERC20FeeProxyPaymentDetector, ERC20FeeProxyPaymentDetectorBase } from './fee-proxy-contract';
import { GenericEventParameters, PAYMENT_NETWORK_ID } from 'types/src/payment-types';

const ESCROW_CONTRACT_ADDRESS_MAP = {
  ['0.1.0']: '0.1.0',
};

/**
 * Handle payment networks with ERC20 fee proxy contract extension, or derived
 */

export class CustomProxyDetector extends ERC20FeeProxyPaymentDetectorBase<
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
      currencyManager);
  }

  protected async getEvents(
    request: RequestLogicTypes.IRequest,
  ): Promise<
    PaymentTypes.ICustomNetworkEvent<
      PaymentTypes.GenericEventParameters,
      PaymentTypes.ESCROW_EVENTS_NAMES | PaymentTypes.EVENTS_NAMES
    >[] 
    > {
    
    const paymentEvents = await super.getEvents(request);

    // TODO, should get custom events here
    const customEvents = await this.extractAllCustomEvents(address, to); 
    return [...paymentEvents, ...customEvents];
  }

  protected async extractAllCustomEvents(
    address: string,
    to: string,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnFeeReferenceBased.ICreationParameters>
  ): Promise<
    PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20PaymentEventParameters>[]
    | PaymentTypes.ICustomNetworkEvent<PaymentTypes.GenericEventParameters>[]
    > {
      const infoRetriever = new EscrowERC20InfoRetriever( 
        to,
    paymentReference,
    customContractAddress,
    customCreationBlockNumber,
    requestCurrency.value,
    paymentChain,
    paymentNetwork
  );
    }// should return the getacontractevents from escrow retriever

  



   /*
   * Returns deployment information for the underlying smart contract for a given payment network version
   */
   public static getDeploymentInformation = makeGetDeploymentInformation(
    erc20EscrowToPayArtifact,
    ESCROW_CONTRACT_ADDRESS_MAP,
  );
}
/** 
  protected async extractEvents(
    eventName?: PaymentTypes.EVENTS_NAMES | PaymentTypes.ESCROW_EVENTS_NAMES,
    address: string,
    to: string,
    paymentReference: string,
    requestCurrency: RequestLogicTypes.ICurrency,
    paymentChain: string,
    paymentNetwork: ExtensionTypes.IState<ExtensionTypes.PnFeeReferenceBased.ICreationParameters>,
    // TODO: " | PaymentTypes.IPaymentNetworkBaseEvent<PaymentTypes.ESCROW_EVENTS_NAMES>" is wrong, should get event parameters like in IERC20FeePaymentEventParameters
  ): Promise<
    PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IERC20PaymentEventParameters>[]
    | PaymentTypes.ICustomNetworkEvent<PaymentTypes.GenericEventParameters>[]
    > {
    if ( // ERC20feeProxy related requests
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
    if ( // Escrow related events.
      eventName === PaymentTypes.ESCROW_EVENTS_NAMES.FROZEN_PAYMENT ||
      eventName === PaymentTypes.ESCROW_EVENTS_NAMES.INITIATED_EMERGENCY_CLAIM ||
      eventName === PaymentTypes.ESCROW_EVENTS_NAMES.REVERTED_EMERGENCY_CLAIM ||
      eventName === PaymentTypes.ESCROW_EVENTS_NAMES.INIT_ESCROW
    ) {
      return this.extractEvents(
        eventName,
        address,
        to,
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

    

    return infoRetriever.getContractEvents() as Promise<
      PaymentTypes.ICustomNetworkEvent<PaymentTypes.GenericEventParameters>[]
    >;
  }
*/
 
