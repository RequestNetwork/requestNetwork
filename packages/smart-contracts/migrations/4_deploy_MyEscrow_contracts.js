const MyEscrow = artifacts.require('./MyEscrow.sol');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');


module.exports = async function (deployer) {
    // Deploys, set up the contracts
    await deployer.deploy(MyEscrow, ERC20FeeProxy.address);
    console.log(`MyEscrow Contract is deployed to: ${MyEscrow.address}`);
    console.log(`ERC20FeeProxy Contract deployed to: ${ERC20FeeProxy.address}`);
  };
