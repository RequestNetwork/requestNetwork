/* eslint-disable no-undef */
/**
 * Tron Mainnet Deployment Script
 *
 * This script deploys the ERC20FeeProxy to Tron mainnet.
 *
 * ⚠️ WARNING: This deploys to MAINNET with real TRX!
 *
 * Prerequisites:
 * 1. TronBox installed globally: npm install -g tronbox
 * 2. TRON_PRIVATE_KEY environment variable set
 * 3. Sufficient TRX in your account for deployment
 * 4. All testnet tests have passed
 *
 * Usage:
 *   TRON_PRIVATE_KEY=your_private_key node scripts/tron/deploy-mainnet.js
 */

const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const MAINNET_FULL_HOST = 'https://api.trongrid.io';
const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;

// Safety check
const CONFIRM_MAINNET = process.env.CONFIRM_MAINNET_DEPLOY === 'true';

if (!PRIVATE_KEY) {
  console.error('Error: TRON_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: MAINNET_FULL_HOST,
  privateKey: PRIVATE_KEY,
});

const ARTIFACTS_DIR = path.join(__dirname, '../build/tron');

async function loadArtifact(contractName) {
  const artifactPath = path.join(ARTIFACTS_DIR, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}. Run 'yarn tron:compile' first.`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

async function confirmDeployment() {
  if (CONFIRM_MAINNET) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: You are about to deploy to TRON MAINNET!');
    console.log('This will use REAL TRX for transaction fees.');
    rl.question('\nType "DEPLOY TO MAINNET" to confirm: ', (answer) => {
      rl.close();
      resolve(answer === 'DEPLOY TO MAINNET');
    });
  });
}

async function deployContract(contractName, constructorArgs = []) {
  console.log(`\nDeploying ${contractName}...`);

  const artifact = await loadArtifact(contractName);

  const contract = await tronWeb.contract().new({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    feeLimit: 1000000000, // 1000 TRX max
    callValue: 0,
    parameters: constructorArgs,
  });

  const base58Address = tronWeb.address.fromHex(contract.address);
  console.log(`${contractName} deployed at: ${base58Address}`);

  return {
    address: base58Address,
    hexAddress: contract.address,
    contract,
  };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       TRON MAINNET DEPLOYMENT                             ║');
  console.log('║                                                           ║');
  console.log('║  ⚠️  CAUTION: MAINNET DEPLOYMENT - REAL TRX REQUIRED     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Get deployer info
  const deployerAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
  console.log('Deployer address:', deployerAddress);

  // Check balance
  const balance = await tronWeb.trx.getBalance(deployerAddress);
  const balanceTRX = balance / 1000000;
  console.log('Deployer balance:', balanceTRX, 'TRX');

  if (balanceTRX < 200) {
    console.error('\n❌ Insufficient TRX balance. Need at least 200 TRX for deployment.');
    process.exit(1);
  }

  // Confirmation
  const confirmed = await confirmDeployment();
  if (!confirmed) {
    console.log('\n❌ Deployment cancelled.');
    process.exit(0);
  }

  console.log('\n🚀 Starting mainnet deployment...\n');

  const deployments = {};
  const startTime = Date.now();

  try {
    // Deploy ERC20FeeProxy only (no test tokens on mainnet)
    const erc20FeeProxy = await deployContract('ERC20FeeProxy');
    deployments.ERC20FeeProxy = {
      address: erc20FeeProxy.address,
      hexAddress: erc20FeeProxy.hexAddress,
    };

    // Get block number
    const block = await tronWeb.trx.getCurrentBlock();
    const blockNumber = block.block_header.raw_data.number;

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                  MAINNET DEPLOYMENT SUMMARY               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('ERC20FeeProxy:');
    console.log(`  Address:     ${deployments.ERC20FeeProxy.address}`);
    console.log(`  Block:       ${blockNumber}`);
    console.log(
      `  Tronscan:    https://tronscan.org/#/contract/${deployments.ERC20FeeProxy.address}`,
    );

    // Save deployment info
    const deploymentInfo = {
      network: 'mainnet',
      chainId: '1',
      timestamp: new Date().toISOString(),
      deployer: deployerAddress,
      deploymentDuration: `${(Date.now() - startTime) / 1000}s`,
      contracts: {
        ERC20FeeProxy: {
          ...deployments.ERC20FeeProxy,
          creationBlockNumber: blockNumber,
        },
      },
    };

    const outputPath = path.join(__dirname, '../deployments/tron/mainnet.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${outputPath}`);

    // Next steps
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                      NEXT STEPS                           ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('1. Verify contract on Tronscan');
    console.log('2. Run verification script: yarn tron:verify:mainnet');
    console.log('3. Update artifact registry in:');
    console.log('   packages/smart-contracts/src/lib/artifacts/ERC20FeeProxy/index.ts');
    console.log('4. Test with a real TRC20 token payment');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ Mainnet deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
