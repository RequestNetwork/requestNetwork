import { Contract, Signer, providers } from 'ethers';

import { ethereumProxyArtifact } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented ETH Proxy Contract.
 */
export abstract class EthProxyContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): EthProxyContract {
    const abi = ethereumProxyArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as EthProxyContract;
  }
}
