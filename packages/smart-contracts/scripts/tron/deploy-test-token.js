/* eslint-disable no-undef */
/**
 * Deploy Test TRC20 Token to Nile Testnet
 *
 * This script deploys a test TRC20 token that you can use for testing
 * the ERC20FeeProxy contract.
 *
 * Usage:
 *   node scripts/tron/deploy-test-token.js
 */

require('dotenv').config();
const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');

async function main() {
  const privateKey = process.env.TRON_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ TRON_PRIVATE_KEY not set');
    process.exit(1);
  }

  console.log('\n=== Deploying Test TRC20 Token to Nile ===\n');

  const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    privateKey: privateKey,
  });

  const myAddress = tronWeb.address.fromPrivateKey(privateKey);
  console.log('Deployer:', myAddress);

  // Check TRX balance
  const trxBalance = await tronWeb.trx.getBalance(myAddress);
  console.log('TRX Balance:', tronWeb.fromSun(trxBalance), 'TRX');

  if (trxBalance < 100000000) {
    // 100 TRX
    console.error('❌ Insufficient TRX. Need at least 100 TRX for deployment.');
    console.log('Get TRX from: https://nileex.io/join/getJoinPage');
    process.exit(1);
  }

  // Load compiled contract
  const buildPath = path.join(__dirname, '../../tron/build/TestTRC20.json');

  if (!fs.existsSync(buildPath)) {
    console.error('❌ Contract not compiled. Run: yarn tron:compile');
    process.exit(1);
  }

  const contractJson = JSON.parse(fs.readFileSync(buildPath, 'utf8'));

  console.log('\nDeploying TestTRC20...');

  try {
    // Deploy with initial supply of 1 billion tokens (18 decimals)
    const initialSupply = '1000000000000000000000000000'; // 10^27 = 1 billion * 10^18

    const tx = await tronWeb.transactionBuilder.createSmartContract(
      {
        abi: contractJson.abi,
        bytecode: contractJson.bytecode,
        feeLimit: 1000000000,
        callValue: 0,
        userFeePercentage: 100,
        originEnergyLimit: 10000000,
        parameters: [initialSupply, 'Test TRC20', 'TTRC20', 18],
      },
      myAddress,
    );

    const signedTx = await tronWeb.trx.sign(tx, privateKey);
    const result = await tronWeb.trx.sendRawTransaction(signedTx);

    if (result.result) {
      console.log('✅ Transaction sent:', result.txid);
      console.log('\nWaiting for confirmation...');

      // Wait for confirmation
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const txInfo = await tronWeb.trx.getTransactionInfo(result.txid);

      if (txInfo && txInfo.contract_address) {
        const contractAddress = tronWeb.address.fromHex(txInfo.contract_address);
        console.log('\n=== Deployment Successful ===');
        console.log('Token Address:', contractAddress);
        console.log('Transaction:', result.txid);
        console.log('Explorer: https://nile.tronscan.org/#/contract/' + contractAddress);

        // Save to file
        const deploymentInfo = {
          network: 'nile',
          token: {
            name: 'Test TRC20',
            symbol: 'TTRC20',
            decimals: 18,
            address: contractAddress,
            txid: result.txid,
            deployedAt: new Date().toISOString(),
          },
        };

        const outputPath = path.join(__dirname, '../../deployments/tron/nile-test-token.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
        console.log('\nDeployment info saved to:', outputPath);

        console.log('\n=== Next Steps ===');
        console.log('Your wallet now has 1 billion TTRC20 tokens!');
        console.log('Run the test suite: yarn tron:test:nile');
      } else {
        console.log('⚠️  Contract deployed but address not yet available.');
        console.log('Check transaction:', 'https://nile.tronscan.org/#/transaction/' + result.txid);
      }
    } else {
      console.error('❌ Transaction failed:', result);
    }
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
  }
}

main().catch(console.error);
