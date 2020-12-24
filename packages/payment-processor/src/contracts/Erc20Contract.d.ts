import {
  Contract,
  BigNumber,
  BigNumberish,
  utils,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  CallOverrides,
  EventFilter,
  Signer,
  providers,
} from 'ethers';
import { BytesLike, FunctionFragment, Result } from 'ethers/lib/utils';

interface Erc20ContractInterface extends utils.Interface {
  functions: {
    'approve(address _spender, uint _value)': FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'approve', values: [string, BigNumberish]): string;
  decodeFunctionResult(functionFragment: 'approve', data: BytesLike): Result;
}

/**
 * A typescript-documented ERC20 Contract.
 */
export class ERC20Contract extends Contract {
  interface: Erc20ContractInterface;
  approve(usr: string, wad: BigNumberish, overrides?: Overrides): Promise<ContractTransaction>;
  allowance(_owner: string, _spender: string): Promise<BigNumber>;
  balanceOf(_owner: string): Promise<BigNumber>;
}
