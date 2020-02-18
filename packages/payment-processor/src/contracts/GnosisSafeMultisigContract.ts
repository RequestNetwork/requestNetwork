import { Contract, ContractTransaction, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { Arrayish, BigNumberish } from 'ethers/utils';

const abi = [
  'function submitTransaction(address _destination, uint256 _value, bytes _data) returns (uint256)',
];

/**
 * A typescript-documented GnosisSafe Multisig contract
 */
export abstract class GnosisSafeMultisigContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): GnosisSafeMultisigContract {
    return new Contract(address, abi, signerOrProvider) as GnosisSafeMultisigContract;
  }

  public abstract submitTransaction(
    destination: string,
    value: BigNumberish,
    data: Arrayish,
  ): Promise<ContractTransaction>;
}
