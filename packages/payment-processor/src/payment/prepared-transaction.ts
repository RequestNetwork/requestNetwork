import { BigNumberish } from 'ethers';

export interface IPreparedTransaction {
  value: BigNumberish;
  data: string;
  to: string;
}

/** Interface for preparing private transactions using Hinkal middleware */
export interface IPreparedPrivateTransaction {
  /** Amount to pay in base units (wei or the smallest possible unit of ERC20 token) */
  amountToPay: bigint;
  /** ERC20 token contract address */
  tokenAddress: string;
  /** list of operations encoded as HexStrings */
  ops: string[];
}
