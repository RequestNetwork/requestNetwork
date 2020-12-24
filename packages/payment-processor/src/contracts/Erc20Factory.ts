import { Contract, Signer, providers } from 'ethers';
import { ERC20Contract } from './Erc20Contract';

const abi = [
  'function balanceOf(address _owner) view returns (uint)',
  'function allowance(address _owner, address _spender) view returns (uint)',
  'function approve(address _spender, uint _value)',
];

/**
 * Instanciate an ERC20 contract with ERC20Factory.connect(address, signerOrProvider)
 */
export class ERC20Factory {
  static connect(address: string, signerOrProvider: Signer | providers.Provider): ERC20Contract {
    return new Contract(address, abi, signerOrProvider) as ERC20Contract;
  }
}
