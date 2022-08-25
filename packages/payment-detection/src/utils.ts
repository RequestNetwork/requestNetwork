import { CurrencyDefinition } from '@requestnetwork/currency';
import { RequestLogicTypes, PaymentTypes, ExtensionTypes } from '@requestnetwork/types';
import { BigNumber, BigNumberish, Contract } from 'ethers';
import { keccak256, LogDescription } from 'ethers/lib/utils';
import { ContractArtifact, DeploymentInformation } from '@requestnetwork/smart-contracts';
import { NetworkNotSupported, VersionNotSupported } from './balance-error';
import PaymentReferenceCalculator from './payment-reference-calculator';

/**
 * Converts the Log's args from array to an object with keys being the name of the arguments
 */
export const parseLogArgs = <T>({ args, eventFragment }: LogDescription): T => {
  return args.reduce((prev, current, i) => {
    prev[eventFragment.inputs[i].name] = current;
    return prev;
  }, {});
};

/**
 * Pads an amount to match Chainlink's own currency decimals (eg. for fiat amounts).
 */
export const padAmountForChainlink = (
  amount: BigNumberish,
  currency: Pick<CurrencyDefinition, 'decimals' | 'type'>,
): BigNumber => {
  // eslint-disable-next-line no-magic-numbers
  return BigNumber.from(amount).mul(10 ** getChainlinkPaddingSize(currency));
};

export const unpadAmountFromChainlink = (
  amount: BigNumberish,
  currency: Pick<CurrencyDefinition, 'decimals' | 'type'>,
): BigNumber => {
  // eslint-disable-next-line no-magic-numbers
  return BigNumber.from(amount).div(10 ** getChainlinkPaddingSize(currency));
};

const getChainlinkPaddingSize = ({
  type,
  decimals,
}: Pick<CurrencyDefinition, 'decimals' | 'type'>): number => {
  switch (type) {
    case RequestLogicTypes.CURRENCY.ISO4217: {
      const chainlinkFiatDecimal = 8;
      return Math.max(chainlinkFiatDecimal - decimals, 0);
    }
    case RequestLogicTypes.CURRENCY.ETH:
    case RequestLogicTypes.CURRENCY.ERC20: {
      return 0;
    }
    default:
      throw new Error(
        'Unsupported request currency for conversion with Chainlink. The request currency has to be fiat, ETH or ERC20.',
      );
  }
};

export type DeploymentInformationWithVersion = DeploymentInformation & { contractVersion: string };
export type GetDeploymentInformation<TAllowUndefined extends boolean> = (
  network: string,
  paymentNetworkVersion: string,
) => TAllowUndefined extends false
  ? DeploymentInformationWithVersion
  : DeploymentInformationWithVersion | null;

/*
 * Returns the method to get deployment information for the underlying smart contract (based on a payment network version)
 * for given artifact and version mapping.
 */
export const makeGetDeploymentInformation = <
  TVersion extends string = string,
  TAllowUndefined extends boolean = false,
>(
  artifact: ContractArtifact<Contract>,
  map: Record<string, TVersion>,
  allowUndefined?: TAllowUndefined,
): GetDeploymentInformation<TAllowUndefined> => {
  return (network, paymentNetworkVersion) => {
    const contractVersion = map[paymentNetworkVersion];
    if (!contractVersion) {
      throw new VersionNotSupported(
        `No contract matches payment network version: ${paymentNetworkVersion}.`,
      );
    }
    const info = artifact.getOptionalDeploymentInformation(network, contractVersion);
    if (!info) {
      if (!allowUndefined) {
        if (artifact.getOptionalDeploymentInformation(network)) {
          throw new VersionNotSupported(
            `Payment network version not supported: ${paymentNetworkVersion}`,
          );
        }
        throw new NetworkNotSupported(`Network not supported for this payment network: ${network}`);
      }
      return null as ReturnType<GetDeploymentInformation<TAllowUndefined>>;
    }
    return { ...info, contractVersion };
  };
};

export const hashReference = (paymentReference: string): string => {
  return keccak256(`0x${paymentReference}`);
};

/**
 * Returns escrow status based on array of escrow events
 * @param escrowEvents Balance of the request being updated
 * @returns
 */
export const calculateEscrowState = (
  escrowEvents: PaymentTypes.EscrowNetworkEvent[],
): PaymentTypes.ESCROW_STATE | null => {
  if (escrowEvents.length === 0) {
    return null;
  }
  const latestEscrowEvent = escrowEvents[escrowEvents.length - 1];
  switch (latestEscrowEvent.parameters?.eventName) {
    case PaymentTypes.ESCROW_EVENTS_NAMES.FREEZE_ESCROW:
      return PaymentTypes.ESCROW_STATE.IN_FROZEN;
    case PaymentTypes.ESCROW_EVENTS_NAMES.INITIATE_EMERGENCY_CLAIM:
      return PaymentTypes.ESCROW_STATE.IN_EMERGENCY;
    case PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ESCROW:
    case PaymentTypes.ESCROW_EVENTS_NAMES.REVERT_EMERGENCY_CLAIM:
      return PaymentTypes.ESCROW_STATE.PAID_ESCROW;
    case PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ISSUER:
      return PaymentTypes.ESCROW_STATE.PAID_ISSUER;
  }
  return null;
};

/**
 * Return the payment network extension of a Request.
 */
export function getPaymentNetworkExtension(
  request: Pick<RequestLogicTypes.IRequest, 'extensions'>,
): ExtensionTypes.IState | undefined {
  return Object.values(request.extensions).find(
    (x) => x.type === ExtensionTypes.TYPE.PAYMENT_NETWORK,
  );
}

type PaymentParameters = PaymentTypes.IReferenceBasedCreationParameters &
  PaymentTypes.IDeclarativePaymentEventParameters;

/** Gets the payment info based on parameters, for payment reference calculation */
const getInfo = (
  { paymentAddress, paymentInfo, refundAddress, refundInfo }: PaymentParameters,
  event: PaymentTypes.EVENTS_NAMES,
) => {
  if (event === PaymentTypes.EVENTS_NAMES.REFUND) {
    return refundAddress || JSON.stringify(refundInfo);
  }
  return paymentAddress || JSON.stringify(paymentInfo);
};

/** Gets a payment (or refund) reference for any type of Request */
export function getPaymentReference(
  request: Pick<RequestLogicTypes.IRequest, 'extensions' | 'requestId'>,
  event: PaymentTypes.EVENTS_NAMES = PaymentTypes.EVENTS_NAMES.PAYMENT,
): string | undefined {
  const extension = getPaymentNetworkExtension(request) as ExtensionTypes.IState<PaymentParameters>;
  if (!extension) {
    throw new Error('no payment network found');
  }
  const requestId = request.requestId;
  const salt = extension.values.salt;
  if (!salt) return;

  const info = getInfo(extension.values, event);
  if (!info) return;

  return PaymentReferenceCalculator.calculate(requestId, salt, info);
}
