/**
 * TronBox Configuration for Request Network Smart Contracts
 *
 * This configuration enables deployment and testing of Request Network
 * payment proxy contracts on the Tron blockchain.
 */

require('dotenv').config();

module.exports = {
  networks: {
    // Local development network (requires tronbox develop or local node)
    development: {
      privateKey:
        process.env.TRON_PRIVATE_KEY ||
        'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
      userFeePercentage: 100,
      feeLimit: 1000000000,
      fullHost: 'http://127.0.0.1:9090',
      network_id: '*',
    },

    // Shasta Testnet
    shasta: {
      privateKey: process.env.TRON_PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1000000000,
      fullHost: 'https://api.shasta.trongrid.io',
      network_id: '2',
    },

    // Nile Testnet (recommended for testing)
    nile: {
      privateKey: process.env.TRON_PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1000000000,
      fullHost: 'https://nile.trongrid.io',
      network_id: '3',
    },

    // Tron Mainnet
    mainnet: {
      privateKey: process.env.TRON_PRIVATE_KEY,
      userFeePercentage: 100,
      feeLimit: 1000000000,
      fullHost: 'https://api.trongrid.io',
      network_id: '1',
    },
  },

  compilers: {
    solc: {
      version: '0.8.6',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },

  // Contract build directory - Tron builds go under build/tron alongside Hardhat builds
  // Tron-specific contracts are in src/contracts/tron/ alongside the main contracts
  contracts_directory: './src/contracts/tron',
  contracts_build_directory: './build/tron',
  migrations_directory: './migrations/tron',
  test_directory: './test/tron',

  // Mocha configuration for tests
  mocha: {
    timeout: 120000, // 2 minutes per test (needed for QEMU emulation)
  },
};
