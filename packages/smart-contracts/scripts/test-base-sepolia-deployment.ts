import { ethers } from 'ethers';

/**
 * Test script to demonstrate Base Sepolia deployment
 * This script creates a temporary wallet and shows the deployment process
 */
async function testBaseSepolia() {
  console.log('=== Base Sepolia Deployment Test ===\n');

  // Generate a random wallet for demonstration
  const wallet = ethers.Wallet.createRandom();
  console.log('🔑 Generated test wallet:');
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey}`);
  console.log('   ⚠️  This is a test wallet - do not use for real funds!\n');

  // Connect to Base Sepolia
  const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org');
  const connectedWallet = wallet.connect(provider);

  try {
    const balance = await connectedWallet.getBalance();
    console.log(`💰 Wallet balance: ${ethers.utils.formatEther(balance)} ETH`);

    if (balance.eq(0)) {
      console.log('\n📝 To deploy to Base Sepolia:');
      console.log('1. Fund this address with Base Sepolia ETH from a faucet:');
      console.log('   - https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
      console.log('   - https://sepoliafaucet.com/');
      console.log('\n2. Set environment variable:');
      console.log(`   export DEPLOYMENT_PRIVATE_KEY=${wallet.privateKey.slice(2)}`);
      console.log('\n3. Run deployment:');
      console.log('   yarn hardhat deploy-erc20-commerce-escrow-wrapper --network base-sepolia');
    } else {
      console.log('\n✅ Wallet has funds! You can proceed with deployment.');
    }
  } catch (error) {
    console.log('❌ Could not connect to Base Sepolia RPC');
    console.log('   Make sure you have internet connection');
  }

  console.log('\n=== Network Information ===');
  console.log('Network: Base Sepolia');
  console.log('Chain ID: 84532');
  console.log('RPC URL: https://sepolia.base.org');
  console.log('Explorer: https://sepolia.basescan.org/');
  console.log('Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
}

testBaseSepolia()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
