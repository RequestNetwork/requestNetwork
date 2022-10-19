import { computeCreate2DeploymentAddress } from './compute-one-address';
import { getConstructorArgs } from './constructor-args';
import { HardhatRuntimeEnvironmentExtended } from './types';
import { IDeploymentParams } from './types';
import { create2ContractDeploymentList } from './utils';

export const verifyOne = async (
  contractAddress: string,
  deploymentParams: IDeploymentParams,
  hre: HardhatRuntimeEnvironmentExtended,
): Promise<void> => {
  try {
    console.log('here verifyOne start');
    console.log('contractAddress', contractAddress);
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: deploymentParams.constructorArgs,
    });
    console.log('here verifyOne end');
  } catch (err) {
    console.log(err);
  }
};

export async function VerifyCreate2FromList(hre: HardhatRuntimeEnvironmentExtended): Promise<void> {
  try {
    let address: string;
    await Promise.all(
      create2ContractDeploymentList.map(async (contract) => {
        switch (contract) {
          case 'EthereumProxy':
          case 'EthereumFeeProxy':
          case 'EthConversionProxy':
          case 'ERC20FeeProxy':
          case 'ERC20SwapToConversion':
          case 'Erc20ConversionProxy': {
            const constructorArgs = getConstructorArgs(contract);
            address = await computeCreate2DeploymentAddress({ contract, constructorArgs }, hre);
            await verifyOne(address, { contract, constructorArgs }, hre);
            break;
          }
          case 'ERC20EscrowToPay': {
            const network = hre.config.xdeploy.networks[0];
            const constructorArgs = getConstructorArgs(contract, network);
            address = await computeCreate2DeploymentAddress({ contract, constructorArgs }, hre);
            await verifyOne(address, { contract, constructorArgs }, hre);
            break;
          }
          case 'BatchConversionPayments': {
            const network = hre.config.xdeploy.networks[0];
            const constructorArgs = getConstructorArgs(contract, network);
            console.log('network', network);
            console.log('hre', hre.config.xdeploy);
            console.log('hre', hre.config);
            address = await computeCreate2DeploymentAddress({ contract, constructorArgs }, hre);
            await verifyOne(address, { contract, constructorArgs }, hre);
            break;
          }
          // Other cases to add when necessary
          default:
            throw new Error(
              `The contrat ${contract} is not to be deployed using the CREATE2 scheme`,
            );
        }
      }),
    );
  } catch (e) {
    console.error(e);
  }
}
