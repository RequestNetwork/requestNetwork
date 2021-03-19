import { Contract, providers, Signer } from 'ethers';
import { proxyChainlinkConversionPath } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented Chainlink Conversion Path Proxy Contract.
 */
export abstract class ProxyChainlinkConversionPathContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): ProxyChainlinkConversionPathContract {
    const abi = proxyChainlinkConversionPath.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as ProxyChainlinkConversionPathContract;
  }
}
