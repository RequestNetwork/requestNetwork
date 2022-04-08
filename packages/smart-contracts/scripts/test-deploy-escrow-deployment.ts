import '@nomiclabs/hardhat-ethers';
import { Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from '../scripts/deploy-one';

// Deploys, set up the contracts
export async function deployEscrow(hre: HardhatRuntimeEnvironment): Promise<void> {
  const erc20FeeProxyAddress = '0x75c35C980C0d37ef46DF04d31A140b65503c0eEd';
  let deployer: Signer;
  try {
    [deployer] = await hre.ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    // Deploy Escrow contract
    const { address: erc20EscrowToPayAddress } = await deployOne({}, hre, 'ERC20EscrowToPay', {
      constructorArguments: [erc20FeeProxyAddress, deployerAddress],
    });
    console.log(`ERC20EscrowToPay Contract deployed:  ${erc20EscrowToPayAddress}`);

    // ----------------------------------
    console.log(`
    Contracts deployed'
        ERC20EscrowToPay          ${erc20EscrowToPayAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
