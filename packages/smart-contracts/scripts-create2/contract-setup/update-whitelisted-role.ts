import { safeAdminArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getArtifact } from '../utils';
import { getSignerAndGasFees } from './adminTasks';
import { executeContractMethod } from './execute-contract-method';
import { Contract } from 'ethers';

const whitelistedAdminRolePartialAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'addWhitelistAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'isWhitelistAdmin',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceWhitelistAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Add a new whitelisted admin to a contract, and relinquish the current admin rights
 * @param contract contract to update
 * @param hre Hardhat runtime environment
 * @param signWithEoa Are transactions to be signed by an EAO
 */
export const updateWhitelistedRole = async ({
  contract,
  hre,
  signWithEoa,
}: {
  contract: string;
  hre: HardhatRuntimeEnvironmentExtended;
  signWithEoa: boolean;
}): Promise<void> => {
  for (const network of hre.config.xdeploy.networks) {
    try {
      const contractArtifact = getArtifact(contract);
      const contractAddress = contractArtifact.getAddress(network);
      const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
      const newAdmin = safeAdminArtifact.getAddress(network);

      if (!contractAddress) {
        console.info(`No deployment for ${contract} on ${network}`);
        continue;
      }
      if (!newAdmin) {
        console.info(`No Safe Admin on ${network}`);
        continue;
      }

      const whitelistedRoleContract = new Contract(
        contractAddress,
        whitelistedAdminRolePartialAbi,
        signer,
      );
      const isAdmin = await whitelistedRoleContract.isWhitelistAdmin(newAdmin);
      if (isAdmin) {
        console.info(` ${newAdmin} is already an Admin of ${contract} on ${network}`);
        continue;
      }

      await executeContractMethod({
        network,
        contract: whitelistedRoleContract,
        method: 'addWhitelistAdmin',
        props: [newAdmin],
        txOverrides,
        signer,
        signWithEoa,
      });

      await executeContractMethod({
        network,
        contract: whitelistedRoleContract,
        method: 'renounceWhitelistAdmin',
        props: [],
        txOverrides,
        signer,
        signWithEoa,
      });

      console.log(
        `Ownership of ${contract} transferred from ${signer.address} to ${newAdmin} successfully on ${network}`,
      );
    } catch (err) {
      console.warn(`An error occurred during the ownership transfer of ${contract} on ${network}`);
      console.warn(err);
    }
  }
};
