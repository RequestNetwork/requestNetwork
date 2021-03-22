import { Contract, providers, Signer } from 'ethers';
import { erc20ConversionProxy } from '@requestnetwork/smart-contracts';

/**
 *  A typescript-documented Chainlink Conversion Path Proxy Contract.
 */
export abstract class Erc20ConversionProxyContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | providers.Provider,
  ): Erc20ConversionProxyContract {
    const abi = erc20ConversionProxy.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20ConversionProxyContract;
  }
}
