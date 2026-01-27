/* eslint-disable no-undef */
/**
 * Setup Test Wallet Script
 *
 * This script helps set up your test wallet with TRC20 tokens for testing.
 * It can:
 * 1. Check your TRX and token balances
 * 2. Deploy a test TRC20 token if needed
 *
 * Usage:
 *   node scripts/tron/setup-test-wallet.js
 */

require('dotenv').config();
const TronWeb = require('tronweb');

// Known test tokens on Nile
const KNOWN_TOKENS = {
  USDT: 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj',
  USDC: 'TEMVynQpntMqkPxP6wXTW2K7e4sM5AqmFw',
};

// Simple TRC20 ABI for balance check
const TRC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'who', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
];

async function main() {
  const privateKey = process.env.TRON_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ TRON_PRIVATE_KEY not set in environment or .env file');
    process.exit(1);
  }

  console.log('\n=== Tron Test Wallet Setup ===\n');

  const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    privateKey: privateKey,
  });

  const myAddress = tronWeb.address.fromPrivateKey(privateKey);
  console.log('Wallet Address:', myAddress);
  console.log('Explorer: https://nile.tronscan.org/#/address/' + myAddress);

  // Check TRX balance
  console.log('\n--- TRX Balance ---');
  const trxBalance = await tronWeb.trx.getBalance(myAddress);
  const trxAmount = tronWeb.fromSun(trxBalance);
  console.log('TRX:', trxAmount, 'TRX');

  if (parseFloat(trxAmount) < 10) {
    console.log('⚠️  Low TRX! Get more from: https://nileex.io/join/getJoinPage');
  } else {
    console.log('✅ Sufficient TRX for testing');
  }

  // Check known token balances
  console.log('\n--- TRC20 Token Balances ---');
  for (const [symbol, address] of Object.entries(KNOWN_TOKENS)) {
    try {
      const contract = await tronWeb.contract(TRC20_ABI, address);
      const balance = await contract.balanceOf(myAddress).call();
      const decimals = await contract.decimals().call();
      const formattedBalance = (BigInt(balance) / BigInt(10 ** Number(decimals))).toString();
      console.log(`${symbol}: ${formattedBalance} (${address})`);
    } catch (e) {
      console.log(`${symbol}: Could not fetch (${e.message})`);
    }
  }

  console.log('\n--- Options to Get Test Tokens ---\n');
  console.log('Option 1: Deploy your own test token');
  console.log('  Run: yarn tron:deploy:test-token\n');
  console.log('Option 2: Get tokens from Nile faucets/bridges');
  console.log('  - SunSwap on Nile: https://nile.sunswap.com');
  console.log('  - Some tokens available via test bridges\n');
  console.log('Option 3: Run full test suite (deploys test tokens automatically)');
  console.log('  Run: yarn tron:test:nile');
  console.log('  This will deploy TestTRC20 and run all tests.\n');
}

main().catch(console.error);
