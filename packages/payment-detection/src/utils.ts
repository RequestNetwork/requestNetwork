import { CurrencyDefinition } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { BigNumber, BigNumberish, Contract } from 'ethers';
import { LogDescription } from 'ethers/lib/utils';
import { ContractArtifact, DeploymentInformation } from '@requestnetwork/smart-contracts';

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
export type GetDeploymentInformation = (
  network: string,
  paymentNetworkVersion: string,
) => DeploymentInformationWithVersion;

/*
 * Returns deployment information for the underlying smart contract for a given payment network version
 */
export const getDeploymentInformation = <TVersion extends string>(
  artifact: ContractArtifact<Contract, TVersion>,
  map: Record<string, TVersion>,
): GetDeploymentInformation => {
  return (network, paymentNetworkVersion) => {
    const contractVersion = map[paymentNetworkVersion];
    if (!contractVersion) {
      throw Error(`No contract matches payment network version: ${paymentNetworkVersion}.`);
    }
    const info = artifact.getDeploymentInformation(network, contractVersion);
    return { ...info, contractVersion };
  };
};
