const hre = require("hardhat");

async function main() {

  // We get the contract to deploy
  const TestERC20 = await hre.ethers.getContractFactory("TestERC20");
  const ERC20FeeProxy = await hre.ethers.getContractFactory("ERC20FeeProxy");
  const MyEscrow = await hre.ethers.getContractFactory("MyEscrow");
  
  const instanceTestERC20 = await TestERC20.deploy();
  const instanceERC20FeeProxy = await ERC20FeeProxy.deploy();
  const instanceMyEscrow = await MyEscrow.deploy(instanceERC20FeeProxy.address);
  
  await instanceTestERC20.deployed();
  await instanceERC20FeeProxy.deployed();
  await instanceMyEscrow.deployed();
  
  console.log("------ Deployment status ------")
  console.log(`

    TestERC20:                      ${instanceTestERC20.address},
    IERC20FeeProxy deployed to:     ${instanceERC20FeeProxy.address},
    MyEscrow deployed to:           ${instanceMyEscrow.address} 
  `);
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
