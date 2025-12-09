import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';

// Contract Addresses by Network
const NETWORK_CONTRACTS: Record<
  string,
  {
    AuthCaptureEscrow: string;
    ERC20FeeProxy?: string;
  }
> = {
  'base-sepolia': {
    AuthCaptureEscrow: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
  },
  sepolia: {
    AuthCaptureEscrow: '0xF81E3F293c92CaCfc0d723d2D8183e39Cc3AEdC7',
    ERC20FeeProxy: '0x399F5EE127ce7432E4921a61b8CF52b0af52cbfE',
  },
};

/**
 * Deploy ERC20CommerceEscrowWrapper using network-specific contracts
 *
 * This script will:
 * 1. Use existing ERC20FeeProxy if available, or deploy a new one
 * 2. Use the official AuthCaptureEscrow contract deployed on the target network
 * 3. Deploy ERC20CommerceEscrowWrapper with the above dependencies
 */
export default async function deployERC20CommerceEscrowWrapper(
  args: any,
  hre: HardhatRuntimeEnvironment,
): Promise<{
  erc20FeeProxyAddress: string;
  authCaptureEscrowAddress: string;
  erc20CommerceEscrowWrapperAddress: string;
}> {
  console.log('\n=== Deploying ERC20CommerceEscrowWrapper and dependencies ===');
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${hre.network.config.chainId}`);

  const signers = await hre.ethers.getSigners();
  if (signers.length === 0) {
    throw new Error(
      'No signers available. Please set DEPLOYMENT_PRIVATE_KEY or ADMIN_PRIVATE_KEY environment variable.',
    );
  }

  const deployer = signers[0];
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployer balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Get network-specific contract addresses
  const networkContracts = NETWORK_CONTRACTS[hre.network.name];
  if (!networkContracts) {
    throw new Error(
      `Network ${hre.network.name} is not configured. Please add contract addresses to NETWORK_CONTRACTS.`,
    );
  }

  let erc20FeeProxyAddress: string;

  // Step 1: Get or Deploy ERC20FeeProxy
  console.log('\n--- Step 1: ERC20FeeProxy ---');
  if (networkContracts.ERC20FeeProxy) {
    // Use existing ERC20FeeProxy
    erc20FeeProxyAddress = networkContracts.ERC20FeeProxy;
    console.log(`✅ Using existing ERC20FeeProxy at: ${erc20FeeProxyAddress}`);
  } else {
    // Deploy ERC20FeeProxy
    const result = await deployOne(args, hre, 'ERC20FeeProxy', {
      verify: true,
    });
    erc20FeeProxyAddress = result.address;
    console.log(`✅ ERC20FeeProxy deployed at: ${erc20FeeProxyAddress}`);
  }

  // Step 2: Use official AuthCaptureEscrow contract
  console.log('\n--- Step 2: Using official AuthCaptureEscrow ---');
  const authCaptureEscrowAddress = networkContracts.AuthCaptureEscrow;
  console.log(`✅ Using official AuthCaptureEscrow at: ${authCaptureEscrowAddress}`);

  // Step 3: Deploy ERC20CommerceEscrowWrapper
  console.log('\n--- Step 3: Deploying ERC20CommerceEscrowWrapper ---');
  const { address: erc20CommerceEscrowWrapperAddress } = await deployOne(
    args,
    hre,
    'ERC20CommerceEscrowWrapper',
    {
      constructorArguments: [authCaptureEscrowAddress, erc20FeeProxyAddress],
      verify: true,
    },
  );
  console.log(`✅ ERC20CommerceEscrowWrapper deployed at: ${erc20CommerceEscrowWrapperAddress}`);

  // Summary
  console.log('\n=== Deployment Summary ===');
  console.log(`Network: ${hre.network.name} (Chain ID: ${hre.network.config.chainId})`);
  console.log(`ERC20FeeProxy: ${erc20FeeProxyAddress}`);
  console.log(`AuthCaptureEscrow (official): ${authCaptureEscrowAddress}`);
  console.log(`ERC20CommerceEscrowWrapper: ${erc20CommerceEscrowWrapperAddress}`);

  // Verification info
  console.log('\n=== Contract Verification ===');
  console.log('ERC20CommerceEscrowWrapper will be automatically verified on the block explorer.');
  console.log('If verification fails, you can manually verify using:');
  console.log(
    `yarn hardhat verify --network ${hre.network.name} ${erc20CommerceEscrowWrapperAddress} ${authCaptureEscrowAddress} ${erc20FeeProxyAddress}`,
  );

  return {
    erc20FeeProxyAddress,
    authCaptureEscrowAddress,
    erc20CommerceEscrowWrapperAddress,
  };
}

// Note: This script should be run via the Hardhat task:
// yarn hardhat deploy-erc20-commerce-escrow-wrapper --network <network-name>
