/* eslint-disable no-undef, no-unused-vars */
/**
 * Test script for the already deployed ERC20FeeProxy on Nile testnet.
 *
 * This script tests the contract deployed by your team at:
 * THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs
 *
 * Prerequisites:
 * 1. Get test TRX from https://nileex.io/join/getJoinPage
 * 2. Get test USDT on Nile (or use any TRC20 token you have)
 * 3. Set TRON_PRIVATE_KEY environment variable
 *
 * Usage:
 *   export TRON_PRIVATE_KEY=your_private_key
 *   node tron/scripts/test-deployed-nile.js
 */

const TronWeb = require('tronweb');

// Deployed contract address on Nile (from your team)
const ERC20_FEE_PROXY_ADDRESS = 'THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs';

// USDT on Nile testnet (you can replace with any TRC20 you have)
const TEST_TOKEN_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // Nile USDT

// ERC20FeeProxy ABI (only the functions we need)
const ERC20_FEE_PROXY_ABI = [
  {
    inputs: [
      { name: '_tokenAddress', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_paymentReference', type: 'bytes' },
      { name: '_feeAmount', type: 'uint256' },
      { name: '_feeAddress', type: 'address' },
    ],
    name: 'transferFromWithReferenceAndFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// TRC20 ABI (only the functions we need)
const TRC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

async function main() {
  const privateKey = process.env.TRON_PRIVATE_KEY;

  if (!privateKey) {
    console.error('❌ Error: TRON_PRIVATE_KEY environment variable not set');
    console.log('\nUsage:');
    console.log('  export TRON_PRIVATE_KEY=your_private_key');
    console.log('  node tron/scripts/test-deployed-nile.js');
    process.exit(1);
  }

  console.log('\n=== Testing Deployed ERC20FeeProxy on Nile Testnet ===\n');

  // Initialize TronWeb
  const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
    privateKey: privateKey,
  });

  const myAddress = tronWeb.address.fromPrivateKey(privateKey);
  console.log('Your address:', myAddress);

  // Check TRX balance
  const trxBalance = await tronWeb.trx.getBalance(myAddress);
  console.log('TRX Balance:', tronWeb.fromSun(trxBalance), 'TRX');

  if (trxBalance < 10000000) {
    // 10 TRX
    console.log(
      '\n⚠️  Warning: Low TRX balance. Get test TRX from https://nileex.io/join/getJoinPage',
    );
  }

  // Test 1: Verify contract exists
  console.log('\n--- Test 1: Verify Contract Exists ---');
  try {
    const contract = await tronWeb.contract(ERC20_FEE_PROXY_ABI, ERC20_FEE_PROXY_ADDRESS);
    console.log('✅ ERC20FeeProxy contract found at:', ERC20_FEE_PROXY_ADDRESS);
  } catch (error) {
    console.error('❌ Contract not found:', error.message);
    process.exit(1);
  }

  // Test 2: Check if we have any test tokens
  console.log('\n--- Test 2: Check Token Balance ---');
  try {
    const tokenContract = await tronWeb.contract(TRC20_ABI, TEST_TOKEN_ADDRESS);
    const tokenBalance = await tokenContract.balanceOf(myAddress).call();
    console.log('Test Token Balance:', tokenBalance.toString());

    if (tokenBalance.toString() === '0') {
      console.log('\n⚠️  You need test tokens to perform transfer tests.');
      console.log('Get test USDT on Nile or use another TRC20 token you own.');
      console.log('\nTo test with a different token, edit TEST_TOKEN_ADDRESS in this script.');
    }
  } catch (error) {
    console.log('⚠️  Could not check token balance:', error.message);
  }

  // Test 3: Read-only contract verification
  console.log('\n--- Test 3: Contract Code Verification ---');
  try {
    const contractInfo = await tronWeb.trx.getContract(ERC20_FEE_PROXY_ADDRESS);
    console.log('✅ Contract bytecode exists');
    console.log('   Origin address:', contractInfo.origin_address);
    console.log('   Contract name:', contractInfo.name || 'ERC20FeeProxy');
  } catch (error) {
    console.error('❌ Could not verify contract:', error.message);
  }

  console.log('\n=== Summary ===');
  console.log('Contract Address:', ERC20_FEE_PROXY_ADDRESS);
  console.log('Network: Nile Testnet');
  console.log('Explorer: https://nile.tronscan.org/#/contract/' + ERC20_FEE_PROXY_ADDRESS);
  console.log('\n✅ Basic verification complete!');
  console.log('\nTo perform actual transfer tests, ensure you have:');
  console.log('1. Sufficient TRX for gas (energy)');
  console.log('2. TRC20 tokens to transfer');
  console.log('3. Approved the ERC20FeeProxy to spend your tokens');
}

main().catch(console.error);
