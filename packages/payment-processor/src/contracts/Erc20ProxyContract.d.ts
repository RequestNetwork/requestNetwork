import { Contract, Signer, BigNumberish, providers, utils } from 'ethers';

interface IErc20ProxyContractInterface extends utils.Interface {
  functions: {
    'transferFromWithReference(address _tokenAddress, address _to, uint256 _amount, bytes _paymentReference)': FunctionFragment;
  };
  encodeFunctionData(
    functionFragment: 'transferFromWithReference',
    values: [string, string, BigNumberish, utils.Arrayish],
  );
}

/**
 *  A typescript-documented ERC20 Proxy Contract.
 */
export class Erc20ProxyContract extends Contract {
  interface: IErc20ProxyContractInterface;
  transferFromWithReference(
    _tokenAddress: string,
    _to: string,
    _amount: BigNumberish,
    _paymentReference: utils.Arrayish,
  ): Promise<string>;
}
