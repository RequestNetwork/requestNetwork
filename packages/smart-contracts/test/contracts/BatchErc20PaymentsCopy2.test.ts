import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { TestERC20__factory, TestERC20, BatchErc20Payments, ERC20FeeProxy } from '../../src/types';
import { erc20FeeProxyArtifact, batchErc20PaymentsArtifact } from '../../src/lib';

use(solidity);

// todo
// get numbers and make a small summary, explain how to do the the test in local and on rinkeby
// stop deploying a new token (with a new address) each time
// - do it in deployment
// - modify the code to set the approval to 0.
// evaluate the price optimization by implementing function with delegatecall, is it a good practice?
// look at the rest of the code to understand what are the next modif
// ask: batch payment with conversion ? should i had approve batch too ?

describe('contract: BatchErc20Payments', () => {
  let feeAddress: string;
  let spenderAddress: string;
  let receiver1: string;

  let owner: Signer;
  let spender: Signer;

  let beforeERC20Balance: BigNumber;
  let afterERC20Balance: BigNumber;

  const referenceExample1 = '0xaaaa';

  let token: TestERC20;
  let batch: BatchErc20Payments;

  let erc20FeeProxy: ERC20FeeProxy;

  const erc20Decimal = BigNumber.from('1000000000000000000');
  let tx;
  before(async () => {
    [, feeAddress] = (await ethers.getSigners()).map((s) => s.address);

    [owner, spender] = await ethers.getSigners();

    console.log('get address spender');
    let ownerAddress = await owner.getAddress();
    spenderAddress = await spender.getAddress();
    receiver1 = '0xA4deDD28820C2eb1Eaf7a8076fc0B179b83a28a7';

    console.log('========> network.name:', network.name);
    erc20FeeProxy = await erc20FeeProxyArtifact.connect(network.name, owner);
    console.log('erc20FeeProxy, address', erc20FeeProxy.address);
    batch = await batchErc20PaymentsArtifact.connect(network.name, owner);
    console.log('batch owner connected');

    console.log('create token');
    token = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));

    console.log('token transfer, address: ', token.address);

    tx = await token.connect(owner).transfer(spenderAddress, erc20Decimal.mul(2000));
    await tx.wait();

    tx = await batch.approvePaymentProxyToSpend(token.address);
    await tx.wait();
    console.log('->>>>>>>> tx batch', tx);

    tx = await token.connect(spender).approve(batch.address, 10000000);
    await tx.wait();
    console.log('allowance: ', (await token.allowance(spenderAddress, batch.address)).toBigInt()); //toString

    tx = await token.connect(owner).approve(spenderAddress, 11000000);
    await tx.wait();
    console.log('allowance: ', (await token.allowance(ownerAddress, spenderAddress)).toBigInt());

    batch = await batch.connect(spender);

    // token = await TestERC20__factory.connect(token.address, spender);

    tx = await token.connect(spender).approve(erc20FeeProxy.address, 11500000);
    await tx.wait();
    console.log(
      'allowance spender to erc20feeProxy: ',
      (await token.allowance(spenderAddress, erc20FeeProxy.address)).toBigInt(),
    ); //toString

    tx = await token.connect(owner).approve(erc20FeeProxy.address, 11700000);
    await tx.wait();
    console.log(
      'allowance ownerAddress erc20FeeProxy: ',
      (await token.allowance(ownerAddress, erc20FeeProxy.address)).toBigInt(),
    ); //toString

    tx = await batch.connect(owner).approvePaymentProxyToSpend(token.address);
    await tx.wait();
    console.log('->>>>>>>> tx batch', tx);
    console.log(
      'allowance spender(using spender) erc20FeeProxy: ',
      (await token.allowance(spenderAddress, erc20FeeProxy.address)).toBigInt(),
    ); //toString
    console.log(
      'allowance batch(using spender) erc20FeeProxy: ',
      (await token.allowance(batch.address, erc20FeeProxy.address)).toBigInt(),
    ); //toString

    let initialFromBalance = await token.balanceOf(spenderAddress);
    console.log('initialFromBalance:', initialFromBalance.toBigInt());
    tx = await token.connect(spender).approve(batch.address, initialFromBalance); // TODELETE
    await tx.wait();

    token = TestERC20__factory.connect(token.address, spender);
    initialFromBalance = await token.balanceOf(spenderAddress);
    await token.approve(batch.address, initialFromBalance);
  });

  it('GAS EVALUATION X p: Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(spenderAddress);
    console.log('beforeERC20Balance spender=', beforeERC20Balance.toBigInt());
    beforeERC20Balance = await token.connect(owner).balanceOf(receiver1);

    let recipients: Array<string> = [];
    let amounts: Array<number> = [];
    let paymentReferences: Array<string> = [];
    let feeAmounts: Array<number> = [];

    let nbTxs = 1;
    let amount = 2;
    let feeAmount = 1;

    for (let i = 0; i < nbTxs; i++) {
      recipients.push(receiver1);
      amounts.push(amount);
      paymentReferences.push(referenceExample1);
      feeAmounts.push(feeAmount);
    }

    console.log(token.address, recipients, amounts, paymentReferences, feeAmounts, feeAddress);
    console.log('-------_> erc20feeProxy', await batch.erc20FeeProxy());
    console.log('do batch');

    try {
      let tx = await batch
        .connect(spender)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          recipients,
          amounts,
          paymentReferences,
          feeAmounts,
          feeAddress,
        );

      await tx.wait();
      console.log('get receipt');
      const receipt = await tx.wait();

      console.log((await receipt).gasUsed.toBigInt());
    } catch (e) {
      console.log(e);
    }

    // console.log("gas consumption:", receipt..gasUsed);
    console.log('get balance end');
    afterERC20Balance = await token.connect(owner).balanceOf(receiver1);
    console.log('check balance');
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(amount * nbTxs));
  });
});
