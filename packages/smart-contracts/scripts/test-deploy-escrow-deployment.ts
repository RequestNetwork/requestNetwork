import '@nomiclabs/hardhat-ethers';
import { Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from '../scripts/deploy-one';

// Deploys, set up the contracts
export async function deployEscrow(
  hre: HardhatRuntimeEnvironment,
  mainPaymentAddresses: any,
): Promise<void> {
  let deployer: Signer;
  try {
    [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    // Deploy Escrow contract
    const { address: erc20EscrowToPayAddress } = await deployOne({}, hre, 'ERC20EscrowToPay', {
      constructorArguments: [mainPaymentAddresses.ERC20FeeProxyAddress, deployerAddress],
    });

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      ERC20EscrowToPay:         ${erc20EscrowToPayAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
