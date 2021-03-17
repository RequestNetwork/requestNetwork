import { Contract, Signer, providers } from 'ethers';

const abi = [
  'function balanceOf(address _owner) view returns (uint)',
  'function allowance(address _owner, address _spender) view returns (uint)',
  'function approve(address _spender, uint _value)',
];

/**
 * A typescript-documented ERC20 Contract.
 */
export abstract class ERC20Contract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): ERC20Contract {
    return new Contract(address, abi, signerOrProvider);
  }

  // public abstract allowance(_owner: string, _spender: string): Promise<BigNumber>;
  // public abstract balanceOf(_owner: string): Promise<BigNumber>;
}
