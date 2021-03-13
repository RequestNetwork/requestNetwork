import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { Arrayish, BigNumberish, Interface } from 'ethers/utils';

import { proxyChainlinkConversionPath } from '@requestnetwork/smart-contracts';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

interface IProxyChainlinkConversionPathContractInterface extends Interface {
  functions: {
    transferFromWithReferenceAndFee: ITypedFunctionDescription<{
      encode([
        _to,
        _amount,
        _path,
        _paymentReference,
        _feeAmount,
        _feeAddress,
        _maxToSpend,
        _maxRateTimespan,
      ]: [
        string,
        BigNumberish,
        string[],
        Arrayish,
        BigNumberish,
        string,
        BigNumberish,
        BigNumberish,
      ]): string;
    }>;
  };
}

/**
 *  A typescript-documented Chainlink Conversion Path Proxy Contract.
 */
export abstract class ProxyChainlinkConversionPathContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): ProxyChainlinkConversionPathContract {
    const abi = proxyChainlinkConversionPath.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as ProxyChainlinkConversionPathContract;
  }

  public abstract interface: IProxyChainlinkConversionPathContractInterface;
}
