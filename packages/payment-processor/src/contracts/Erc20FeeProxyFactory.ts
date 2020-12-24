import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { Signer, Contract, providers } from 'ethers';
import { Erc20FeeProxyContract } from './Erc20FeeProxyContract';

/**
 * Instantiate an ERC20 Fee Proxy contract with ERC20FeeProxyFactory.connect(address, signerOrProvider)
 */
export class ERC20FeeProxyFactory {
  static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): Erc20FeeProxyContract {
    return new Contract(
      address,
      erc20FeeProxyArtifact.getContractAbi(),
      signerOrProvider,
    ) as Erc20FeeProxyContract;
  }
}
