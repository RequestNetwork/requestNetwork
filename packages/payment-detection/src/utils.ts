import { Currency } from '@requestnetwork/currency';
import { RequestLogicTypes } from '@requestnetwork/types';
import { BigNumber, BigNumberish } from 'ethers';
import { LogDescription } from 'ethers/lib/utils';

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
export const padAmountForChainlink = (amount: BigNumberish, currency: Currency): BigNumber => {
  // eslint-disable-next-line no-magic-numbers
  return BigNumber.from(amount).mul(10 ** getChainlinkPaddingSize(currency));
};

export const unpadAmountFromChainlink = (amount: BigNumberish, currency: Currency): BigNumber => {
  // eslint-disable-next-line no-magic-numbers
  return BigNumber.from(amount).div(10 ** getChainlinkPaddingSize(currency));
};

const getChainlinkPaddingSize = (currency: Currency): number => {
  switch (currency.type) {
    case RequestLogicTypes.CURRENCY.ISO4217: {
      const chainlinkFiatDecimal = 8;
      return Math.max(chainlinkFiatDecimal - currency.getDecimals(), 0);
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
