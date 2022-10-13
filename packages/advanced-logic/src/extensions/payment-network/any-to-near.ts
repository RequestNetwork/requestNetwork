import { ICurrencyManager, UnsupportedCurrencyError } from '@requestnetwork/currency';
import { ExtensionTypes, IdentityTypes, RequestLogicTypes } from '@requestnetwork/types';
import { UnsupportedNetworkError } from './address-based';
import AnyToNativeTokenPaymentNetwork from './any-to-native';
import * as Semver from 'semver';

const CURRENT_VERSION = '0.1.0';
const supportedNetworksLegacy = ['aurora', 'aurora-testnet'];
const supportedNetworks = ['near', 'near-testnet'];

export default class AnyToNearPaymentNetwork extends AnyToNativeTokenPaymentNetwork {
  public constructor(
    private currencyManager: ICurrencyManager,
    extensionId: ExtensionTypes.ID = ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN,
    currentVersion: string = CURRENT_VERSION,
  ) {
    super(
      extensionId,
      currentVersion,
      Semver.lt(currentVersion, '0.2.0') ? supportedNetworksLegacy : supportedNetworks,
    );
  }

  /**
   * Check if a near address is valid
   *
   * @param {string} address address to check
   * @returns {boolean} true if address is valid
   */
  protected isValidAddress(address: string, networkName?: string): boolean {
    switch (networkName) {
      case 'aurora':
      case 'near':
        return this.isValidMainnetAddress(address);
      case 'aurora-testnet':
      case 'near-testnet':
        return this.isValidTestnetAddress(address);
      case undefined:
        return this.isValidMainnetAddress(address) || this.isValidTestnetAddress(address);
      default:
        throw new UnsupportedNetworkError(networkName, this.supportedNetworks);
    }
  }

  private isValidMainnetAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR', 'near');
  }

  private isValidTestnetAddress(address: string): boolean {
    return this.isValidAddressForSymbolAndNetwork(address, 'NEAR-testnet', 'near-testnet');
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
  ): ExtensionTypes.IState {
    if (!extensionAction.parameters.network || extensionAction.parameters.network.length === 0) {
      throw Error('network is required');
    }

    if (
      extensionAction.parameters.paymentAddress &&
      !this.isValidAddress(
        extensionAction.parameters.paymentAddress,
        extensionAction.parameters.network,
      )
    ) {
      throw Error(
        `paymentAddress ${extensionAction.parameters.paymentAddress} is not a valid address`,
      );
    }

    if (
      extensionAction.parameters.feeAddress &&
      !this.isValidAddress(
        extensionAction.parameters.feeAddress,
        extensionAction.parameters.network,
      )
    ) {
      throw Error(`feeAddress ${extensionAction.parameters.feeAddress} is not a valid address`);
    }

    if (
      extensionAction.parameters.refundAddress &&
      !this.isValidAddress(
        extensionAction.parameters.refundAddress,
        extensionAction.parameters.network,
      )
    ) {
      throw Error(
        `refundAddress ${extensionAction.parameters.refundAddress} is not a valid address`,
      );
    }

    const feePNCreationAction = super.applyCreation(extensionAction, timestamp);

    return {
      ...feePNCreationAction,
      events: [
        {
          name: 'create',
          parameters: {
            feeAddress: extensionAction.parameters.feeAddress,
            feeAmount: extensionAction.parameters.feeAmount,
            paymentAddress: extensionAction.parameters.paymentAddress,
            refundAddress: extensionAction.parameters.refundAddress,
            salt: extensionAction.parameters.salt,
            network: extensionAction.parameters.network,
            maxRateTimespan: extensionAction.parameters.maxRateTimespan,
          },
          timestamp,
        },
      ],
      values: {
        ...feePNCreationAction.values,
        network: extensionAction.parameters.network,
        maxRateTimespan: extensionAction.parameters.maxRateTimespan,
      },
    };
  }

  /**
   * Applies add payment address
   *
   * @param extensionState previous state of the extension
   * @param extensionAction action to apply
   * @param requestState request state read-only
   * @param actionSigner identity of the signer
   *
   * @returns state of the extension updated
   */
  protected applyAddPaymentAddress(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    const paymentAddress = extensionAction.parameters.paymentAddress;
    if (!this.isValidAddress(paymentAddress, extensionState.values.network)) {
      throw new Error(`paymentAddress '${paymentAddress}' is not a valid address`);
    }
    return super.applyAddPaymentAddress(
      extensionState,
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
  }

  protected applyAddFee(
    extensionState: ExtensionTypes.IState,
    extensionAction: ExtensionTypes.IAction,
    requestState: RequestLogicTypes.IRequest,
    actionSigner: IdentityTypes.IIdentity,
    timestamp: number,
  ): ExtensionTypes.IState {
    const network =
      requestState.extensions[ExtensionTypes.ID.PAYMENT_NETWORK_ANY_TO_NATIVE_TOKEN].values.network;
    if (
      extensionAction.parameters.feeAddress &&
      !this.isValidAddress(extensionAction.parameters.feeAddress, network)
    ) {
      throw Error('feeAddress is not a valid address');
    }
    return super.applyAddFee(
      extensionState,
      extensionAction,
      requestState,
      actionSigner,
      timestamp,
    );
  }

  /**
   * Validate that the network and currency coming from the extension and/or action are valid and supported.
   * It must throw in case of error.
   */
  protected validate(
    request: RequestLogicTypes.IRequest,
    extensionAction: ExtensionTypes.IAction,
  ): void {
    const network =
      extensionAction.action === ExtensionTypes.PnFeeReferenceBased.ACTION.CREATE
        ? extensionAction.parameters.network
        : request.extensions[this.extensionId]?.values.network;

    if (!network) {
      throw new Error(
        `The network must be provided by the creation action or by the extension state`,
      );
    }

    if (!supportedNetworks.includes(network)) {
      throw new Error(`The network (${network}) is not supported for this payment network.`);
    }

    const currency = this.currencyManager.fromStorageCurrency(request.currency);
    if (!currency) {
      throw new UnsupportedCurrencyError(request.currency);
    }
    if (!this.currencyManager.supportsConversion(currency, network)) {
      throw new Error(
        `The currency (${request.currency.value}) of the request is not supported for this payment network.`,
      );
    }
  }
}
