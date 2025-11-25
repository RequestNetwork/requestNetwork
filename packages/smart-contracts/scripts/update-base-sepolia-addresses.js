#!/usr/bin/env node

/**
 * Script to update Base Sepolia contract addresses after deployment
 *
 * Usage:
 *   node scripts/update-base-sepolia-addresses.js \
 *     --erc20-fee-proxy 0x... \
 *     --erc20-fee-proxy-block 123456 \
 *     --escrow-wrapper 0x... \
 *     --escrow-wrapper-block 123457
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
};

const erc20FeeProxyAddress = getArg('--erc20-fee-proxy');
const erc20FeeProxyBlock = getArg('--erc20-fee-proxy-block');
const escrowWrapperAddress = getArg('--escrow-wrapper');
const escrowWrapperBlock = getArg('--escrow-wrapper-block');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   Base Sepolia Address Update Script                     ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

// Validate inputs
if (!erc20FeeProxyAddress || !erc20FeeProxyBlock || !escrowWrapperAddress || !escrowWrapperBlock) {
  console.error('❌ Error: Missing required arguments\n');
  console.log('Usage:');
  console.log('  node scripts/update-base-sepolia-addresses.js \\');
  console.log('    --erc20-fee-proxy 0x... \\');
  console.log('    --erc20-fee-proxy-block 123456 \\');
  console.log('    --escrow-wrapper 0x... \\');
  console.log('    --escrow-wrapper-block 123457\n');
  process.exit(1);
}

console.log('Addresses to update:');
console.log(`  ERC20FeeProxy: ${erc20FeeProxyAddress} (block ${erc20FeeProxyBlock})`);
console.log(`  ERC20CommerceEscrowWrapper: ${escrowWrapperAddress} (block ${escrowWrapperBlock})`);
console.log('');

// Update ERC20FeeProxy artifact
const erc20FeeProxyPath = path.join(__dirname, '../src/lib/artifacts/ERC20FeeProxy/index.ts');

console.log('Updating ERC20FeeProxy artifact...');
let erc20FeeProxyContent = fs.readFileSync(erc20FeeProxyPath, 'utf8');

// Replace placeholder address and block number for base-sepolia
erc20FeeProxyContent = erc20FeeProxyContent.replace(
  /'base-sepolia':\s*\{[\s\S]*?address:\s*'0x0+',[\s\S]*?creationBlockNumber:\s*0,[\s\S]*?\}/,
  `'base-sepolia': {\n          address: '${erc20FeeProxyAddress}',\n          creationBlockNumber: ${erc20FeeProxyBlock},\n        }`,
);

fs.writeFileSync(erc20FeeProxyPath, erc20FeeProxyContent, 'utf8');
console.log('✅ Updated ERC20FeeProxy artifact');

// Update ERC20CommerceEscrowWrapper artifact
const escrowWrapperPath = path.join(
  __dirname,
  '../src/lib/artifacts/ERC20CommerceEscrowWrapper/index.ts',
);

console.log('Updating ERC20CommerceEscrowWrapper artifact...');
let escrowWrapperContent = fs.readFileSync(escrowWrapperPath, 'utf8');

// Replace placeholder address and block number for base-sepolia
escrowWrapperContent = escrowWrapperContent.replace(
  /'base-sepolia':\s*\{[\s\S]*?address:\s*'0x0+',[\s\S]*?creationBlockNumber:\s*0,[\s\S]*?\}/,
  `'base-sepolia': {\n          address: '${escrowWrapperAddress}',\n          creationBlockNumber: ${escrowWrapperBlock},\n        }`,
);

fs.writeFileSync(escrowWrapperPath, escrowWrapperContent, 'utf8');
console.log('✅ Updated ERC20CommerceEscrowWrapper artifact');

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   Update Complete!                                        ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log('📝 Next Steps:');
console.log('');
console.log('1. Rebuild the smart-contracts package:');
console.log('   cd packages/smart-contracts && yarn build');
console.log('');
console.log('2. Verify the addresses on Base Sepolia Explorer:');
console.log(`   ERC20FeeProxy: https://sepolia.basescan.org/address/${erc20FeeProxyAddress}`);
console.log(
  `   ERC20CommerceEscrowWrapper: https://sepolia.basescan.org/address/${escrowWrapperAddress}`,
);
console.log('');
console.log('3. Test the integration with the SDK');
console.log('');
