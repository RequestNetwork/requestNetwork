import { erc20ProxyArtifact } from '@requestnetwork/smart-contracts';
import { Signer, providers, Contract } from 'ethers';
import { Erc20ProxyContract } from './Erc20ProxyContract';

/**
 * Instantiate an ERC20 Fee Proxy contract with ERC20FeeProxyFactory.connect(address, signerOrProvider)
 */
export class Erc20ProxyFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): Erc20ProxyContract {
    return new Contract(
      address,
      erc20ProxyArtifact.getContractAbi(),
      signerOrProvider,
    ) as Erc20ProxyContract;
  }
}
