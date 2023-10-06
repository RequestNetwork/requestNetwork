import { BigNumber } from 'ethers';

export type SuggestedFees = {
  baseFee: string;
  maxPriorityFee: string;
};

export type EstimatedGasFees = {
  maxFeePerGas?: BigNumber;
  maxPriorityFeePerGas?: BigNumber;
};
