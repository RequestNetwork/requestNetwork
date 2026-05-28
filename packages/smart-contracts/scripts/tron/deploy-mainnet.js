/* eslint-disable no-undef */
/**
 * Tron Mainnet Deployment Script
 *
 * This script deploys the ERC20FeeProxy and ERC20BatchPayments to Tron mainnet.
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

const MAINNET_DEPLOYMENT_PATH = path.join(__dirname, '../../deployments/tron/mainnet.json');

/**
 * Contracts to deploy
 *
 * Comment out the contracts you don't want to deploy.
 */
const CONTRACTS_TO_DEPLOY = [
  //'ERC20FeeProxy',
  'ERC20BatchPayments',
];

if (!PRIVATE_KEY) {
  console.error('Error: TRON_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: MAINNET_FULL_HOST,
  privateKey: PRIVATE_KEY,
});

const ARTIFACTS_DIR = path.join(__dirname, '../../build-tron');

async function loadArtifact(contractName) {
  const artifactPath = path.join(ARTIFACTS_DIR, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}. Run 'yarn tron:compile' first.`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

function loadExistingMainnetDeployment() {
  if (!fs.existsSync(MAINNET_DEPLOYMENT_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(MAINNET_DEPLOYMENT_PATH, 'utf8'));
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

async function deployContractWrapper({
  contractName,
  deployments,
  blockNumbers,
  constructorArgs = [],
}) {
  const contract = await deployContract(contractName, constructorArgs);
  deployments[contractName] = {
    address: contract.address,
    hexAddress: contract.hexAddress,
  };

  // Get block number
  const block = await tronWeb.trx.getCurrentBlock();
  const blockNumber = block.block_header.raw_data.number;
  blockNumbers[contractName] = blockNumber;
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
  const blockNumbers = {};
  const startTime = Date.now();

  try {
    const existingDeployment = loadExistingMainnetDeployment();

    // Deploy ERC20FeeProxy
    if (CONTRACTS_TO_DEPLOY.includes('ERC20FeeProxy')) {
      await deployContractWrapper({ contractName: 'ERC20FeeProxy', deployments, blockNumbers });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Deploy ERC20BatchPayments
    if (CONTRACTS_TO_DEPLOY.includes('ERC20BatchPayments')) {
      const erc20FeeProxyAddress = deployments.ERC20FeeProxy
        ? deployments.ERC20FeeProxy.address
        : existingDeployment.contracts.ERC20FeeProxy.address;

      if (!erc20FeeProxyAddress) {
        console.error(
          'ERC20FeeProxy address not found in deployments/tron/mainnet.json; cannot deploy ERC20BatchPayments',
        );
        process.exit(1);
      }

      console.log('Using ERC20FeeProxy at:', erc20FeeProxyAddress);
      await deployContractWrapper({
        contractName: 'ERC20BatchPayments',
        deployments,
        blockNumbers,
        constructorArgs: [erc20FeeProxyAddress],
      });
    }

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                  MAINNET DEPLOYMENT SUMMARY               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    for (const contractName of Object.keys(deployments)) {
      console.log(`${contractName}:`);
      console.log(`  Address:     ${deployments[contractName].address}`);
      console.log(`  Block:       ${blockNumbers[contractName]}`);
      console.log(
        `  Tronscan:    https://tronscan.org/#/contract/${deployments[contractName].address}`,
      );
    }

    const newContracts = Object.entries(deployments).reduce((acc, [contractName, contract]) => {
      acc[contractName] = {
        ...contract,
        creationBlockNumber: blockNumbers[contractName],
      };
      return acc;
    }, {});

    const contracts = {
      ...(existingDeployment.contracts || {}),
      ...newContracts,
    };

    // Save deployment info (merge with existing mainnet.json)
    const deploymentInfo = {
      network: 'mainnet',
      chainId: '1',
      timestamp: new Date().toISOString(),
      deployer: deployerAddress,
      deploymentDuration: `${(Date.now() - startTime) / 1000}s`,
      contracts,
    };

    fs.mkdirSync(path.dirname(MAINNET_DEPLOYMENT_PATH), { recursive: true });
    fs.writeFileSync(MAINNET_DEPLOYMENT_PATH, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${MAINNET_DEPLOYMENT_PATH}`);

    // Next steps
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                      NEXT STEPS                           ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('1. Verify contract on Tronscan');
    console.log('2. Run verification script: yarn tron:verify:mainnet');
    console.log('3. Update artifact registry with new deployment addresses');
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
