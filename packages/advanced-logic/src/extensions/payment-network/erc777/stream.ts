import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import ReferenceBasedPaymentNetwork from '../reference-based';
import Utils from '@requestnetwork/utils';

const CURRENT_VERSION = '0.1.0';

/**
 * Implementation of the payment network to pay in ERC777, including third-party fees payment, based on a reference provided to a proxy contract.
 */
export default class Erc777StreamPaymentNetwork<
  TCreationParameters extends ExtensionTypes.PnStreamReferenceBased.ICreationParameters = ExtensionTypes.PnStreamReferenceBased.ICreationParameters,
> extends ReferenceBasedPaymentNetwork<TCreationParameters> {
  public constructor(
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ERC777_STREAM,
    currentVersion: string = CURRENT_VERSION,
    public supportedNetworks: string[] = ['matic', 'xdai', 'mumbai', 'rinkeby', 'arbitrum-rinkeby'],
    public supportedCurrencyType: RequestLogicTypes.CURRENCY = RequestLogicTypes.CURRENCY.ERC777,
  ) {
    super(extensionId, currentVersion, supportedNetworks, supportedCurrencyType);
  }

  /**
   * Creates the extensionsData to create the payment detection extension
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    if (!creationParameters.expectedFlowRate) {
      throw Error('expectedFlowRate should not be empty');
    }

    if (!creationParameters.expectedStartDate) {
      throw Error('expectedStartDate should not be empty');
    }

    return super.createCreationAction(
      creationParameters,
    ) as ExtensionTypes.IAction<TCreationParameters>;
  }

  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
  ): ExtensionTypes.IState {
    if (!extensionAction.parameters.expectedStartDate) {
      throw Error('expectedStartDate should not be empty');
    }
    if (!extensionAction.parameters.expectedFlowRate) {
      throw Error('expectedFlowRate should not be empty');
    }
    if (
      extensionAction.parameters.expectedStartDate &&
      !Utils.amount.isValid(extensionAction.parameters.expectedStartDate)
    ) {
      throw Error('expectedStartDate is not a valid amount');
    }
    if (
      extensionAction.parameters.expectedFlowRate &&
      !Utils.amount.isValid(extensionAction.parameters.expectedFlowRate)
    ) {
      throw Error('expectedFlowRate is not a valid amount');
    }

    const proxyPNCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...proxyPNCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            expectedStartDate: extensionAction.parameters.expectedStartDate,
            expectedFlowRate: extensionAction.parameters.expectedFlowRate,
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
            salt: extensionAction.parameters.salt,
          },
          timestamp,
        },
      ],
      values: {
        ...proxyPNCreationAction.values,
        expectedStartDate: extensionAction.parameters.expectedStartDate,
        expectedFlowRate: extensionAction.parameters.expectedFlowRate,
      },
    };
  }
}
