import '@nomiclabs/hardhat-ethers';
import { Signer, Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  ERC20EscrowToPay__factory,
} from '../src/types';


// Deploys, set up the contracts
export async function deployEscrow(hre: HardhatRuntimeEnvironment) {
  const erc20FeeProxyAddress = "0x75c35C980C0d37ef46DF04d31A140b65503c0eEd";
  let erc20EscrowToPay: Contract;
  let deployer: Signer;
  let erc20EscrowToPayAddress: string;
  try {
    [deployer] = await hre.ethers.getSigners();

    // Deploy Escrow contract 
    erc20EscrowToPay = await new ERC20EscrowToPay__factory(deployer).deploy(erc20FeeProxyAddress);
  
    erc20EscrowToPayAddress = erc20EscrowToPay.address;

    console.log(`ERC20EscrowToPay Contract deployed:  ${erc20EscrowToPayAddress}`);

    // ----------------------------------
    console.log(`
    Contracts deployed'
        ERC20FeeProxy             ${erc20FeeProxyAddress}
        ERC20EscrowToPay          ${erc20EscrowToPayAddress}
    `);
    
  } catch (e) {
    console.error(e);
  }
}
