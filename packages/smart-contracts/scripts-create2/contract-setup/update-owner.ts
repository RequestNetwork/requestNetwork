import { safeAdminArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getArtifact } from '../utils';
import { getSignerAndGasFees } from './adminTasks';
import { executeContractMethod } from './execute-contract-method';
import { Contract } from 'ethers';

/**
 * Transfer the ownership of a contract from the current owner to the RN Multisig Safe
 * @param contract contract to update
 * @param hre Hardhat runtime environment
 * @param signWithEoa Are transactions to be signed by an EAO
 */
export const updateOwner = async ({
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
      const newOwner = safeAdminArtifact.getAddress(network);

      if (!contractAddress) {
        console.info(`No deployment for ${contract} on ${network}`);
        continue;
      }
      if (!newOwner) {
        console.info(`No Safe Admin on ${network}`);
        continue;
      }

      const ownerContract = new Contract(contractAddress, ownablePartialAbi, signer);
      const currentOwner = await ownerContract.owner();

      if (currentOwner === newOwner) {
        console.info(`Admin of ${contract} is already ${newOwner} on ${network}`);
        continue;
      }

      await executeContractMethod({
        network,
        contract: ownerContract,
        method: 'transferOwnership',
        props: [newOwner],
        txOverrides,
        signer,
        signWithEoa,
      });

      console.log(
        `Ownership of ${contract} transferred from ${signer.address} to ${newOwner} successfully on ${network}`,
      );
    } catch (err) {
      console.warn(`An error occurred during the ownership transfer of ${contract} on ${network}`);
      console.warn(err);
    }
  }
};

const ownablePartialAbi = [
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
