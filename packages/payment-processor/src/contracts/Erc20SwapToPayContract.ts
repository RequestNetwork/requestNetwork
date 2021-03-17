import { Contract, Signer, providers } from 'ethers';

import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export abstract class Erc20SwapToPayContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): Erc20SwapToPayContract {
    const abi = erc20SwapToPayArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20SwapToPayContract;
  }
}
