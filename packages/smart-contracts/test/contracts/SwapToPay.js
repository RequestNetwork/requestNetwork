const ethers = require('ethers');

const { expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const TestERC20 = artifacts.require('./TestERC20.sol');
const BadERC20 = artifacts.require('./BadERC20.sol');
const ERC20True = artifacts.require('ERC20True');
const ERC20False = artifacts.require('ERC20False');
const ERC20NoReturn = artifacts.require('ERC20NoReturn');
const ERC20Revert = artifacts.require('ERC20Revert');

contract('SwapToPay', function(accounts) {
  const admin = accounts[0];
  const from = accounts[1];
  const to = accounts[2];
  const builder = accounts[3];
  const feeAddress = '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';
  let erc20FeeProxy;
  let fakeRouter;
  let testPmtERC20, testRqdERC20;
  const referenceExample = '0xaaaa';

  beforeEach(async () => {
    testPmtERC20 = await TestERC20.new(10000, {
      admin,
    });
    testRqdERC20 = await TestERC20.new(10000, {
      admin,
    });
    
    fakeRouter = await FakeSwapRouter.new({
      admin,
    });
    await testPmtERC20.transfer(fakeRouter, 1000, {
      admin,
    });
    await testRqdERC20.transfer(fakeRouter, 1000, {
      admin,
    });
    
    erc20FeeProxy = await ERC20FeeProxy.new({
      admin,
    });

    testSwapToPay = await SwapToPay.new(fakeRouter.address, erc20FeeProxy.address, {
      admin,
    });
    testSwapToPay.approvePaymentProxyToSpend(testPmtERC20.address, {admin});
    testSwapToPay.approveRouterToSpend(testRqdERC20.address, {admin});
  });

  it('swaps and pays the request', async function() {
    await testPmtERC20.approve(testSwapToPay.address, '1015', { from });

    let { logs } = await testSwapToPay.swapTransferWithReference(
      to,
      '998',
      '1015',
      [testPmtERC20.address, testRqdERC20.address],
      referenceExample,
      '2',
      builder.address,
      Date.now() + 15
      { from },
    );
  });
});
