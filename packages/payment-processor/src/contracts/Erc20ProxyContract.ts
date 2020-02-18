import { Contract, ContractTransaction, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { Arrayish, BigNumberish } from 'ethers/utils';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export abstract class Erc20ProxyContract extends Contract {
  public static connect(address: string, signerOrProvider: Signer | Provider): Erc20ProxyContract {
    const abi = erc20ProxyArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20ProxyContract;
  }

  public abstract transferFromWithReference(
    _tokenAddress: string,
    _to: string,
    _amount: BigNumberish,
    _paymentReference: Arrayish,
  ): Promise<ContractTransaction>;
}
