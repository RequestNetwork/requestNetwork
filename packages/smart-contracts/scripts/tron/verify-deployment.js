/* eslint-disable no-undef */
/**
 * Tron Deployment Verification Script
 *
 * Verifies that deployed contracts are working correctly on Tron testnet/mainnet.
 *
 * Usage:
 *   TRON_PRIVATE_KEY=your_key TRON_NETWORK=nile node tron/scripts/verify-deployment.js
 */

const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');

// Network configuration
const NETWORKS = {
  nile: 'https://nile.trongrid.io',
  mainnet: 'https://api.trongrid.io',
  shasta: 'https://api.shasta.trongrid.io',
};

const NETWORK = process.env.TRON_NETWORK || 'nile';
const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Error: TRON_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

const tronWeb = new TronWeb({
  fullHost: NETWORKS[NETWORK],
  privateKey: PRIVATE_KEY,
});

async function loadDeployment(network) {
  const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }
  return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

async function loadArtifact(contractName) {
  const artifactPath = path.join(__dirname, `../../tron-build/${contractName}.json`);
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

async function verifyContract(name, address, abi) {
  console.log(`\nVerifying ${name} at ${address}...`);

  try {
    // Check if contract exists (instantiation verifies ABI compatibility)
    await tronWeb.contract(abi, address);

    // For ERC20FeeProxy, we don't have view functions to call
    // But we can verify the contract code exists
    const account = await tronWeb.trx.getAccount(address);
    if (account && account.type === 'Contract') {
      console.log(`  ✅ Contract exists and is deployed`);
      return true;
    } else {
      console.log(`  ❌ Address is not a contract`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Verification failed: ${error.message}`);
    return false;
  }
}

async function testPayment(erc20FeeProxyAddress, tokenAddress, abi) {
  console.log('\n--- Testing Payment Flow ---');

  const deployerAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
  const testPayee = 'TKNZz2JNAiPepkQkWcCvh7YgWWCfwLxPNY'; // Example testnet address

  try {
    const erc20FeeProxy = await tronWeb.contract(abi, erc20FeeProxyAddress);
    const tokenArtifact = await loadArtifact('TestTRC20');
    const token = await tronWeb.contract(tokenArtifact.abi, tokenAddress);

    // Check token balance
    const balance = await token.balanceOf(deployerAddress).call();
    console.log(`Token balance: ${balance.toString()}`);

    if (BigInt(balance.toString()) < BigInt('1000000000000000000')) {
      console.log('Insufficient token balance for test');
      return false;
    }

    // Approve proxy
    console.log('Approving ERC20FeeProxy...');
    const approveTx = await token.approve(erc20FeeProxyAddress, '1000000000000000000').send({
      feeLimit: 100000000,
    });
    console.log(`Approval tx: ${approveTx}`);

    // Wait for confirmation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Execute payment
    console.log('Executing payment...');
    const payTx = await erc20FeeProxy
      .transferFromWithReferenceAndFee(
        tokenAddress,
        testPayee,
        '100000000000000000', // 0.1 tokens
        '0xtest',
        '10000000000000000', // 0.01 fee
        deployerAddress, // fee to self for testing
      )
      .send({
        feeLimit: 100000000,
      });
    console.log(`Payment tx: ${payTx}`);

    // Verify transaction
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const txInfo = await tronWeb.trx.getTransactionInfo(payTx);

    if (txInfo && txInfo.receipt && txInfo.receipt.result === 'SUCCESS') {
      console.log('✅ Payment successful!');
      return true;
    } else {
      console.log('❌ Payment failed');
      console.log('Receipt:', txInfo && txInfo.receipt);
      return false;
    }
  } catch (error) {
    console.log(`❌ Payment test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log(`║       TRON ${NETWORK.toUpperCase()} DEPLOYMENT VERIFICATION             ║`);
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const deployment = await loadDeployment(NETWORK);
  console.log('Deployment timestamp:', deployment.timestamp);
  console.log('Deployer:', deployment.deployer);

  const results = {
    passed: 0,
    failed: 0,
  };

  // Verify each contract
  for (const [name, info] of Object.entries(deployment.contracts)) {
    const artifact = await loadArtifact(name);
    const passed = await verifyContract(name, info.address, artifact.abi);
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Run payment test if ERC20FeeProxy is verified
  if (deployment.contracts.ERC20FeeProxy && deployment.contracts.TestTRC20) {
    const erc20FeeProxyArtifact = await loadArtifact('ERC20FeeProxy');
    const paymentPassed = await testPayment(
      deployment.contracts.ERC20FeeProxy.address,
      deployment.contracts.TestTRC20.address,
      erc20FeeProxyArtifact.abi,
    );
    if (paymentPassed) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                  VERIFICATION SUMMARY                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  return results.failed === 0;
}

main()
  .then((success) => {
    if (success) {
      console.log('\n✅ All verifications passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some verifications failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
