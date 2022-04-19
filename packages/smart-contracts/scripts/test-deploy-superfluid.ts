import deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
import deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
import deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import '@nomiclabs/hardhat-web3';

const errorHandler = (err: any) => {
  if (err) throw err;
};

// Deploys, set up the contracts
export async function deploySuperFluid(hre: HardhatRuntimeEnvironment) {
  let deployer: SignerWithAddress;
  try {
    // get account from hardhat
    [deployer] = await hre.ethers.getSigners();

    // deploy the framework
    await deployFramework(errorHandler, {
      web3: hre.web3,
      from: deployer.address,
    });

    // //deploy a fake erc20 token
    await deployTestToken(errorHandler, [':', 'fDAI'], {
      web3: hre.web3,
      from: deployer.address,
    });

    // deploy a fake erc20 wrapper super token around the fDAI token
    await deploySuperToken(errorHandler, [':', 'fDAI'], {
      web3: hre.web3,
      from: deployer.address,
    });
  } catch (e) {
    console.error(e);
  }
}
