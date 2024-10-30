import { computeCreate2DeploymentAddress } from './compute-one-address';
import { getConstructorArgs } from './constructor-args';
import { HardhatRuntimeEnvironmentExtended, IDeploymentParams } from './types';
import { create2ContractDeploymentList } from './utils';
import { EvmChains } from '@requestnetwork/currency';

export const verifyOne = async (
  contractAddress: string,
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: deploymentParams.constructorArgs,
    });
  } catch (err) {
    console.log(err);
  }
};

export async function VerifyCreate2FromList(hre: HardhatRuntimeEnvironmentExtended): Promise<void> {
  try {
    /**
     * Introduces a delay between each verification
     * Prevents reaching the API call limit
     */
    const delay = () => {
      return new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    };

    let address: string;
    for (const contract of create2ContractDeploymentList) {
      try {
        await delay();
        switch (contract) {
          case 'ChainlinkConversionPath':
          case 'EthereumProxy':
          case 'EthereumFeeProxy':
          case 'EthConversionProxy':
          case 'ERC20Proxy':
          case 'ERC20FeeProxy':
          case 'ERC20SwapToPay':
          case 'ERC20SwapToConversion':
          case 'Erc20ConversionProxy':
          case 'ERC20EscrowToPay':
          case 'BatchConversionPayments':
          case 'ERC20TransferableReceivable':
          case 'SingleRequestProxyFactory': {
            const network = hre.config.xdeploy.networks[0];
            EvmChains.assertChainSupported(network);
            const constructorArgs = getConstructorArgs(contract, network);
            address = await computeCreate2DeploymentAddress({ contract, constructorArgs }, hre);
            await verifyOne(address, { contract, constructorArgs }, hre);
            break;
          }
          // Other cases to add when necessary
          default:
            throw new Error(
              `The contract ${contract} is not to be deployed using the CREATE2 scheme`,
            );
        }
      } catch (err) {
        console.warn(err);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
