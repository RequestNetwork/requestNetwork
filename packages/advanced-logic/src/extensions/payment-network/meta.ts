import {
  CurrencyTypes,
  ExtensionTypes,
  IdentityTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import { ICreationContext } from '../abstract-extension';
import AnyToErc20ProxyPaymentNetwork from './any-to-erc20-proxy';
import AnyToEthProxyPaymentNetwork from './any-to-eth-proxy';
import { deepCopy } from '@requestnetwork/utils';
import DeclarativePaymentNetwork from './declarative';

const CURRENT_VERSION = '0.1.0';

export default class MetaPaymentNetwork<
  TCreationParameters extends
    ExtensionTypes.PnMeta.ICreationParameters = ExtensionTypes.PnMeta.ICreationParameters,
> extends DeclarativePaymentNetwork<TCreationParameters> {
  public constructor(
    protected currencyManager: CurrencyTypes.ICurrencyManager,
    public extensionId: ExtensionTypes.PAYMENT_NETWORK_ID = ExtensionTypes.PAYMENT_NETWORK_ID.META,
    public currentVersion: string = CURRENT_VERSION,
  ) {
    super(extensionId, currentVersion);
    this.actions = {
      ...this.actions,
      [ExtensionTypes.PnMeta.ACTION.APPLY_ACTION_TO_PN]:
        this.applyApplyActionToExtension.bind(this),
    };
  }

  /**
   * Creates the extensionsData to create the meta extension payment detection
   *
   * @param creationParameters extensions parameters to create
   *
   * @returns IExtensionCreationAction the extensionsData to be stored in the request
   */
  public createCreationAction(
    creationParameters: TCreationParameters,
  ): ExtensionTypes.IAction<TCreationParameters> {
    Object.entries(creationParameters).forEach(([pnId, creationParameters]) => {
      const pn = this.getExtension(pnId);
      const subPnIdentifiers: string[] = [];

      // Perform validation on sub-pn creation parameters
      for (const param of creationParameters) {
        pn.createCreationAction(param);
        if (subPnIdentifiers.includes(param.salt)) {
          throw new Error('Duplicate payment network identifier (salt)');
        }
        subPnIdentifiers.push(param.salt);
      }
    });

    return super.createCreationAction(creationParameters);
  }

  /**
   * Creates the extensionsData to perform an action on a sub-pn
   *
   * @param parameters parameters to create the action to perform
   *
   * @returns IAction the extensionsData to be stored in the request
   */
  public createApplyActionToPn(
    parameters: ExtensionTypes.PnMeta.IApplyActionToPn,
  ): ExtensionTypes.IAction {
    return {
      action: ExtensionTypes.PnMeta.ACTION.APPLY_ACTION_TO_PN,
      id: this.extensionId,
      parameters: {
        pnIdentifier: parameters.pnIdentifier,
        action: parameters.action,
        parameters: parameters.parameters,
      },
    };
  }

  /**
   * Applies a creation extension action
   *
   * @param extensionAction action to apply
   * @param timestamp action timestamp
   *
   * @returns state of the extension created
   */
  protected applyCreation(
    extensionAction: ExtensionTypes.IAction,
    timestamp: number,
    context?: ICreationContext,
  ): ExtensionTypes.IState {
    if (!context) {
      throw new Error('Context is required');
    }
    const values: Record<string, ExtensionTypes.IState> = {};
    Object.entries(extensionAction.parameters).forEach(([pnId, parameters]) => {
      const pn = this.getExtension(pnId);

      (parameters as any[]).forEach((params) => {
        values[params.salt] = pn.applyActionToExtension(
          {},
          {
            action: 'create',
            id: pnId as ExtensionTypes.PAYMENT_NETWORK_ID,
            parameters: params,
            version: pn.currentVersion,
          },
          context.requestState,
          context.actionSigner,
          timestamp,
        )[pnId];
      });
    });

    return {
      ...super.applyCreation(extensionAction, timestamp),
      events: [
        {
          name: 'create',
          parameters: {
            ...extensionAction.parameters,
          },
          timestamp,
        },
      ],
      values,
    };
  }

  /** Applies an action on a sub-payment network
   *
   * @param extensionsState previous state of the extensions
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   * @param timestamp timestamp of the action
   *
   * @returns state of the extension created
   */
  protected applyApplyActionToExtension(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    const copiedExtensionState: ExtensionTypes.IState<any> = deepCopy(extensionState);
    const { pnIdentifier, action, parameters } = extensionAction.parameters;
    const extensionToActOn: ExtensionTypes.IState = copiedExtensionState.values[pnIdentifier];

    const pn = this.getExtension(extensionToActOn.id);

    const subExtensionState = {
      [extensionToActOn.id]: extensionToActOn,
    };

    copiedExtensionState.values[pnIdentifier] = pn.applyActionToExtension(
      subExtensionState,
      {
        id: extensionToActOn.id,
        action,
        parameters,
      },
      requestState,
      actionSigner,
      timestamp,
    )[extensionToActOn.id];

    // update events
    copiedExtensionState.events.push({
      name: ExtensionTypes.PnMeta.ACTION.APPLY_ACTION_TO_PN,
      parameters: {
        pnIdentifier,
        action,
        parameters,
      },
      timestamp,
      from: actionSigner,
    });
    return copiedExtensionState;
  }

  /**
   * Validate the extension action regarding the currency and network
   * It must throw in case of error
   */
  protected validate(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    const pnIdentifiers: string[] = [];
    if (extensionAction.action === ExtensionTypes.PnMeta.ACTION.CREATE) {
      Object.entries(extensionAction.parameters).forEach(([pnId, parameters]: [string, any]) => {
        // Checks that the PN is supported
        this.getExtension(pnId);

        if (parameters.action) {
          throw new Error('Invalid action');
        }

        for (const param of parameters) {
          if (pnIdentifiers.includes(param.salt)) {
            throw new Error('Duplicate payment network identifier');
          }
          pnIdentifiers.push(param.salt);
        }
      });
    } else if (extensionAction.action === ExtensionTypes.PnMeta.ACTION.APPLY_ACTION_TO_PN) {
      const { pnIdentifier } = extensionAction.parameters;

      const subPnState: ExtensionTypes.IState =
        request.extensions[ExtensionTypes.PAYMENT_NETWORK_ID.META]?.values?.[pnIdentifier];
      if (!subPnState) {
        throw new Error(`No payment network with identifier ${pnIdentifier}`);
      }

      // Checks that the PN is supported
      this.getExtension(subPnState.id);
    }
  }

  private getExtension(pnId: string): ExtensionTypes.IExtension {
    switch (pnId) {
      case ExtensionTypes.PAYMENT_NETWORK_ID.ANY_DECLARATIVE: {
        return new DeclarativePaymentNetwork();
      }
      case ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY: {
        return new AnyToErc20ProxyPaymentNetwork(this.currencyManager);
      }
      case ExtensionTypes.PAYMENT_NETWORK_ID.ANY_TO_ETH_PROXY: {
        return new AnyToEthProxyPaymentNetwork(this.currencyManager);
      }
      default: {
        throw new Error(`Invalid PN: ${pnId}`);
      }
    }
  }
}
