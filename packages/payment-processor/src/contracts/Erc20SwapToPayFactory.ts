import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { Signer, Contract, providers } from 'ethers';
import { Erc20SwapToPayContract } from './Erc20SwapToPayContract';

/**
 * Instanciate an ERC20 Fee Proxy contract with ERC20FeeProxyFactory.connect(address, signerOrProvider)
 */
export class Erc20SwapToPayFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): Erc20SwapToPayContract {
    return new Contract(
      address,
      erc20SwapToPayArtifact.getContractAbi(),
      signerOrProvider,
    ) as Erc20SwapToPayContract;
  }
}
