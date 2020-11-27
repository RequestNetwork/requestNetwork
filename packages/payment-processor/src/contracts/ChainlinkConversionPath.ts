import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { BigNumberish, Interface } from 'ethers/utils';

import { chainlinkConversionPath } from '@requestnetwork/smart-contracts';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

interface IChainlinkConversionPathInterface extends Interface {
  functions: {
    getRate: ITypedFunctionDescription<{
      encode([_path]: [
        string[],
      ]): any;
    }>;
    getConversion: ITypedFunctionDescription<{
      encode([_amountIn, _path]: [
        BigNumberish,
        string[],
      ]): any;
    }>;
  };
}

/**
 *  A typescript-documented Chainlink Conversion Path Proxy Contract.
 */
export abstract class ChainlinkConversionPath extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): ChainlinkConversionPath {
    const abi = chainlinkConversionPath.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as ChainlinkConversionPath;
  }

  public abstract interface: IChainlinkConversionPathInterface;
}
