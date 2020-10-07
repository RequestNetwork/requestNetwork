import { Contract, Signer } from 'ethers';
import { Provider } from 'ethers/providers';
import { BigNumberish, Interface } from 'ethers/utils';

import { erc20SwapToPayArtifact } from '@requestnetwork/smart-contracts';
import { ITypedFunctionDescription } from './TypedFunctionDescription';

interface IErc20SwapToPayContractInterface extends Interface {
  functions: {
    swapTransferWithReference: ITypedFunctionDescription<{
      encode([
        _to,
        _amount,
        _amountInMax,
        _path,
        _paymentReference,
        _feeAmount,
        _feeAddress,
        _deadline,
      ]: [
        string,
        BigNumberish,
        BigNumberish,
        string[],
        string,
        BigNumberish,
        string,
        number,
      ]): string;
    }>;
  };
}
/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export abstract class Erc20SwapToPayContract extends Contract {
  public static connect(
    address: string,
    signerOrProvider: Signer | Provider,
  ): Erc20SwapToPayContract {
    const abi = erc20SwapToPayArtifact.getContractAbi();
    return new Contract(address, abi, signerOrProvider) as Erc20SwapToPayContract;
  }

  public abstract interface: IErc20SwapToPayContractInterface;
}
