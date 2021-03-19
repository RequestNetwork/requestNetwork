import { Contract, providers, Signer } from 'ethers';

import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export abstract class Erc20ProxyContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): Erc20ProxyContract {
    const abi = erc20ProxyArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20ProxyContract;
  }
}
