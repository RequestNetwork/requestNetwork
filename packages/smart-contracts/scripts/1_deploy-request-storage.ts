import { HardhatRuntimeEnvironment } from 'hardhat/types';

const addressBurnerContract = '0xfCb4393e7fAef06fAb01c00d67c1895545AfF3b8';

// Deploys, set up the contracts
export default async function deploy(_args: any, hre: HardhatRuntimeEnvironment) {
  try {
    const [deployer, recipient] = await hre.ethers.getSigners();
    // Not used, only useful to keep the same addresses as with Truffle
    const uselessInstance = await (await hre.ethers.getContractFactory('TestERC20')).deploy('100');
    await uselessInstance.transfer(recipient.address, 10);

    // Deploy the contract RequestHashStorage
    const RequestHashStorage__factory = await hre.ethers.getContractFactory(
      'RequestHashStorage',
      deployer,
    );
    const RequestHashStorage = await RequestHashStorage__factory.deploy();
    console.log('RequestHashStorage Contract deployed: ' + RequestHashStorage.address);

    // Deploy the contract RequestOpenHashSubmitter
    const RequestOpenHashSubmitter__factory = await hre.ethers.getContractFactory(
      'RequestOpenHashSubmitter',
      deployer,
    );
    const RequestOpenHashSubmitter = await RequestOpenHashSubmitter__factory.deploy(
      RequestHashStorage.address,
      addressBurnerContract,
    );
    console.log('RequestOpenHashSubmitter Contract deployed: ' + RequestOpenHashSubmitter.address);

    // Whitelist the requestSubmitter in requestHashDeclaration
    await RequestHashStorage.addWhitelisted(RequestOpenHashSubmitter.address);
    console.log('requestSubmitter Whitelisted in requestHashDeclaration');

    // ----------------------------------
    console.log('Contracts deployed');
    console.log(`
      RequestHashStorage:       ${RequestHashStorage.address}
      RequestOpenHashSubmitter: ${RequestOpenHashSubmitter.address}
      `);
  } catch (e) {
    console.error(e);
  }
}
