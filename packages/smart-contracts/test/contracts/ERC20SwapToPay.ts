import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  TestERC20__factory,
  TestERC20,
  FakeSwapRouter__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  FakeSwapRouter,
  ERC20SwapToPay__factory,
  ERC20SwapToPay,
  BadERC20__factory,
  BadERC20,
} from '../../types';
import { erc20FeeProxyArtifact, erc20SwapToPayArtifact } from '../..';

use(solidity);

describe('contract: SwapToPay', () => {
  let admin: string;
  let from: string;
  let to: string;
  let builder: string;
  let adminSigner: Signer;
  let signer: Signer;

  const exchangeRateOrigin = Math.floor(Date.now() / 1000);
  const referenceExample = '0xaaaa';

  let paymentNetworkErc20: TestERC20;
  let spentErc20: TestERC20;
  let erc20FeeProxy: ERC20FeeProxy;
  let fakeSwapRouter: FakeSwapRouter;
  let testSwapToPay: ERC20SwapToPay;
  let initialFromBalance: BigNumber;
  // let maxGasUsed;
  let defaultSwapRouterAddress: string;

  const erc20Decimal = BigNumber.from('1000000000000000000');
  const erc20Liquidity = erc20Decimal.mul(100);

  before(async () => {
    [admin, from, to, builder] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, signer] = await ethers.getSigners();

    erc20FeeProxy = ERC20FeeProxy__factory.connect(
      erc20FeeProxyArtifact.getAddress(network.name),
      adminSigner,
    );

    testSwapToPay = ERC20SwapToPay__factory.connect(
      erc20SwapToPayArtifact.getAddress(network.name),
      adminSigner,
    );
  });

  beforeEach(async () => {
    paymentNetworkErc20 = await new TestERC20__factory(adminSigner).deploy(erc20Decimal.mul(10000));
    spentErc20 = await new TestERC20__factory(adminSigner).deploy(erc20Decimal.mul(1000));

    // Deploy a fake router and feed it with 200 payment ERC20 + 100 requested ERC20
    // The fake router fakes 2 payment ERC20 = 1 requested ERC20
    fakeSwapRouter = await new FakeSwapRouter__factory(adminSigner).deploy();
    await spentErc20.transfer(fakeSwapRouter.address, erc20Liquidity.mul(2));
    await paymentNetworkErc20.transfer(fakeSwapRouter.address, erc20Liquidity);

    defaultSwapRouterAddress = await testSwapToPay.swapRouter();
    await testSwapToPay.setRouter(fakeSwapRouter.address);
    await testSwapToPay.approveRouterToSpend(spentErc20.address);
    await testSwapToPay.approvePaymentProxyToSpend(paymentNetworkErc20.address);
    testSwapToPay = await testSwapToPay.connect(signer);

    await spentErc20.transfer(from, erc20Decimal.mul(600));
    spentErc20 = TestERC20__factory.connect(spentErc20.address, signer);
    initialFromBalance = await spentErc20.balanceOf(from);
    await spentErc20.approve(testSwapToPay.address, initialFromBalance);
  });

  afterEach(async () => {
    testSwapToPay = testSwapToPay.connect(adminSigner);
    await testSwapToPay.setRouter(defaultSwapRouterAddress);

    // The contract should never keep any fund
    const contractPaymentCcyBalance = await spentErc20.balanceOf(testSwapToPay.address);
    const contractRequestCcyBalance = await paymentNetworkErc20.balanceOf(testSwapToPay.address);
    expect(contractPaymentCcyBalance.toNumber()).to.equals(0);
    expect(contractRequestCcyBalance.toNumber()).to.equals(0);
  });

  const expectFromBalanceUnchanged = async () => {
    const finalFromBalance = await spentErc20.balanceOf(from);
    expect(finalFromBalance.toString()).to.equals(initialFromBalance.toString());
  };

  it('swaps and pays the request', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        // Here we spend 26 max, for 22 used in theory, to test that 4 is given back
        26,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin + 100,
      ),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        ethers.utils.getAddress(paymentNetworkErc20.address),
        to,
        '10',
        ethers.utils.keccak256(referenceExample),
        '1',
        ethers.utils.getAddress(builder),
      );

    const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
    const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(1);
    expect(finalIssuerBalance.toNumber()).to.equals(10);

    // Test that the contract does not hold any fund after the transaction
    const finalContractPaymentBalance = await spentErc20.balanceOf(testSwapToPay.address);
    const finalContractRequestBalance = await paymentNetworkErc20.balanceOf(testSwapToPay.address);
    expect(finalContractPaymentBalance.toNumber()).to.equals(0);
    expect(finalContractRequestBalance.toNumber()).to.equals(0);
  });

  it('does not pay anyone if I swap 0', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        0,
        0,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        0,
        builder,
        exchangeRateOrigin + 100,
      ),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        paymentNetworkErc20.address,
        to,
        '0',
        ethers.utils.keccak256(referenceExample),
        '0',
        builder,
      );

    const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
    const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(0);
    expect(finalIssuerBalance.toNumber()).to.equals(0);
  });

  it('cannot swap if too few payment tokens', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        21, // Should be at least (10 + 1) * 2
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin + 15,
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  it('cannot swap with a past deadline', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        22,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin - 15, // Past deadline
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  it('cannot swap more tokens than liquidity', async function () {
    const tooHighAmount = 100;

    expect(erc20Liquidity.mul(2).lt(initialFromBalance), 'Test irrelevant with low balance').to.be
      .true;
    expect(
      erc20Liquidity.lt(erc20Decimal.mul(tooHighAmount).mul(2)),
      'Test irrelevant with low amount',
    ).to.be.true;

    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        erc20Decimal.mul(tooHighAmount),
        initialFromBalance,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1000000,
        builder,
        exchangeRateOrigin + 15,
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  it('cannot swap more tokens than balance', async function () {
    const highAmount = erc20Decimal.mul(900);
    await spentErc20.approve(testSwapToPay.address, highAmount);

    expect(highAmount.gt(initialFromBalance), 'Test irrelevant with high balance').to.be.true;

    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        100,
        highAmount,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        10,
        builder,
        exchangeRateOrigin + 15,
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  describe('Bad ERC20 support', () => {
    let badERC20: BadERC20;
    beforeEach(async () => {
      badERC20 = await new BadERC20__factory(adminSigner).deploy(1000, 'BadERC20', 'BAD', 8);
    });
    it('can approve bad ERC20 to be spent by the proxy', async () => {
      await expect(testSwapToPay.approvePaymentProxyToSpend(badERC20.address))
        .to.emit(badERC20, 'Approval')
        .withArgs(
          testSwapToPay.address,
          erc20FeeProxy.address,
          BigNumber.from(2).pow(256).sub(1).toString(),
        );

      const approval = await badERC20.allowance(testSwapToPay.address, erc20FeeProxy.address);
      expect(approval.toString()).to.equals(BigNumber.from(2).pow(256).sub(1).toString());
    });

    it('can approve bad ERC20 to be swapped by the router', async () => {
      await expect(testSwapToPay.approveRouterToSpend(badERC20.address))
        .to.emit(badERC20, 'Approval')
        .withArgs(
          testSwapToPay.address,
          fakeSwapRouter.address,
          BigNumber.from(2).pow(256).sub(1).toString(),
        );

      const approval = await badERC20.allowance(testSwapToPay.address, fakeSwapRouter.address);
      expect(approval.toString()).to.equals(BigNumber.from(2).pow(256).sub(1).toString());
    });

    it('swaps badERC20 to another ERC20 for payment', async () => {
      await testSwapToPay.approveRouterToSpend(badERC20.address);

      await badERC20.transfer(from, '100');
      await badERC20.connect(signer).approve(testSwapToPay.address, initialFromBalance);

      await expect(
        testSwapToPay.swapTransferWithReference(
          to,
          10,
          26,
          [badERC20.address, paymentNetworkErc20.address],
          referenceExample,
          1,
          builder,
          exchangeRateOrigin + 100,
        ),
      )
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          paymentNetworkErc20.address,
          to,
          '10',
          ethers.utils.keccak256(referenceExample),
          '1',
          builder,
        );

      // Test that issuer and builder (fee receiver) have been paid
      const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
      const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
      expect(finalBuilderBalance.toNumber()).to.equals(1);
      expect(finalIssuerBalance.toNumber()).to.equals(10);

      // Test that the contract does not hold any fund after the transaction
      const finalContractPaymentBalance = await badERC20.balanceOf(testSwapToPay.address);
      const finalContractRequestBalance = await paymentNetworkErc20.balanceOf(
        testSwapToPay.address,
      );
      expect(finalContractPaymentBalance.toNumber()).to.equals(0);
      expect(finalContractRequestBalance.toNumber()).to.equals(0);
    });
  });
});
