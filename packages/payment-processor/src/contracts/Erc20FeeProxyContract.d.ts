import { Contract, Signer, BigNumberish, utils } from 'ethers';
import { FunctionFragment } from 'ethers/lib/utils';

interface IErc20FeeProxyContractInterface extends utils.Interface {
  functions: {
    'transferFromWithReferenceAndFee(address _tokenAddress, address _to, uint256 _amount, bytes _paymentReference, uint256 _feeAmount, address _feeAddress)': FunctionFragment;
  };
  encodeFunctionData(
    functionFragment: 'transferFromWithReferenceAndFee',
    values: [string, string, BigNumberish, Arrayish, BigNumberish, string],
  );
}

/**
 *  A typescript-documented ERC20 Fee Proxy Contract.
 */
export class Erc20FeeProxyContract extends Contract {
  interface: IErc20FeeProxyContractInterface;
  transferFromWithReferenceAndFee(
    _tokenAddress: string,
    _to: string,
    _amount: BigNumberish,
    _paymentReference: Arrayish,
    _feeAmount: BigNumberish,
    _feeAddress: string,
  ): Promise<string>;
}
