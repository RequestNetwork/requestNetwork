import { Contract, Signer, BigNumberish, utils } from 'ethers';
import { FunctionFragment } from 'ethers/lib/utils';

interface IErc20SwapToPayContractInterface extends utils.Interface {
  functions: {
    'swapTransferWithReference(address _to, uint256 _amount, uint256 _amountInMax, address[] _path, bytes _paymentReference, uint256 _feeAmount, address _feeAddress, uint256 _deadline)': FunctionFragment;
  };
  encodeFunctionData(
    functionFragment: 'swapTransferWithReference',
    values: [string, BigNumberish, BigNumberish, string[], Arrayish, BigNumberish, string, number],
  ): string;
}

/**
 *  A typescript-documented ERC20 Fee Proxy Contract.
 */
export class Erc20SwapToPayContract extends Contract {
  interface: IErc20SwapToPayContractInterface;
  swapTransferWithReferenceAndFee(
    _to: string,
    _amount: BigNumberish,
    _amountInMax: BigNumberish,
    _path: string[],
    _paymentReference: Arrayish,
    _feeAmount: BigNumberish,
    _feeAddress: string,
    _deadline: number,
  ): Promise<string>;
}
