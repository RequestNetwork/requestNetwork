import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { TestERC20__factory, TestERC20, BatchErc20Payments } from '../../src/types';
import { batchErc20PaymentsArtifact } from '../../src/lib';

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

  const erc20Decimal = BigNumber.from('1000000000000000000');
  let tx;
  before(async () => {
    console.log('get signer 1');
    [, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    console.log('get signer 2');
    [owner, spender] = await ethers.getSigners();

    console.log('get address spender');
    spenderAddress = await spender.getAddress();
    receiver1 = '0xA4deDD28820C2eb1Eaf7a8076fc0B179b83a28a7';

    console.log('batch');
    batch = await batchErc20PaymentsArtifact.connect(network.name, owner);

    console.log('create token');
    token = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));

    console.log('token transfer, address: ', token.address);
    const tmpForGasTest = 45; // default=1

    try {
      tx = await token.connect(owner).transfer(spenderAddress, 150 * tmpForGasTest);
      await tx.wait();
      console.log('token transfer tx hash: ', tx.hash);
    } catch (e) {
      console.log(e);
    }

    try {
      tx = await token.connect(spender).approve(batch.address, 170 * tmpForGasTest);
      await tx.wait();
      console.log("'before' done");
    } catch (e) {
      console.log(e);
    }
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

    console.log('do batch');
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
      await tx.wait();
      console.log('before done');
      console.log('get receipt');
      const receipt = tx.wait();

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
