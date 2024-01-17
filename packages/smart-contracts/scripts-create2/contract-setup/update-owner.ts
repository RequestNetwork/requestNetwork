import { safeAdminArtifact } from '../../src/lib';
import { HardhatRuntimeEnvironmentExtended } from '../types';
import { getArtifact } from '../utils';
import { getSignerAndGasFees } from './adminTasks';
import { EvmChains } from '@requestnetwork/currency';
import { Ownable__factory } from '../../src/types';
import { executeContractMethod } from './execute-contract-method';

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
  await Promise.all(
    hre.config.xdeploy.networks.map(async (network: string) => {
      try {
        EvmChains.assertChainSupported(network);
        const contractArtifact = getArtifact(contract);
        const contractAddress = contractArtifact.getAddress(network);
        const { signer, txOverrides } = await getSignerAndGasFees(network, hre);
        const newOwner = safeAdminArtifact.getAddress(network);

        if (!contractAddress) {
          throw new Error(`No deployment for ${contract} on ${network}`);
        }
        if (!newOwner) {
          throw new Error(`No Safe Admin on ${network}`);
        }

        const ownerContract = Ownable__factory.connect(contractAddress, signer);
        const currentOwner = await ownerContract.owner();

        if (currentOwner === newOwner) {
          throw new Error(`Admin of ${contract} is already ${newOwner} on ${network}`);
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
        console.warn(
          `An error occurred during the ownership transfer of ${contract} on ${network}`,
        );
        console.warn(err);
      }
    }),
  );
};
