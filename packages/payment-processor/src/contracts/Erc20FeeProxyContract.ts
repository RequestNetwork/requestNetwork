import { Contract, providers, Signer } from 'ethers';

import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export abstract class Erc20FeeProxyContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): Erc20FeeProxyContract {
    const abi = erc20FeeProxyArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20FeeProxyContract;
  }
}
