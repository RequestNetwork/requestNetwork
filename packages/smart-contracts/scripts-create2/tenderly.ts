import { HardhatRuntimeEnvironmentExtended } from './types';
import axios from 'axios';

const getTenderlyAxiosInstance = (hre: HardhatRuntimeEnvironmentExtended) => {
  return axios.create({
    baseURL: 'https://api.tenderly.co',
    headers: {
      'x-access-key': hre.config.tenderly.accessKey,
    },
  });
};

export const pushToTenderly = async (
  hre: HardhatRuntimeEnvironmentExtended,
  contracts: Array<{ name: string; address: string; networkId: number }>,
): Promise<void> => {
  const { username, project } = hre.config.tenderly;
  try {
    const axiosInstance = getTenderlyAxiosInstance(hre);
    await axiosInstance.post(`/api/v2/accounts/${username}/projects/${project}/contracts`, {
      contracts: contracts.map((contract) => ({
        address: contract.address,
        display_name: contract.name,
        network_id: contract.networkId.toString(),
      })),
    });
  } catch (err) {
    console.error('Error while adding contract(s) to Tenderly', err);
  }
};
