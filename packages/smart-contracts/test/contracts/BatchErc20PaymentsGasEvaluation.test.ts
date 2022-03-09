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
  let receiver: string;

  let adminSigner: Signer;
  let spender: Signer;

  let beforeERC20Balance: BigNumber;
  let afterERC20Balance: BigNumber;

  const referenceExample1 = '0xaaaa';

  let token: TestERC20;
  let batch: BatchErc20Payments;

  const erc20Decimal = BigNumber.from('1000000000000000000');
  let tx;
  before(async () => {
    [, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, spender] = await ethers.getSigners();

    const tokenApproved = 500;
    spenderAddress = await spender.getAddress();
    receiver = '0xA4deDD28820C2eb1Eaf7a8076fc0B179b83a28a7';

    batch = await batchErc20PaymentsArtifact.connect(network.name, adminSigner);
    token = await new TestERC20__factory(adminSigner).deploy(erc20Decimal.mul(10000));

    tx = await token.connect(adminSigner).transfer(spenderAddress, tokenApproved);
    await tx.wait();

    tx = await token.connect(spender).approve(batch.address, tokenApproved);
    await tx.wait();
  });

  it('GAS EVALUATION X p: Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.balanceOf(receiver);

    let recipients: Array<string> = [];
    let amounts: Array<number> = [];
    let paymentReferences: Array<string> = [];
    let feeAmounts: Array<number> = [];

    let nbTxs = 1;
    let amount = 2;
    let feeAmount = 1;

    for (let i = 0; i < nbTxs; i++) {
      recipients.push(receiver);
      amounts.push(amount);
      paymentReferences.push(referenceExample1);
      feeAmounts.push(feeAmount);
    }

    // console.log(token.address, recipients, amounts, paymentReferences, feeAmounts, feeAddress);

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

    const receipt = await tx.wait();
    console.log('gas consumption: ', (await receipt).gasUsed.toBigInt());

    afterERC20Balance = await token.balanceOf(receiver);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(amount * nbTxs));
  });
});
