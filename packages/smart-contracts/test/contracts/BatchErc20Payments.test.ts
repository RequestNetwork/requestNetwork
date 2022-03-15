import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { TestERC20__factory, TestERC20, BatchPayments } from '../../src/types';
import { batchPaymentsArtifact } from '../../src/lib';

use(solidity);

const logInfos = false;

describe('contract: BatchPayments: ERC20', () => {
  let payeeOne: string;
  let payeeTwo: string;
  let payeeThree: string;
  let payeeFour: string;
  let feeAddress: string;

  let spenderAddress: string;
  let spender1Address: string;
  let spender2Address: string;
  let tokenAddress: string;
  let token1Address: string;
  let batchAddress: string;

  let owner: Signer;
  let spender: Signer;
  let spender1: Signer;
  let spender2: Signer;

  let beforeERC20Balance: BigNumber;
  let afterERC20Balance: BigNumber;
  let beforeERC20Balance1: BigNumber;
  let afterERC20Balance1: BigNumber;

  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';
  const referenceExample3 = '0xcccc';
  const referenceExample4 = '0xdddd';

  let token: TestERC20;
  let token1: TestERC20;
  let batch: BatchPayments;

  const erc20Decimal = BigNumber.from('1000000000000000000');

  let amount = 2;
  let feeAmount = 1;
  let nbTxs: number;

  let tx;

  before(async () => {
    [, payeeOne, payeeTwo, payeeThree, payeeFour, feeAddress] = (await ethers.getSigners()).map(
      (s) => s.address,
    );
    [owner, spender, spender1, spender2] = await ethers.getSigners();
    batch = batchPaymentsArtifact.connect(network.name, owner);
    token = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    token1 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));

    spenderAddress = await spender.getAddress();
    spender1Address = await spender1.getAddress();
    spender2Address = await spender2.getAddress();
    tokenAddress = await token.address;
    token1Address = await token1.address;
    batchAddress = await batch.address;

    await token.connect(owner).transfer(spenderAddress, 1000);
    await token.connect(owner).transfer(spender1Address, 160);
    await token.connect(owner).transfer(spender2Address, 160);
    await token.connect(spender).approve(batchAddress, 1000);
    await token.connect(spender2).approve(batchAddress, 170);

    // 2nd token
    await token1.connect(owner).transfer(spender2Address, 1000);
    await token1.connect(spender2).approve(batchAddress, 1000);
  });

  it('Should execute a batch payments of a ERC20 to four accounts', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    await expect(
      batch
        .connect(spender)
        .batchOrphanERC20Payments(
          tokenAddress,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 50],
        ),
    )
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer');

    afterERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    await expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(40));
  });

  it('Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsWithReferenceAndFee(
          tokenAddress,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 50],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    )
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer')
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        tokenAddress,
        payeeOne,
        '20',
        ethers.utils.keccak256(referenceExample1),
        '1',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        tokenAddress,
        payeeTwo,
        '30',
        ethers.utils.keccak256(referenceExample2),
        '2',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        tokenAddress,
        payeeThree,
        '40',
        ethers.utils.keccak256(referenceExample3),
        '3',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        tokenAddress,
        payeeFour,
        '50',
        ethers.utils.keccak256(referenceExample4),
        '4',
        feeAddress,
      );

    afterERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    await expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(30));
  });

  it('Should execute a batch payments of a ERC20 to four accounts', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    await expect(
      batch
        .connect(spender)
        .batchOrphanERC20Payments(
          tokenAddress,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 50],
        ),
    )
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer')
      .to.emit(token, 'Transfer');

    afterERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(40));
  });

  it('Should pay 4 ERC20 payments on 2 tokens', async function () {
    beforeERC20Balance = await token.balanceOf(payeeTwo);
    beforeERC20Balance1 = await token1.balanceOf(payeeTwo);

    nbTxs = 4;
    let [
      tokenAddresses,
      recipients,
      amounts,
      paymentReferences,
      feeAmounts,
    ] = getInputsBatchPayments(nbTxs, tokenAddress, payeeTwo, amount, referenceExample1, feeAmount);

    tokenAddresses[2] = token1Address;
    tokenAddresses[3] = token1Address;

    tx = await batch
      .connect(spender2)
      .batchERC20PaymentsMultiTokensWithReferenceAndFee(
        tokenAddresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
        feeAddress,
      );
    await tx.wait();

    afterERC20Balance = await token.balanceOf(payeeTwo);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(amount * 2));

    afterERC20Balance1 = await token1.balanceOf(payeeTwo);
    expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * 2));
  });

  it('GAS EVALUATION: Should pay multiple ERC20 payments', async function () {
    let listTxs = [1, 12]; // [1, 4, 8, 12, 30, 100];
    for (let i = 0; i < listTxs.length; i += 1) {
      beforeERC20Balance = await token.balanceOf(payeeThree);
      nbTxs = listTxs[i];
      let [
        tokenAddresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
      ] = getInputsBatchPayments(
        nbTxs,
        tokenAddress,
        payeeThree,
        amount,
        referenceExample1,
        feeAmount,
      );

      const tx = await batch
        .connect(spender)
        .batchERC20PaymentsWithReferenceAndFee(
          tokenAddresses[0],
          recipients,
          amounts,
          paymentReferences,
          feeAmounts,
          feeAddress,
        );

      const receipt = await tx.wait();
      if (logInfos) {
        console.log(`nbTxs= ${nbTxs}, gas consumption: `, (await receipt).gasUsed.toString());
      }

      afterERC20Balance = await token.balanceOf(payeeThree);
      expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(amount * nbTxs));
    }
  });

  it('GAS EVALUATION: Should pay multiple ERC20 payments on multiple tokens', async function () {
    let listTxs = [1, 12]; // [1, 4, 8, 12, 30, 100];
    for (let i = 0; i < listTxs.length; i += 1) {
      beforeERC20Balance = await token.balanceOf(payeeThree);
      nbTxs = listTxs[i];
      let [
        tokenAddresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
      ] = getInputsBatchPayments(
        nbTxs,
        tokenAddress,
        payeeThree,
        amount,
        referenceExample1,
        feeAmount,
      );

      const tx = await batch
        .connect(spender)
        .batchERC20PaymentsMultiTokensWithReferenceAndFee(
          tokenAddresses,
          recipients,
          amounts,
          paymentReferences,
          feeAmounts,
          feeAddress,
        );

      const receipt = await tx.wait();
      if (logInfos) {
        console.log(`nbTxs= ${nbTxs}, gas consumption: `, (await receipt).gasUsed.toString());
      }

      afterERC20Balance = await token.balanceOf(payeeThree);
      expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(amount * nbTxs));
    }
  });

  it('Should revert batch if not enough funds', async function () {
    beforeERC20Balance = await token.balanceOf(payeeOne);

    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsWithReferenceAndFee(
          tokenAddress,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 520],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    ).to.be.reverted;

    afterERC20Balance = await token.balanceOf(payeeOne);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance);
  });

  it('Should revert batch without approval', async function () {
    beforeERC20Balance = await token.balanceOf(payeeOne);

    await expect(
      batch
        .connect(spender1)
        .batchERC20PaymentsWithReferenceAndFee(
          tokenAddress,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 50],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    ).to.be.reverted;

    afterERC20Balance = await token.balanceOf(payeeOne);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance);
  });

  it('Should revert batch multi tokens if not enough funds', async function () {
    beforeERC20Balance = await token.balanceOf(payeeOne);

    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsMultiTokensWithReferenceAndFee(
          [tokenAddress, tokenAddress, tokenAddress, tokenAddress],
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 520],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    ).to.be.reverted;

    afterERC20Balance = await token.balanceOf(payeeOne);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance);
  });

  it('Should revert batch multi tokens without approval', async function () {
    beforeERC20Balance = await token.balanceOf(payeeOne);

    await expect(
      batch
        .connect(spender1)
        .batchERC20PaymentsMultiTokensWithReferenceAndFee(
          [tokenAddress, tokenAddress, tokenAddress, tokenAddress],
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 50],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    ).to.be.reverted; //revertedWith('ProviderError: VM Exception while processing transaction: revert transferFromWithReference failed',);

    afterERC20Balance = await token.balanceOf(payeeOne);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance);
  });
});

// Allow to create easly BatchPayments input, especially for gas optimization
const getInputsBatchPayments = function (
  nbTxs: number,
  tokenAddress: string,
  recipient: string,
  amount: number,
  referenceExample1: string,
  feeAmount: number,
): [Array<string>, Array<string>, Array<number>, Array<string>, Array<number>] {
  let tokenAddresses = [];
  let recipients = [];
  let amounts = [];
  let paymentReferences = [];
  let feeAmounts = [];

  for (let i = 0; i < nbTxs; i++) {
    tokenAddresses.push(tokenAddress);
    recipients.push(recipient);
    amounts.push(amount);
    paymentReferences.push(referenceExample1);
    feeAmounts.push(feeAmount);
  }
  return [tokenAddresses, recipients, amounts, paymentReferences, feeAmounts];
};
