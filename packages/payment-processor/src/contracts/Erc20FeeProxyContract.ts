import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { Arrayish, BigNumberish, Interface } from 'ethers/utils';

import { erc20FeeProxyArtifact } from '@requestnetwork/smart-contracts';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

interface IErc20FeeProxyContractInterface extends Interface {
  functions: {
    transferFromWithReferenceAndFee: ITypedFunctionDescription<{
      encode([_tokenAddress, _to, _amount, _paymentReference, _feeAmount, _feeAddress]: [
        string,
        string,
        BigNumberish,
        Arrayish,
        BigNumberish,
        string,
      ]): string;
    }>;
  };
}
/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export abstract class Erc20FeeProxyContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): Erc20FeeProxyContract {
    const abi = erc20FeeProxyArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20FeeProxyContract;
  }

  public abstract interface: IErc20FeeProxyContractInterface;
}
