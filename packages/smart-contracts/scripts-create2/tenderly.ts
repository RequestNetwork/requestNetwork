import { HardhatRuntimeEnvironmentExtended } from './types';
import * as artifacts from '../src/lib/artifacts';
import { ContractArtifact } from '../src/lib';
import { Contract } from 'ethers';
import * as console from 'console';
import { ChainTypes } from '@requestnetwork/types';
import { ChainManager } from '@requestnetwork/chain';

const tenderlyBaseURL = 'https://api.tenderly.co';
const makeTenderlyClient =
  (hre: HardhatRuntimeEnvironmentExtended) => async (path: string, body: unknown) => {
    const response = await fetch([tenderlyBaseURL, path].join('/'), {
      method: 'POST',
      headers: {
        'X-Access-Key': hre.config.tenderly.accessKey,
      },
      body: JSON.stringify(body),
    });
    return await response.json();
  };

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1);

/**
 * Chains supported by Tenderly.
 * Supported testnet chains are commented out.
 */
const supportedTenderlyChains: ChainTypes.IEvmChain[] = [
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
  'rinkeby',
  'xdai',
].map((chainName: string) =>
  ChainManager.current().fromName(chainName, [ChainTypes.ECOSYSTEM.EVM]),
);

type TenderlyContract = { address: string; chainId: number };

const getTenderlyContractId = (c: TenderlyContract) =>
  `eth:${c.chainId}:${c.address.toLowerCase()}`;

export const tenderlyImportAll = async (hre: HardhatRuntimeEnvironmentExtended): Promise<void> => {
  try {
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
        let deploymentChain: ChainTypes.IEvmChain;
        try {
          deploymentChain = ChainManager.current().fromName(networkName, [
            ChainTypes.ECOSYSTEM.EVM,
          ]);
        } catch {
          continue;
        }
        const chain = supportedTenderlyChains.find((tenderlyChain) =>
          tenderlyChain.eq(deploymentChain),
        );
        if (!chain) continue;
        const chainId = parseInt(chain.id);
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
        (chain.testnet ? testnetContracts : mainnetContracts).add(contractId);
      }
    }
    console.log(`> Retrieved ${Object.keys(contracts).length} contracts from protocol artifacts`);

    console.log(`> Syncing contracts with Tenderly...`);
    const tenderly = makeTenderlyClient(hre);
    await tenderly(`/api/v2/accounts/${username}/projects/${project}/contracts`, {
      contracts: Object.values(contracts).map((contract) => ({
        address: contract.address,
        display_name: contract.name,
        network_id: contract.chainId.toString(),
      })),
    });
    console.log('  ✔ done');

    console.log(`> Adding version tags to contracts...`);
    for (const version in versions) {
      await tenderly(`/api/v1/account/${username}/project/${project}/tag`, {
        contract_ids: Array.from(versions[version]),
        tag: `v${version}`,
      });
    }
    console.log('  ✔ done');

    console.log(`> Adding mainnet/testnet tags to contracts...`);
    await tenderly(`/api/v1/account/${username}/project/${project}/tag`, {
      contract_ids: Array.from(mainnetContracts),
      tag: 'mainnet',
    });
    await tenderly(`/api/v1/account/${username}/project/${project}/tag`, {
      contract_ids: Array.from(testnetContracts),
      tag: 'testnet',
    });
    console.log('  ✔ done');
  } catch (err) {
    console.error('Error while adding contract(s) to Tenderly', err.response?.data || err);
  }
};
