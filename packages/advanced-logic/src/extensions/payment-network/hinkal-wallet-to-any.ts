import { ExtensionTypes, CurrencyTypes } from '@requestnetwork/types';
import { UnsupportedCurrencyError } from '@requestnetwork/currency';
import HinkalWalletPaymentNetwork from './erc20/hinkal-wallet';

const CURRENT_VERSION = '0.0.1';

/**
 * Core of the reference based payment networks
 * This module is called by the reference based payment networks to avoid code redundancy
 */
export default class HinkalWalletToAnyERC20<
  TCreationParameters extends ExtensionTypes.PnAnyHinkalWallet.ICreationParameters,
> extends HinkalWalletPaymentNetwork<TCreationParameters> {
  public constructor(
    currencyManager: CurrencyTypes.ICurrencyManager,
    extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID
      .ERC20_HINKAL_WALLET,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(currencyManager, extensionId, currentVersion);
  }

  /**
   * Creates the extensionsData to create the payment detection extension
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(creationParameters: TCreationParameters): ExtensionTypes.IAction {
    if (!creationParameters.acceptedTokens) {
      throw Error('acceptedTokens is required');
    }
    if (creationParameters.acceptedTokens.length === 0) {
      throw Error('acceptedTokens cannot be empty');
    }
    if (creationParameters.acceptedTokens.some((address) => !this.isValidAddress(address))) {
      throw Error('acceptedTokens must contains only valid ethereum addresses');
    }
    const network = creationParameters.network;
    this.throwIfInvalidNetwork(network);

    for (const address of creationParameters.acceptedTokens) {
      const acceptedCurrency = this.currencyManager.fromAddress(address, network);
      if (!acceptedCurrency) {
        throw new UnsupportedCurrencyError({
          value: address,
          network,
        });
      }
      //TODO: add resticted tokens check like TORN
    }

    //TODO: fix reference-based creationParameters type

    return super.createCreationAction(creationParameters);
  }
  /**
   * Applies a creation extension action
   *
   * @param extensionAction action to apply
   * @param timestamp ?
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    const basicCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...basicCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            network: extensionAction.parameters.paymentAddress,
          },
          timestamp,
        },
      ],
      values: {
        ...basicCreationAction.values,
      },
    };
  }
}
