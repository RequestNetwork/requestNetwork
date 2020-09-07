const ethers = require('ethers');
//import "truffle/DeployedAddresses.sol";

const { expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { expect } = require('openzeppelin-test-helpers/src/setup');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const TestERC20 = artifacts.require('./TestERC20.sol');
const ERC20Alpha = artifacts.require('ERC20Alpha');
const FakeSwapRouter = artifacts.require('./FakeSwapRouter.sol');
const SwapToPay = artifacts.require('./SwapToPay.sol');

contract('SwapToPay', function(accounts) {
  const admin = accounts[0];
  const from = accounts[1];
  const to = accounts[2];
  const builder = accounts[3];
  let erc20FeeProxy;
  let fakeRouter;
  let paymentErc20;
  let requestedErc20;
  let testSwapToPay;
  const referenceExample = '0xaaaa';

  beforeEach(async () => {
    paymentErc20 = await ERC20Alpha.new(10000, {
      from: admin,
    });
    requestedErc20 = await TestERC20.new(1000, {
      from: admin,
    });
    
    
    fakeRouter = await FakeSwapRouter.new({
      from: admin,
    });
    await paymentErc20.transfer(fakeRouter.address, 200, {
      from: admin,
    });
    await requestedErc20.transfer(fakeRouter.address, 100, {
      from: admin,
    });

    await paymentErc20.transfer(from, 200, {
      from: admin,
    });
    
    erc20FeeProxy = await ERC20FeeProxy.new({
      from: admin,
    });

    testSwapToPay = await SwapToPay.new(
      fakeRouter.address, 
      erc20FeeProxy.address, 
      {from: admin}
    );
  });

  it.only('swaps and pays the request', async function() {
    await testSwapToPay.approvePaymentProxyToSpend(requestedErc20.address, {
      from: admin,
    });
    await testSwapToPay.approveRouterToSpend(paymentErc20.address, {
      from: admin,
    });
    console.log(`stp = await SwapToPay.at("${testSwapToPay.address}");`);
    console.log(`pmt = await ERC20Alpha.at("${paymentErc20.address}");`);
    console.log(`req = await TestERC20.at("${requestedErc20.address}");`);
    console.log(`uniswapRouter = await FakeSwapRouter.at("${fakeRouter.address}");`);
    console.log("await pmt.approve(uniswapRouter.address, 210, {from: accounts[1]});");

    let { logsTemp } = await paymentErc20.approve(testSwapToPay.address, '200', { from });

    let { logs } = await testSwapToPay.swapTransferWithReference(
      to,
      10,
      22,
      [paymentErc20.address, requestedErc20.address],
      referenceExample,
      1,
      builder,
      Date.now() + 15,
      { from },
    );
    expectEvent.inLogs(logs, 'TransferWithReferenceAndFee', {
      tokenAddress: requestedErc20.address,
      to,
      amount: 10,
      //paymentReference: ethers.utils.keccak256(referenceExample),
      feeAmount: 1,
      feeAddress: builder,
    });
  });

  it('cannot swap if too few payment tokens', async function() {
    await paymentErc20.approve(testSwapToPay.address, '22', { from });

    await shouldFail.reverting(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        21, // Should be at least (10 + 1) * 2
        [paymentErc20.address, requestedErc20.address],
        referenceExample,
        1,
        builder,
        Date.now() - 15,
        { from },
      )
    );
  });
});
