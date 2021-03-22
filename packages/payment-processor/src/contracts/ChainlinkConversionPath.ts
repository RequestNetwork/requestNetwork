import { Contract, Signer, providers } from 'ethers';

import { chainlinkConversionPath } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented Chainlink Conversion Path Proxy Contract.
 */
export abstract class ChainlinkConversionPath extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): ChainlinkConversionPath {
    const abi = chainlinkConversionPath.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as ChainlinkConversionPath;
  }
}
