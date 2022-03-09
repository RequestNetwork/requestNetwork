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

  let approval;

  const erc20Decimal = BigNumber.from('1000000000000000000');
  let tx;
  before(async () => {
    [, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [owner, spender] = await ethers.getSigners();
    spenderAddress = await spender.getAddress();
    receiver1 = '0xA4deDD28820C2eb1Eaf7a8076fc0B179b83a28a7';

    batch = await batchErc20PaymentsArtifact.connect(network.name, owner);
    erc20FeeProxy = await erc20FeeProxyArtifact.connect(network.name, owner);
    token = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    console.log('--->batch:', batch.address);
    console.log('--->erc20FeeProxy:', erc20FeeProxy.address);
    console.log('--->token:', token.address);

    const amountTransfered = 2000;
    tx = await token.connect(owner).transfer(spenderAddress, amountTransfered);
    await tx.wait();
    tx = await token.connect(spender).approve(batch.address, amountTransfered);
    await tx.wait();

    // APPROVALS
    tx = await token.connect(spender).approve(batch.address, 111100000);
    await tx.wait();
    approval = await token.allowance(spenderAddress, batch.address);
    console.log('allowance(spender, batch): ', approval.toString());

    tx = await token.connect(spender).approve(erc20FeeProxy.address, 333300000);
    await tx.wait();
    approval = await token.allowance(spenderAddress, erc20FeeProxy.address);
    console.log('allowance(spender, erc20FeeProxy): ', approval.toString());

    tx = await batch.connect(spender).approvePaymentProxyToSpend(token.address);
    await tx.wait();
    approval = await token.allowance(batch.address, erc20FeeProxy.address);
    console.log('allowance(batch, erc20FeeProxy): ', approval.toString());
  });

  it('GAS EVALUATION X p: Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.balanceOf(spenderAddress);
    console.log('beforeERC20Balance spender=', beforeERC20Balance.toBigInt());
    beforeERC20Balance = await token.balanceOf(receiver1);

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

    console.log('do batch', await batch.address, await erc20FeeProxy.address, await token.address);
    try {
      const tx = await batch
        .connect(spender)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          recipients,
          amounts,
          paymentReferences,
          feeAmounts,
          feeAddress,
        );

      console.log('get receipt');
      const receipt = await tx.wait();

      console.log((await receipt).gasUsed.toBigInt());
    } catch (e) {
      console.log(e);
    }

    // console.log("gas consumption:", receipt..gasUsed);
    console.log('get balance end');
    afterERC20Balance = await token.balanceOf(receiver1);
    console.log('check balance');
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(amount * nbTxs));
  });
});
