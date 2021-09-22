import * as SmartContracts from '@requestnetwork/smart-contracts';
import { AdvancedLogicTypes, ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import EthInputDataInfoRetriever from './info-retriever';
import ProxyEthereumInfoRetriever from './proxy-info-retriever';
import FeeReferenceBasedDetector from '../fee-reference-based-detector';

// interface of the object indexing the proxy contract version
interface IProxyContractVersion {
  [version: string]: string;
}

const PROXY_CONTRACT_ADDRESS_MAP: IProxyContractVersion = {
  ['0.2.0']: '0.2.0',
};

/**
 * Handle payment networks with ETH input data extension
 */
export default class PaymentNetworkETHFeeProxy extends FeeReferenceBasedDetector<PaymentTypes.IETHPaymentEventParameters> {
  private explorerApiKeys: Record<string, string>;
  /**
   * @param extension The advanced logic payment network extensions
   */
  public constructor({
    advancedLogic,
    explorerApiKeys,
  }: {
    advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
    explorerApiKeys?: Record<string, string>;
  }) {
    super(
      advancedLogic.extensions.feeProxyContractEth,
      ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT,
    );
    this.explorerApiKeys = explorerApiKeys || {};
  }

  /**
   * Extracts the balance and events of an address
   *
   * @private
   * @param address Address to check
   * @param eventName Indicate if it is an address for payment or refund
   * @param network The id of network we want to check
   * @param paymentReference The reference to identify the payment
   * @param paymentNetworkVersion the version of the payment network
   * @returns The balance
   */
  protected async extractEvents(
    address: string,
    eventName: PaymentTypes.EVENTS_NAMES,
    network: string,
    paymentReference: string,
    paymentNetworkVersion: string,
  ): Promise<PaymentTypes.ETHPaymentNetworkEvent[]> {
    const infoRetriever = new EthInputDataInfoRetriever(
      address,
      eventName,
      network,
      paymentReference,
      this.explorerApiKeys[network],
    );
    const events = await infoRetriever.getTransferEvents();
    const proxyContractArtifact = await this.safeGetProxyArtifact(network, paymentNetworkVersion);

    if (proxyContractArtifact) {
      const proxyInfoRetriever = new ProxyEthereumInfoRetriever(
        paymentReference,
        proxyContractArtifact.address,
        proxyContractArtifact.creationBlockNumber,
        address,
        eventName,
        network,
      );
      const proxyEvents = await proxyInfoRetriever.getTransferEvents();
      for (const event of proxyEvents) {
        events.push(event);
      }
    }
    return events;
  }

  /*
   * Fetches events from the Ethereum Proxy, or returns null
   */
  private async safeGetProxyArtifact(network: string, paymentNetworkVersion: string) {
    const contractVersion = PROXY_CONTRACT_ADDRESS_MAP[paymentNetworkVersion];
    try {
      return SmartContracts.ethereumProxyArtifact.getDeploymentInformation(
        network,
        contractVersion,
      );
    } catch (error) {
      console.warn(error);
    }
    return null;
  }
}

// ////

// import { ethereumFeeProxyArtifact } from '@requestnetwork/smart-contracts';
// import {
//   AdvancedLogicTypes,
//   ExtensionTypes,
//   PaymentTypes,
//   RequestLogicTypes,
// } from '@requestnetwork/types';
// import Utils from '@requestnetwork/utils';
// import { ICurrencyManager } from '@requestnetwork/currency';
// import getBalanceErrorObject from '../balance-error';
// import PaymentReferenceCalculator from '../payment-reference-calculator';
// import ProxyInfoRetriever from './proxy-info-retriever';

// import { BigNumber } from 'ethers';
// // !TODO: will be added later on
// // import { networkSupportsTheGraph } from '../thegraph';
// // import TheGraphInfoRetriever from './thegraph-info-retriever';

// /* eslint-disable max-classes-per-file */
// /** Exception when network not supported */
// class NetworkNotSupported extends Error {}
// /** Exception when version not supported */
// class VersionNotSupported extends Error {}

// /**
//  * Handle payment networks with ETH fee proxy contract extension
//  * FIXME: inherit FeeReferenceBasedDetector
//  */
// export default class PaymentNetworkETHFeeProxyContract<
//   ExtensionType extends ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased = ExtensionTypes.PnFeeReferenceBased.IFeeReferenceBased
// > implements PaymentTypes.IPaymentNetwork<ExtensionType> {
//   protected _paymentNetworkId: ExtensionTypes.ID;
//   protected _extension: ExtensionType;
//   protected _currencyManager: ICurrencyManager;

//   /**
//    * @param extension The advanced logic payment network extensions
//    */
//   public constructor({
//     advancedLogic,
//     currencyManager,
//   }: {
//     advancedLogic: AdvancedLogicTypes.IAdvancedLogic;
//     currencyManager: ICurrencyManager;
//   }) {
//     this._paymentNetworkId = ExtensionTypes.ID.PAYMENT_NETWORK_ETH_FEE_PROXY_CONTRACT;
//     this._extension = advancedLogic.extensions.feeProxyContractEth;
//     this._currencyManager = currencyManager;
//   }

//   /**
//    * Gets the balance and the payment/refund events
//    *
//    * @param request the request to check
//    * @returns A promise resulting to the balance and the payment/refund events
//    */
//   public async getBalance(
//     request: RequestLogicTypes.IRequest,
//   ): Promise<PaymentTypes.IBalanceWithEvents> {
//     const paymentNetwork = request.extensions[this._paymentNetworkId];

//     if (!paymentNetwork) {
//       return getBalanceErrorObject(
//         `The request does not have the extension : ${this._paymentNetworkId}`,
//         PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
//       );
//     }
//     try {
//       const paymentAddress = paymentNetwork.values.paymentAddress;
//       const refundAddress = paymentNetwork.values.refundAddress;
//       const feeAddress = paymentNetwork.values.feeAddress;
//       const salt = paymentNetwork.values.salt;

//       let payments: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
//       if (paymentAddress) {
//         payments = await this.extractBalanceAndEvents(
//           request,
//           salt,
//           paymentAddress,
//           PaymentTypes.EVENTS_NAMES.PAYMENT,
//           paymentNetwork,
//         );
//       }

//       let refunds: PaymentTypes.IBalanceWithEvents = { balance: '0', events: [] };
//       if (refundAddress) {
//         refunds = await this.extractBalanceAndEvents(
//           request,
//           salt,
//           refundAddress,
//           PaymentTypes.EVENTS_NAMES.REFUND,
//           paymentNetwork,
//         );
//       }

//       const fees = this.extractFeeAndEvents(feeAddress, [...payments.events, ...refunds.events]);
//       // TODO (PROT-1219): this is not ideal, since we're directly changing the request extension
//       // once the fees feature and similar payment extensions are more well established, we should define
//       // a better place to retrieve them from the request object them.
//       paymentNetwork.values.feeBalance = fees;

//       const balance: string = BigNumber.from(payments.balance || 0)
//         .sub(BigNumber.from(refunds.balance || 0))
//         .toString();

//       const events: PaymentTypes.ETHPaymentNetworkEvent[] = [
//         ...payments.events,
//         ...refunds.events,
//       ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

//       return {
//         balance,
//         events,
//       };
//     } catch (error) {
//       let code: PaymentTypes.BALANCE_ERROR_CODE | undefined;
//       if (error instanceof NetworkNotSupported) {
//         code = PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED;
//       }
//       if (error instanceof VersionNotSupported) {
//         code = PaymentTypes.BALANCE_ERROR_CODE.VERSION_NOT_SUPPORTED;
//       }
//       return getBalanceErrorObject(error.message, code);
//     }
//   }

//   /**
//    * Extracts the balance and events of a request
//    *
//    * @private
//    * @param request Address to check
//    * @param salt Payment reference salt
//    * @param toAddress Payee address
//    * @param eventName Indicate if it is an address for payment or refund
//    * @param paymentNetwork Payment network state
//    * @returns The balance and events
//    */
//   public async extractBalanceAndEvents(
//     request: RequestLogicTypes.IRequest,
//     salt: string,
//     toAddress: string,
//     eventName: PaymentTypes.EVENTS_NAMES,
//     paymentNetwork: ExtensionTypes.IState,
//   ): Promise<PaymentTypes.IBalanceWithEvents> {
//     const network = request.currency.network;

//     if (!network) {
//       throw new NetworkNotSupported(`Payment network not supported by ETH payment detection`);
//     }

//     const deploymentInformation = ethereumFeeProxyArtifact.getDeploymentInformation(
//       network,
//       paymentNetwork.version,
//     );

//     if (!deploymentInformation) {
//       throw new VersionNotSupported(
//         `Payment network version not supported: ${paymentNetwork.version}`,
//       );
//     }

//     const proxyContractAddress: string | undefined = deploymentInformation.address;
//     const proxyCreationBlockNumber: number = deploymentInformation.creationBlockNumber;

//     if (!proxyContractAddress) {
//       throw new NetworkNotSupported(
//         `Network not supported for this payment network: ${request.currency.network}`,
//       );
//     }

//     const paymentReference = PaymentReferenceCalculator.calculate(
//       request.requestId,
//       salt,
//       toAddress,
//     );

//     const infoRetriever =
//       //   networkSupportsTheGraph(network)
//       //   ? new TheGraphInfoRetriever(
//       //       paymentReference,
//       //       proxyContractAddress,
//       //       toAddress,
//       //       eventName,
//       //       network,
//       //     )
//       //   :
//       new ProxyInfoRetriever(
//         paymentReference,
//         proxyContractAddress,
//         proxyCreationBlockNumber,
//         toAddress,
//         eventName,
//         network,
//       );
//     const events = await infoRetriever.getTransferEvents();

//     const balance = events
//       .reduce((acc, event) => acc.add(BigNumber.from(event.amount)), BigNumber.from(0))
//       .toString();

//     return {
//       balance,
//       events,
//     };
//   }

//   /**
//    * Extract the fee balance from a list of payment events
//    *
//    * @param feeAddress The fee address the extracted fees will be paid to
//    * @param paymentEvents The payment events to extract fees from
//    */
//   public extractFeeAndEvents(
//     feeAddress: string,
//     paymentEvents: PaymentTypes.ETHPaymentNetworkEvent[],
//   ): PaymentTypes.IBalanceWithEvents {
//     if (!feeAddress) {
//       return {
//         balance: '0',
//         events: [],
//       };
//     }

//     return paymentEvents.reduce(
//       (
//         feeBalance: PaymentTypes.IBalanceWithEvents,
//         event: PaymentTypes.IPaymentNetworkEvent<PaymentTypes.IETHFeePaymentEventParameters>,
//       ): PaymentTypes.IBalanceWithEvents => {
//         // Skip if feeAddress or feeAmount are not set, or if feeAddress doesn't match the PN one
//         if (
//           !event.parameters?.feeAddress ||
//           !event.parameters?.feeAmount ||
//           event.parameters.feeAddress !== feeAddress
//         ) {
//           return feeBalance;
//         }

//         feeBalance = {
//           balance: BigNumber.from(feeBalance.balance)
//             .add(BigNumber.from(event.parameters.feeAmount))
//             .toString(),
//           events: [...feeBalance.events, event],
//         };

//         return feeBalance;
//       },
//       { balance: '0', events: [] },
//     );
//   }

//   /**
//    * Get the detected payment network ID
//    */
//   get paymentNetworkId(): ExtensionTypes.ID {
//     return this._paymentNetworkId;
//   }
// }
