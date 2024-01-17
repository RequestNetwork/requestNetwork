import { safeAdminArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getArtifact } from '../utils';
import { getSignerAndGasFees } from './adminTasks';
import { EvmChains } from '@requestnetwork/currency';
import { WhitelistAdminRole__factory } from '../../src/types';
import { executeContractMethod } from './execute-contract-method';

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
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network: string) => {
      try {
        EvmChains.assertChainSupported(network);
        const contractArtifact = getArtifact(contract);
        const contractAddress = contractArtifact.getAddress(network);
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const newAdmin = safeAdminArtifact.getAddress(network);

        if (!contractAddress) {
          throw new Error(`No deployment for ${contract} on ${network}`);
        }
        if (!newAdmin) {
          throw new Error(`No Safe Admin on ${network}`);
        }

        const whitelistedRoleContract = WhitelistAdminRole__factory.connect(
          contractAddress,
          signer,
        );
        const isAdmin = await whitelistedRoleContract.isWhitelistAdmin(newAdmin);
        if (isAdmin) {
          throw new Error(` ${newAdmin} is already an Admin of ${contract} on ${network}`);
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
        console.warn(
          `An error occurred during the ownership transfer of ${contract} on ${network}`,
        );
        console.warn(err);
      }
    }),
  );
};
