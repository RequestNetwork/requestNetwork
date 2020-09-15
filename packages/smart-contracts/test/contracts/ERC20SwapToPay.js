const ethers = require('ethers');
// TODO remove when understood
//import "truffle/DeployedAddresses.sol";

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const TestERC20 = artifacts.require('./TestERC20.sol');
//const ERC20Alpha = artifacts.require('ERC20Alpha');
const FakeSwapRouter = artifacts.require('./FakeSwapRouter.sol');
const SwapToPay = artifacts.require('./ERC20SwapToPay.sol');

contract('SwapToPay', function(accounts) {
  const admin = accounts[0];
  const from = accounts[1];
  const to = accounts[2];
  const builder = accounts[3];

  const exchangeRateOrigin = Math.floor(Date.now() / 1000);
  const referenceExample = '0xaaaa';

  let paymentErc20;
  let requestErc20;
  let erc20FeeProxy;
  let fakeRouter;
  let testSwapToPay;
  let initialFromBalance;
  let maxGasUsed;

  beforeEach(async () => {
    paymentErc20 = await TestERC20.new(10000, {
      from: admin,
    });
    requestErc20 = await TestERC20.new(1000, {
      from: admin,
    });
    
    
    fakeRouter = await FakeSwapRouter.new({
      from: admin,
    });
    await paymentErc20.transfer(fakeRouter.address, 200, {
      from: admin,
    });
    await requestErc20.transfer(fakeRouter.address, 100, {
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

    initialFromBalance = await paymentErc20.balanceOf(from);
    await paymentErc20.approve(testSwapToPay.address, initialFromBalance, { from });
  });

  afterEach(async() => {
    // The contract should never keep any fund
    const contractPaymentCcyBalance = await paymentErc20.balanceOf(testSwapToPay.address);
    const contractRequestCcyBalance = await requestErc20.balanceOf(testSwapToPay.address);
    expect(contractPaymentCcyBalance.toNumber()).to.equals(0);
    expect(contractRequestCcyBalance.toNumber()).to.equals(0);
  })

  expectFromBalanceUnchanged = async() => {
    const finalFromBalance = await paymentErc20.balanceOf(from);
    expect(finalFromBalance.toNumber()).to.equals(initialFromBalance.toNumber());
  }

  it('swaps and pays the request', async function() {
    let { tx, receipt: { gasUsed } } = await testSwapToPay.swapTransferWithReference(
      to,
      10,
      22,
      [paymentErc20.address, requestErc20.address],
      referenceExample,
      1,
      builder,
      exchangeRateOrigin + 100,
      { from },
    );
    await expectEvent.inTransaction(tx, ERC20FeeProxy, 'TransferWithReferenceAndFee', {
      tokenAddress: requestErc20.address,
      to,
      amount: '10',
      paymentReference: ethers.utils.keccak256(referenceExample),
      feeAmount: '1',
      feeAddress: builder,
    });

    const finalBuilderBalance = await requestErc20.balanceOf(builder);
    const finalIssuerBalance = await requestErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(1);
    expect(finalIssuerBalance.toNumber()).to.equals(10);
    maxGasUsed = gasUsed;
  });

  it('swaps and pays the request with less gas', async function() {
    await testSwapToPay.approvePaymentProxyToSpend(requestErc20.address, {
      from: admin,
    });
    await testSwapToPay.approveRouterToSpend(paymentErc20.address, {
      from: admin,
    });

    let { tx, receipt: { gasUsed }  } = await testSwapToPay.swapTransferWithReference(
      to,
      10,
      22,
      [paymentErc20.address, requestErc20.address],
      referenceExample,
      1,
      builder,
      exchangeRateOrigin + 100,
      { from },
    );
    await expectEvent.inTransaction(tx, ERC20FeeProxy, 'TransferWithReferenceAndFee', {
      tokenAddress: requestErc20.address,
      to,
      amount: '10',
      paymentReference: ethers.utils.keccak256(referenceExample),
      feeAmount: '1',
      feeAddress: builder,
    });

    const finalBuilderBalance = await requestErc20.balanceOf(builder);
    const finalIssuerBalance = await requestErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(1);
    expect(finalIssuerBalance.toNumber()).to.equals(10);
    // Everything should behave exactly the same, except gas usage.
    // 50k gas units are saved by approving the router and proxy in advance for first users, per token
    // console.log(`${maxGasUsed - gasUsed} gas units saved by approving in advance`);
    expect(gasUsed).to.below(maxGasUsed);
  });

  it('does not pay anyone if I swap 0', async function() {
    let { tx, receipt: { gasUsed } } = await testSwapToPay.swapTransferWithReference(
      to,
      0,
      0,
      [paymentErc20.address, requestErc20.address],
      referenceExample,
      0,
      builder,
      exchangeRateOrigin + 100,
      { from },
    );
    await expectEvent.inTransaction(tx, ERC20FeeProxy, 'TransferWithReferenceAndFee', {
      tokenAddress: requestErc20.address,
      to,
      amount: '0',
      paymentReference: ethers.utils.keccak256(referenceExample),
      feeAmount: '0',
      feeAddress: builder,
    });

    const finalBuilderBalance = await requestErc20.balanceOf(builder);
    const finalIssuerBalance = await requestErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(0);
    expect(finalIssuerBalance.toNumber()).to.equals(0);
  });

  it('cannot swap if too few payment tokens', async function() {

    await expectRevert.unspecified(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        21, // Should be at least (10 + 1) * 2
        [paymentErc20.address, requestErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin + 15,
        { from },
      )
    );
    await expectFromBalanceUnchanged();
  });

  it('cannot swap with a past deadline', async function() {

    await expectRevert.unspecified(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        22,
        [paymentErc20.address, requestErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin - 15, // Past deadline
        { from },
      )
    );
    await expectFromBalanceUnchanged();
  });

  it('cannot swap more tokens than liquidity', async function() {
    await paymentErc20.approve(testSwapToPay.address, '22000000', { from });

    await expectRevert.unspecified(
      testSwapToPay.swapTransferWithReference(
        to,
        10000000,
        22000000,
        [paymentErc20.address, requestErc20.address],
        referenceExample,
        1000000,
        builder,
        exchangeRateOrigin + 15,
        { from },
      )
    );
    await expectFromBalanceUnchanged();
  });
  
  it('cannot swap more tokens than balance', async function() {
    await paymentErc20.approve(testSwapToPay.address, '300', { from });

    await expectRevert.unspecified(
      testSwapToPay.swapTransferWithReference(
        to,
        100,
        220, // From's balance is 200
        [paymentErc20.address, requestErc20.address],
        referenceExample,
        10,
        builder,
        exchangeRateOrigin + 15,
        { from },
      )
    );
    await expectFromBalanceUnchanged();
  });
});
