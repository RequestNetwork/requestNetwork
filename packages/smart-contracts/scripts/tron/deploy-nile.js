/**
 * Tron Nile Testnet Deployment Script
 *
 * This script deploys the ERC20FeeProxy and related contracts to Tron's Nile testnet.
 *
 * Prerequisites:
 * 1. TronBox installed globally: npm install -g tronbox
 * 2. TRON_PRIVATE_KEY environment variable set
 * 3. Nile testnet TRX in your account (get from faucet: https://nileex.io/join/getJoinPage)
 *
 * Usage:
 *   TRON_PRIVATE_KEY=your_private_key node scripts/tron/deploy-nile.js
 */

const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');

// Configuration
const NILE_FULL_HOST = 'https://nile.trongrid.io';
const PRIVATE_KEY = process.env.TRON_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Error: TRON_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

// Initialize TronWeb
const tronWeb = new TronWeb({
  fullHost: NILE_FULL_HOST,
  privateKey: PRIVATE_KEY,
});

// Contract artifacts paths
const ARTIFACTS_DIR = path.join(__dirname, '../../build-tron');

async function loadArtifact(contractName) {
  const artifactPath = path.join(ARTIFACTS_DIR, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}. Run 'yarn tron:compile' first.`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
}

async function deployContract(contractName, constructorArgs = []) {
  console.log(`\nDeploying ${contractName}...`);

  const artifact = await loadArtifact(contractName);

  // Create the contract
  const contract = await tronWeb.contract().new({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    feeLimit: 1000000000, // 1000 TRX max
    callValue: 0,
    parameters: constructorArgs,
  });

  const base58Address = tronWeb.address.fromHex(contract.address);
  const block = await tronWeb.trx.getCurrentBlock();
  const creationBlockNumber = block.block_header.raw_data.number;

  console.log(`${contractName} deployed at: ${contract.address}`);
  console.log(`Base58 address: ${base58Address}`);
  console.log(`Block: ${creationBlockNumber}`);

  return {
    address: base58Address,
    hexAddress: contract.address,
    creationBlockNumber,
  };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       TRON NILE TESTNET DEPLOYMENT                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const deployerAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
  console.log('Deployer address:', deployerAddress);

  // Check balance
  const balance = await tronWeb.trx.getBalance(deployerAddress);
  console.log('Deployer balance:', balance / 1000000, 'TRX');

  if (balance < 100000000) {
    // 100 TRX minimum
    console.warn(
      '\n⚠️  Warning: Low TRX balance. Get testnet TRX from: https://nileex.io/join/getJoinPage',
    );
  }

  const deployments = {};

  try {
    // 1. Deploy ERC20FeeProxy
    deployments.ERC20FeeProxy = await deployContract('ERC20FeeProxy');

    // 2. Deploy ERC20BatchPayments
    deployments.ERC20BatchPayments = await deployContract('ERC20BatchPayments', [
      deployments.ERC20FeeProxy.address,
    ]);

    // 3. Deploy TestTRC20 for testing
    deployments.TestTRC20 = await deployContract('TestTRC20', [
      '1000000000000000000000000000', // 1 billion tokens
      'Nile Test TRC20',
      'NTRC20',
      18,
    ]);

    // 4. Deploy test token variants
    deployments.TRC20NoReturn = await deployContract('TRC20NoReturn', [
      '1000000000000000000000000000',
    ]);

    // Print summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                  DEPLOYMENT SUMMARY                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    for (const [name, info] of Object.entries(deployments)) {
      console.log(`${name}:`);
      console.log(`  Base58: ${info.address}`);
      console.log(`  Hex:    ${info.hexAddress}`);
      console.log(`  Block:  ${info.creationBlockNumber}`);
    }

    // Save deployment info
    const deploymentInfo = {
      network: 'nile',
      chainId: '3',
      timestamp: new Date().toISOString(),
      deployer: deployerAddress,
      contracts: deployments,
    };

    const outputPath = path.join(__dirname, '../../deployments/tron/nile.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\nDeployment info saved to: ${outputPath}`);

    // Verification instructions
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                  VERIFICATION STEPS                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    console.log('1. Verify contracts on Nile Tronscan:');
    console.log('   https://nile.tronscan.org/#/contract/' + deployments.ERC20FeeProxy.address);
    console.log(
      '   https://nile.tronscan.org/#/contract/' + deployments.ERC20BatchPayments.address,
    );
    console.log('\n2. Run tests against deployed contracts:');
    console.log('   TRON_PRIVATE_KEY=... yarn tron:test:nile');
    console.log('\n3. Update artifact registry with deployment addresses');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ Deployment completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });
