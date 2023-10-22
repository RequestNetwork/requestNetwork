import { HardhatRuntimeEnvironmentExtended } from './types';
import * as artifacts from '../src/lib/artifacts';
import { ContractArtifact } from '../src/lib';
import { Contract } from 'ethers';
import * as console from 'console';
import axios from 'axios';
import { EvmChainName } from '../src/types';

const getTenderlyAxiosInstance = (hre: HardhatRuntimeEnvironmentExtended) => {
  return axios.create({
    baseURL: 'https://api.tenderly.co',
    headers: {
      'X-Access-Key': hre.config.tenderly.accessKey,
    },
  });
};

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

/**
 * Chains supported by Tenderly.
 * Supported testnet chains are commented out.
 */
const supportedTenderlyChains: EvmChainName[] = [
  'arbitrum-one',
  'arbitrum-rinkeby',
  'avalanche',
  'bsc',
  'fantom',
  'goerli',
  'mainnet',
  'matic',
  'moonbeam',
  'mumbai',
  'optimism',
  'xdai',
];

type TenderlyContract = { address: string; chainId: number };

const getTenderlyContractId = (c: TenderlyContract) =>
  `eth:${c.chainId}:${c.address.toLowerCase()}`;

export const tenderlyImportAll = async (hre: HardhatRuntimeEnvironmentExtended): Promise<void> => {
  try {
    // import ES Module in CommonJS
    const { EvmChains } = await import('@requestnetwork/currency');
    const { username, project } = hre.config.tenderly;
    const contracts: Record<string, { name: string } & TenderlyContract> = {};
    const mainnetContracts: Set<string> = new Set();
    const testnetContracts: Set<string> = new Set();
    const versions: Record<string, Set<string>> = {};
    for (const artifactName in artifacts) {
      const artifact = (artifacts as any)[artifactName] as ContractArtifact<Contract>;
      const deployments = artifact.getAllAddressesFromAllNetworks();
      for (const deployment of deployments) {
        const { networkName, address, version } = deployment;
        try {
          EvmChains.assertChainSupported(networkName);
        } catch {
          continue;
        }
        if (!supportedTenderlyChains.includes(networkName)) continue;
        const chainId = EvmChains.getChainId(networkName);
        const contract: TenderlyContract = {
          address,
          chainId,
        };
        const contractId = getTenderlyContractId(contract);
        contracts[contractId] = {
          name: capitalizeFirstLetter(artifactName.replace(/Artifact/i, '')),
          ...contract,
        };
        versions[version] ??= new Set();
        versions[version].add(contractId);
        (EvmChains.isTestnet(networkName) ? testnetContracts : mainnetContracts).add(contractId);
      }
    }
    console.log(`> Retrieved ${Object.keys(contracts).length} contracts from protocol artifacts`);

    console.log(`> Syncing contracts with Tenderly...`);
    const axiosInstance = getTenderlyAxiosInstance(hre);
    await axiosInstance.post(`/api/v2/accounts/${username}/projects/${project}/contracts`, {
      contracts: Object.values(contracts).map((contract) => ({
        address: contract.address,
        display_name: contract.name,
        network_id: contract.chainId.toString(),
      })),
    });
    console.log('  ✔ done');

    console.log(`> Adding version tags to contracts...`);
    for (const version in versions) {
      await axiosInstance.post(`/api/v1/account/${username}/project/${project}/tag`, {
        contract_ids: Array.from(versions[version]),
        tag: `v${version}`,
      });
    }
    console.log('  ✔ done');

    console.log(`> Adding mainnet/testnet tags to contracts...`);
    await axiosInstance.post(`/api/v1/account/${username}/project/${project}/tag`, {
      contract_ids: Array.from(mainnetContracts),
      tag: 'mainnet',
    });
    await axiosInstance.post(`/api/v1/account/${username}/project/${project}/tag`, {
      contract_ids: Array.from(testnetContracts),
      tag: 'testnet',
    });
    console.log('  ✔ done');
  } catch (err) {
    console.error('Error while adding contract(s) to Tenderly', err.response?.data || err);
  }
};
