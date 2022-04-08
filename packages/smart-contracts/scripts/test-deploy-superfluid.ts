import deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
import deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
import deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { providers } from 'ethers';

const errorHandler = (err: any) => {
  if (err) throw err;
};

// Deploys, set up the contracts
export async function deploySuperFluid(hre: HardhatRuntimeEnvironment) {
  let deployer: SignerWithAddress;
  let provider: providers.Provider;
  try {
    //get account from hardhat
    [deployer] = await hre.ethers.getSigners();
    if (!deployer.provider) {
      throw new Error('undefined provider');
    }
    provider = deployer.provider;

    //deploy the framework
    await deployFramework(errorHandler, {
      provider,
      from: deployer.address,
    });

    //deploy a fake erc20 token
    const fDAIAddress = await deployTestToken(errorHandler, [':', 'fDAI'], {
      provider,
      from: deployer.address,
    });
    console.log(`fDAI Contract deployed:  ${fDAIAddress}`);

    //deploy a fake erc20 wrapper super token around the fDAI token
    const fDAIxAddress = await deploySuperToken(errorHandler, [':', 'fDAI'], {
      provider,
      from: deployer.address,
    });
    console.log(`fDAIx Contract deployed:  ${fDAIxAddress}`);

    // ----------------------------------
    console.log(`
    Contracts deployed
        fDAI           ${fDAIAddress}
        fDAIx          ${fDAIxAddress}
    `);
  } catch (e) {
    console.error(e);
  }
}
