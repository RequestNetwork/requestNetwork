export type SuggestedFees = {
  baseFee: string;
  maxPriorityFee: string;
};

export type EstimatedGasFees = {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
};
