import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { Arrayish, BigNumberish, Interface } from 'ethers/utils';

import { erc20ConversionProxy } from '@requestnetwork/smart-contracts';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

interface IErc20ConversionProxyContractInterface extends Interface {
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
export abstract class Erc20ConversionProxyContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): Erc20ConversionProxyContract {
    const abi = erc20ConversionProxy.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20ConversionProxyContract;
  }

  public abstract interface: IErc20ConversionProxyContractInterface;
}
