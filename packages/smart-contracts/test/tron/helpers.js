const INITIAL_SUPPLY = '10000000000';

const REF_A = '0xaaaa';
const REF_B = '0xbbbb';
const REF_C = '0xcccc';

/** Tron base58 zero address (unset EthFeeProxy on Tron deployments). */
const TRON_ZERO_ADDRESS = '410000000000000000000000000000000000000000';

/** 1 TRX = 1_000_000 sun on Tron. */
const ONE_TRX_SUN = 1_000_000;

const waitForConfirmation = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const balanceOf = async (token, account) => {
  const value = await token.balanceOf(account);
  return BigInt(value.toString());
};

const trxBalance = async (address) => {
  const balance = await tronWeb.trx.getBalance(address);
  return BigInt(balance);
};

const diff = (after, before) => after - before;

const sumStrings = (values) => values.reduce((acc, value) => acc + BigInt(value), 0n).toString();

const mulString = (value, count) => (BigInt(value) * BigInt(count)).toString();

const computeBatchFee = (totalPaymentAmount, bps) =>
  ((BigInt(totalPaymentAmount) * BigInt(bps)) / 1000n).toString();

const getApprovalAmount = (amountList, feeList, batchFee = '0') =>
  sumStrings([...amountList, ...feeList, batchFee]);

/**
 * Deploy ERC20FeeProxy, optional batch contract, and one or more TestTRC20 tokens.
 */
const deployBaseSetup = async ({ accounts, batchDeployFn, batchFee, tokenCount = 3 }) => {
  const ERC20FeeProxy = artifacts.require('ERC20FeeProxy');
  const TestTRC20 = artifacts.require('TestTRC20');

  const owner = accounts[0];
  const erc20FeeProxy = await ERC20FeeProxy.new();
  const dummyEthProxy = TRON_ZERO_ADDRESS;

  let batch = null;
  if (batchDeployFn) {
    batch = await batchDeployFn(erc20FeeProxy, owner, dummyEthProxy);
    if (batchFee !== undefined && batch.setBatchFee) {
      await batch.setBatchFee(batchFee, { from: owner });
    }
  }

  const tokens = [];
  for (let i = 0; i < tokenCount; i++) {
    const token = await TestTRC20.new(INITIAL_SUPPLY, `Test TRC20 ${i + 1}`, `TT${i + 1}`, 18);
    tokens.push(token);
  }

  return { erc20FeeProxy, batch, tokens, dummyEthProxy };
};

/**
 * Approve contract to spend payer tokens.
 */
const makeTokenApproval = async (token, payer, batchAddress, amount) => {
  await token.approve(batchAddress, amount, { from: payer });
  await waitForConfirmation(2000);
};

/**
 * Deploy a TestTRC20 with a specific initial supply assigned to payer.
 */
const deployTokenWithSupply = async (supply, payer) => {
  const TestTRC20 = artifacts.require('TestTRC20');
  return TestTRC20.new(supply, 'Test TRC20', 'TTRC', 18, { from: payer });
};

/**
 * Runs fn and asserts tracked balances are unchanged (source of truth Tron when Tron tx reverts).
 */
const expectRevertOrNoBalanceChange = async (fn, getBalances) => {
  const before = await getBalances();
  try {
    await fn();
  } catch (_error) {}
  await waitForConfirmation(2000);
  const after = await getBalances();
  const unchanged = before.every((value, index) => value === after[index]);
  return { unchanged };
};

/**
 * Asserts the batch contract holds zero balance for each token.
 */
const assertBatchTokenBalancesZero = async (batch, tokens) => {
  for (const token of tokens) {
    const bal = await balanceOf(token, batch.address);
    assert.equal(bal.toString(), '0', `batch should have zero token balance for ${token.address}`);
  }
};

/**
 * Expects fn to revert; optionally asserts getState() is unchanged.
 */
const expectNonOwnerReverts = async (fn, getState) => {
  const before = await getState();
  let threw = false;
  try {
    await fn();
  } catch (_error) {
    threw = true;
  }
  await waitForConfirmation(2000);
  assert(threw, 'expected non-owner call to revert');
  if (getState) {
    const after = await getState();
    assert.equal(after, before, 'state should be unchanged after failed non-owner call');
  }
  return { reverted: threw };
};

/**
 * Deploy BadTRC20 with migration-style constructor args.
 */
const deployBadTRC20 = async (payer) => {
  const BadTRC20 = artifacts.require('BadTRC20');
  return BadTRC20.new('1000000000000', 'BadTRC20', 'BAD', 8, { from: payer });
};

module.exports = {
  INITIAL_SUPPLY,
  REF_A,
  REF_B,
  REF_C,
  TRON_ZERO_ADDRESS,
  ONE_TRX_SUN,
  waitForConfirmation,
  balanceOf,
  trxBalance,
  diff,
  sumStrings,
  mulString,
  computeBatchFee,
  getApprovalAmount,
  deployBaseSetup,
  makeTokenApproval,
  deployTokenWithSupply,
  expectRevertOrNoBalanceChange,
  assertBatchTokenBalancesZero,
  expectNonOwnerReverts,
  deployBadTRC20,
};
