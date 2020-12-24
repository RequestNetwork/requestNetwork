import { ethereumProxyArtifact } from '@requestnetwork/smart-contracts';
import { Signer, providers, Contract } from 'ethers';
import { EthProxyContract } from './EthProxyContract';

/**
 * Instantiate an ETH Proxy contract with EthProxyFactory.connect(address, signerOrProvider)
 */
export class EthProxyFactory {
  static connect(address: string, signerOrProvider: Signer | providers.Provider): EthProxyContract {
    return new Contract(
      address,
      ethereumProxyArtifact.getContractAbi(),
      signerOrProvider,
    ) as EthProxyContract;
  }
}
