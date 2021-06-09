import { ExtensionTypes } from '@requestnetwork/types';
import AddressBasedPaymentNetwork from './address-based';

// Regex for "at least 16 hexadecimal numbers". Used to validate the salt
const eightHexRegex = /[0-9a-f]{16,}/;

/**
 * Core of the reference based payment networks
 * This module is called by the reference based payment networks to avoid code redundancy
 */
export default abstract class ReferenceBasedPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnReferenceBased.ICreationParameters = ExtensionTypes.PnReferenceBased.ICreationParameters
> extends AddressBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    public extensionId: ExtensionTypes.ID,
    public currentVersion: string,
    public supportedNetworks: string[],
    public supportedCurrencyType: string,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }

  /**
   * Creates the extensionsData to create the ETH payment detection extension
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    if (!creationParameters.salt) {
      throw Error('salt should not be empty');
    }

    if (!eightHexRegex.test(creationParameters.salt)) {
      throw Error(
        `The salt must be a string of minimum 16 hexadecimal characters. Example: 'ea3bc7caf64110ca'`,
      );
    }

    return super.createCreationAction(
      creationParameters,
    ) as ExtensionTypes.IAction<TCreationParameters>;
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
    if (!extensionAction.parameters.salt) {
      throw Error('salt should not be empty');
    }

    if (!eightHexRegex.test(extensionAction.parameters.salt)) {
      throw Error(
        `The salt must be a string of minimum 16 hexadecimal characters. Example: 'ea3bc7caf64110ca'`,
      );
    }

    const basicCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...basicCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
            salt: extensionAction.parameters.salt,
          },
          timestamp,
        },
      ],
      id: this.extensionId,
      type: this.extensionType,
      values: {
        ...basicCreationAction.values,
        salt: extensionAction.parameters.salt,
      },
      version: this.currentVersion,
    };
  }
}
