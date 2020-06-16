import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { Arrayish, Interface } from 'ethers/utils';

import { ethereumProxyArtifact } from '@requestnetwork/smart-contracts';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

interface IEthProxyContractInterface extends Interface {
  functions: {
    transferWithReference: ITypedFunctionDescription<{
      encode([_to, _paymentReference]: [string, Arrayish]): string;
    }>;
  };
}
/**
 *  A typescript-documented ETH Proxy Contract.
 */
export abstract class EthProxyContract extends Contract {
  public static connect(address: string, signerOrProvider: Signer | Provider): EthProxyContract {
    const abi = ethereumProxyArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as EthProxyContract;
  }

  public abstract interface: IEthProxyContractInterface;
}
