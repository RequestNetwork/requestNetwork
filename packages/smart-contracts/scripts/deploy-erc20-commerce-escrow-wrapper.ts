import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { deployOne } from './deploy-one';
import hre from 'hardhat';

// Base Mainnet & Base Sepolia Contract Addresses
const BASE_SEPOLIA_CONTRACTS = {
  AuthCaptureEscrow: '0xBdEA0D1bcC5966192B070Fdf62aB4EF5b4420cff',
  ERC3009PaymentCollector: '0x0E3dF9510de65469C4518D7843919c0b8C7A7757',
  Permit2PaymentCollector: '0x992476B9Ee81d52a5BdA0622C333938D0Af0aB26',
  PreApprovalPaymentCollector: '0x1b77ABd71FCD21fbe2398AE821Aa27D1E6B94bC6',
  SpendPermissionPaymentCollector: '0x8d9F34934dc9619e5DC3Df27D0A40b4A744E7eAa',
  OperatorRefundCollector: '0x934907bffd0901b6A21e398B9C53A4A38F02fa5d',
};

/**
 * Deploy ERC20CommerceEscrowWrapper using official Base contracts
 *
 * This script will:
 * 1. Deploy ERC20FeeProxy if not already deployed
 * 2. Use the official AuthCaptureEscrow contract deployed on Base Sepolia
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

  // Step 1: Deploy ERC20FeeProxy
  console.log('\n--- Step 1: Deploying ERC20FeeProxy ---');
  const { address: erc20FeeProxyAddress } = await deployOne(args, hre, 'ERC20FeeProxy', {
    verify: true,
  });
  console.log(`✅ ERC20FeeProxy deployed at: ${erc20FeeProxyAddress}`);

  // Step 2: Use official AuthCaptureEscrow contract
  console.log('\n--- Step 2: Using official AuthCaptureEscrow ---');
  const authCaptureEscrowAddress = BASE_SEPOLIA_CONTRACTS.AuthCaptureEscrow;
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

// Allow script to be run directly
if (require.main === module) {
  deployERC20CommerceEscrowWrapper({}, hre)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
