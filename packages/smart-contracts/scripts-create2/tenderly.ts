import { HardhatRuntimeEnvironmentExtended } from './types';
import * as artifacts from '../src/lib/artifacts';
import { ContractArtifact } from '../src/lib';
import { Contract } from 'ethers';
import * as console from 'console';
import axios from 'axios';
import { EvmChains } from '@requestnetwork/currency';

const getTenderlyAxiosInstance = (hre: HardhatRuntimeEnvironmentExtended) => {
  return axios.create({
    baseURL: 'https://api.tenderly.co',
    headers: {
      'X-Access-Key': hre.config.tenderly.accessKey,
    },
  });
};

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

export const tenderlyImportAll = async (hre: HardhatRuntimeEnvironmentExtended): Promise<void> => {
  const { username, project } = hre.config.tenderly;
  try {
    const contracts: Array<{ name: string; address: string; networkId: number }> = [];
    for (const artifactName in artifacts) {
      const artifact = (artifacts as any)[artifactName] as ContractArtifact<Contract>;
      const deployments = artifact.getAllAddressesFromAllNetworks();
      for (const deployment of deployments) {
        const { networkName } = deployment;
        if (['private', 'rinkeby', 'bsctest', 'alfajores'].includes(networkName)) continue;
        const sanitizedArtifactName = artifactName.replace(/Artifact/i, '');
        contracts.push({
          name: `${capitalizeFirstLetter(sanitizedArtifactName)}-${deployment.version}`,
          address: deployment.address,
          networkId: EvmChains.getChainId(networkName),
        });
      }
    }
    const axiosInstance = getTenderlyAxiosInstance(hre);
    await axiosInstance.post(`/api/v2/accounts/${username}/projects/${project}/contracts`, {
      contracts: contracts.map((contract) => ({
        address: contract.address,
        display_name: contract.name,
        network_id: contract.networkId.toString(),
      })),
    });
  } catch (err) {
    console.error('Error while adding contract(s) to Tenderly', err.response?.data || err);
  }
};
