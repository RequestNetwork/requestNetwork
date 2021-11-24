import '@nomiclabs/hardhat-ethers';
import { Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';



// Deploys, set up the contracts
export async function deployEscrow(hre: HardhatRuntimeEnvironment) {
  const erc20FeeProxyAddress = "0x75c35C980C0d37ef46DF04d31A140b65503c0eEd";
  let deployer: Signer;
  let erc20EscrowToPayAddress: string;
  try {
    [deployer] = await hre.ethers.getSigners();
    
    const erc20EscrowToPay = await (
      await hre.ethers.getContractFactory('ERC20EscrowToPay', deployer)
    ).deploy(erc20FeeProxyAddress);
    // Deploy Escrow contract 

  
    erc20EscrowToPayAddress = erc20EscrowToPay.address;

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
