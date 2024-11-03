import { BigNumberish } from 'ethers';

export interface IPreparedTransaction {
  value: BigNumberish;
  data: string;
  to: string;
}

export interface IPreparedPrivateTransaction {
  amountToPay: bigint;
  tokenAddress: string;
  ops: string[];
}
