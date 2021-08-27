import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';

import ReferenceBasedPaymentNetwork from './reference-based';

// const CURRENT_VERSION = '0.2.0';
// const supportedNetworks = ['aurora', 'aurora-testnet'];

/**
 * Implementation of the payment network to pay in ETH based on input data.
 */
export default abstract class NativeTokenPaymentNetwork extends ReferenceBasedPaymentNetwork {
  public constructor(
    extensionId: ExtensionTypes.ID,
    currentVersion: string,
    supportedNetworks: string[],
  ) {
    super(extensionId, currentVersion, supportedNetworks, RequestLogicTypes.CURRENCY.ETH);
  }

  protected validate(
    request: RequestLogicTypes.IRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extensionAction: ExtensionTypes.IAction,
  ): void {
    if (
      request.currency.type !== RequestLogicTypes.CURRENCY.ETH ||
      (request.currency.network && !this.supportedNetworks.includes(request.currency.network))
    ) {
      throw Error(
        `This extension can be used only on ETH-like requests and on supported networks ${this.supportedNetworks.join(
          ', ',
        )}`,
      );
    }
  }
}
