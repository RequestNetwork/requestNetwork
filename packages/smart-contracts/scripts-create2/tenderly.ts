import { HardhatRuntimeEnvironmentExtended, IDeploymentParams } from './types';
import axios from 'axios';


const getTenderlyAxiosInstance = (hre: HardhatRuntimeEnvironmentExtended,) => {
  return axios.create({
    baseURL: 'https://api.tenderly.co',
    headers: {
      'x-access-key': accessKey,
    },
  })
}
export const pushToTenderly = async (
  hre: HardhatRuntimeEnvironmentExtended,
  contracts: Array<{ name: string; address: string }>,
): Promise<void> => {
  const { username, accessKey, project } = hre.config.tenderly;
  const axiosInstance =
  try {
    const axiosInstance = getTenderlyAxiosInstance(hre);
    for (const contract of contracts) {
      await axiosInstance.post(`/api/v2/accounts/${username}/projects/${project}/contracts`,
        da,
      });
    }
  } catch (err) {
    console.log(err);
  }
};
