import { ExtensionTypes, RequestLogicTypes, TypesUtils } from '@requestnetwork/types';
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
    public supportedNetworks: string[] = [
      'matic',
      'xdai',
      'mumbai',
      'rinkeby',
      'goerli',
      'arbitrum-rinkeby',
    ],
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
    if (
      !TypesUtils.isOriginalRequestCreationParameters(creationParameters) &&
      !TypesUtils.isSubsequentRequestCreationParameters(creationParameters)
    ) {
      throw Error(
        'originalRequestId, previousRequestId and recurrenceNumber must be all empty or all filled',
      );
    }

    /* Original Request Creation */
    if (TypesUtils.isOriginalRequestCreationParameters(creationParameters)) {
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

    /* Subsequent request Creation */
    if (!this.isSubsequentRequestParametersValid(creationParameters)) {
      throw Error(
        'recurrenceNumber must be 1 if originalRequestId and previousRequestId are equal and vice versa',
      );
    }

    return {
      action: ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE,
      id: this.extensionId,
      parameters: creationParameters,
      version: this.currentVersion,
    } as ExtensionTypes.IAction<TCreationParameters>;
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
    if (
      !TypesUtils.isOriginalRequestCreationParameters(extensionAction.parameters) &&
      !TypesUtils.isSubsequentRequestCreationParameters(extensionAction.parameters)
    ) {
      throw Error(
        'originalRequestId, previousRequestId and recurrenceNumber must be all empty or all filled',
      );
    }

    /* Master request Creation */
    if (TypesUtils.isOriginalRequestCreationParameters(extensionAction.parameters)) {
      if (
        !extensionAction.parameters.expectedStartDate ||
        (extensionAction.parameters.expectedStartDate &&
          !Utils.amount.isValid(extensionAction.parameters.expectedStartDate))
      ) {
        throw Error('expectedStartDate is empty or invalid');
      }

      if (
        !extensionAction.parameters.expectedFlowRate ||
        (extensionAction.parameters.expectedFlowRate &&
          !Utils.amount.isValid(extensionAction.parameters.expectedFlowRate))
      ) {
        throw Error('expectedFlowRate is empty or invalid');
      }

      const proxyPNCreationAction = super.applyCreation(extensionAction, timestamp);

      return {
        ...proxyPNCreationAction,
        events: [
          {
            name: ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE,
            parameters: extensionAction.parameters,
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

    /* Subsequent Request Creation */
    if (!extensionAction.parameters.originalRequestId) {
      throw Error('originalRequestId is empty');
    }

    if (!extensionAction.parameters.previousRequestId) {
      throw Error('previousRequestId is empty');
    }

    if (!extensionAction.parameters.recurrenceNumber) {
      throw Error('recurrenceNumber is empty');
    }

    if (!extensionAction.version) {
      throw Error('version is required at creation');
    }

    if (!this.isSubsequentRequestParametersValid(extensionAction.parameters)) {
      throw Error(
        'recurrenceNumber must be 1 if originalRequestId and previousRequestId are equal and vice versa',
      );
    }

    return {
      events: [
        {
          name: ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE,
          parameters: extensionAction.parameters,
          timestamp,
        },
      ],
      id: extensionAction.id,
      type: this.extensionType,
      values: extensionAction.parameters,
      version: extensionAction.version,
    };
  }

  /**
   * Verifies the consistency between the different parameters of the create action for subsequent requests
   *
   * @param parameters extension parameters to check
   *
   * @returns a boolean
   */
  protected isSubsequentRequestParametersValid(
    parameters: ExtensionTypes.PnStreamReferenceBased.ISubsequentRequestCreationParameters,
  ): boolean {
    return (
      (parameters.originalRequestId === parameters.previousRequestId &&
        parameters.recurrenceNumber === 1) ||
      (parameters.recurrenceNumber !== 1 &&
        parameters.originalRequestId !== parameters.previousRequestId)
    );
  }
}
