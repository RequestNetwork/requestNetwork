import { Contract, utils } from 'ethers';
import { FunctionFragment } from 'ethers/lib/utils';

interface IEthProxyContractInterface extends utils.Interface {
  functions: {
    'transferWithReference(address,bytes)': FunctionFragment;
  };
  encodeFunctionData(functionFragment: 'transferWithReference', values: [string, utils.Arrayish]);
}
/**
 *  A typescript-documented ETH Proxy Contract.
 */
export class EthProxyContract extends Contract {
  interface: IEthProxyContractInterface;

  transferWithReference(_to: string, _paymentReference: utils.Arrayish): Promise<string>;
}
