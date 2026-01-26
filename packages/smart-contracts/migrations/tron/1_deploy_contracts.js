/* eslint-disable no-undef */
/**
 * Migration 1: Deploy all contracts for Tron testing
 *
 * Deploys the same set of contracts as the EVM test suite for parity.
 */

const ERC20FeeProxy = artifacts.require('ERC20FeeProxy');
const TestTRC20 = artifacts.require('TestTRC20');
const TRC20NoReturn = artifacts.require('TRC20NoReturn');
const TRC20False = artifacts.require('TRC20False');
const TRC20Revert = artifacts.require('TRC20Revert');
const BadTRC20 = artifacts.require('BadTRC20');
const TRC20True = artifacts.require('TRC20True');

module.exports = async function (deployer, network, accounts) {
  console.log('\n=== Deploying Request Network Contracts to Tron ===\n');
  console.log('Network:', network);
  console.log('Deployer:', accounts[0]);

  // 1. Deploy ERC20FeeProxy (main contract under test)
  await deployer.deploy(ERC20FeeProxy);
  const erc20FeeProxy = await ERC20FeeProxy.deployed();
  console.log('\nERC20FeeProxy deployed at:', erc20FeeProxy.address);

  // 2. Deploy TestTRC20 with 18 decimals (standard test token)
  const initialSupply = '1000000000000000000000000000'; // 1 billion tokens
  await deployer.deploy(TestTRC20, initialSupply, 'Test TRC20', 'TTRC20', 18);
  const testToken = await TestTRC20.deployed();
  console.log('TestTRC20 deployed at:', testToken.address);

  // 3. Deploy BadTRC20 (non-standard token like BadERC20)
  await deployer.deploy(BadTRC20, '1000000000000', 'BadTRC20', 'BAD', 8);
  const badTRC20 = await BadTRC20.deployed();
  console.log('BadTRC20 deployed at:', badTRC20.address);

  // 4. Deploy test token variants for edge case testing (matching EVM tests)
  await deployer.deploy(TRC20True);
  const trc20True = await TRC20True.deployed();
  console.log('TRC20True deployed at:', trc20True.address);

  await deployer.deploy(TRC20NoReturn, initialSupply);
  const trc20NoReturn = await TRC20NoReturn.deployed();
  console.log('TRC20NoReturn deployed at:', trc20NoReturn.address);

  await deployer.deploy(TRC20False);
  const trc20False = await TRC20False.deployed();
  console.log('TRC20False deployed at:', trc20False.address);

  await deployer.deploy(TRC20Revert);
  const trc20Revert = await TRC20Revert.deployed();
  console.log('TRC20Revert deployed at:', trc20Revert.address);

  console.log('\n=== Deployment Complete ===\n');
};
