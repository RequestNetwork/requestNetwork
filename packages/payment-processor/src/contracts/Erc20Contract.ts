import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { BigNumber, BigNumberish, Interface } from 'ethers/utils';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

const abi = [
  'function balanceOf(address _owner) view returns (uint)',
  'function allowance(address _owner, address _spender) view returns (uint)',
  'function approve(address _spender, uint _value)',
];

interface IErc20ContractInterface extends Interface {
  functions: {
    approve: ITypedFunctionDescription<{
      encode([_spender, _value]: [string, BigNumberish]): string;
    }>;
  };
}

/**
 * A typescript-documented ERC20 Contract.
 */
export abstract class ERC20Contract extends Contract {
  public static connect(address: string, signerOrProvider: Signer | Provider): ERC20Contract {
    return new Contract(address, abi, signerOrProvider) as ERC20Contract;
  }

  public abstract interface: IErc20ContractInterface;
  public abstract allowance(_owner: string, _spender: string): Promise<BigNumber>;
  public abstract balanceOf(_owner: string): Promise<BigNumber>;
}
