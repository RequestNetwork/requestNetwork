import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { Arrayish, BigNumberish, Interface } from 'ethers/utils';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

interface IErc20ProxyContractInterface extends Interface {
  functions: {
    transferFromWithReference: ITypedFunctionDescription<{
      encode([_tokenAddress, _to, _amount, _paymentReference]: [
        string,
        string,
        BigNumberish,
        Arrayish,
      ]): string;
    }>;
  };
}
/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export abstract class Erc20ProxyContract extends Contract {
  public static connect(address: string, signerOrProvider: Signer | Provider): Erc20ProxyContract {
    const abi = erc20ProxyArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20ProxyContract;
  }

  public abstract interface: IErc20ProxyContractInterface;
}
