import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { TestERC20__factory, TestERC20, BatchPayments } from '../../src/types';
import { batchPaymentsArtifact } from '../../src/lib';

use(solidity);

const logGasInfos = false;

describe('contract: BatchPayments: ERC20', () => {
  let payee1: string;
  let payee2: string;
  let payee3: string;
  let feeAddress: string;

  let token1: TestERC20;
  let token2: TestERC20;
  let batch: BatchPayments;

  let token1Address: string;
  let token2Address: string;
  let batchAddress: string;

  let owner: Signer;
  let spender1: Signer;
  let spender2: Signer;
  let spender3: Signer;

  let beforeERC20Balance1: BigNumber;
  let afterERC20Balance1: BigNumber;
  let beforeERC20Balance2: BigNumber;
  let afterERC20Balance2: BigNumber;

  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';
  const referenceExample3 = '0xcccc';

  const erc20Decimal = BigNumber.from('1000000000000000000');

  before(async () => {
    [, payee1, payee2, payee3, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [owner, spender1, spender2, spender3] = await ethers.getSigners();
    batch = batchPaymentsArtifact.connect(network.name, owner);
    token1 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    token2 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));

    const spender1Address = await spender1.getAddress();
    const spender2Address = await spender2.getAddress();
    const spender3Address = await spender3.getAddress();
    token1Address = token1.address;
    token2Address = token2.address;
    batchAddress = batch.address;

    await token1.connect(owner).transfer(spender1Address, 1000);
    await token1.connect(owner).transfer(spender2Address, 160);
    await token1.connect(owner).transfer(spender3Address, 160);
    await token1.connect(spender1).approve(batchAddress, 1000);
    await token1.connect(spender3).approve(batchAddress, 170);
    // token1.allowance(spender1Address, batchAddress).call;
    // await token1.connect(spender1).allowance.call(spender1Address, batchAddress);
    // console.log("allowaance", )

    // 2nd token
    await token2.connect(owner).transfer(spender3Address, 1000);
    await token2.connect(spender3).approve(batchAddress, 1000);
  });

  it('Should pay 3 ERC20 payments with paymentRef', async function () {
    beforeERC20Balance1 = await token1.balanceOf(payee1);
    beforeERC20Balance2 = await token1.balanceOf(payee2);

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2, payee2],
          [20, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    )
      .to.emit(token1, 'Transfer')
      .to.emit(token1, 'Transfer')
      .to.emit(token1, 'Transfer')
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        token1Address,
        payee1,
        '20',
        ethers.utils.keccak256(referenceExample1),
        '1',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        token1Address,
        payee2,
        '30',
        ethers.utils.keccak256(referenceExample2),
        '2',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        token1Address,
        payee2,
        '40',
        ethers.utils.keccak256(referenceExample3),
        '3',
        feeAddress,
      );

    afterERC20Balance1 = await token1.balanceOf(payee1);
    expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(20));
    afterERC20Balance2 = await token1.balanceOf(payee2);
    expect(afterERC20Balance2).to.be.equal(beforeERC20Balance2.add(30 + 40));
  });

  it('Should pay 4 ERC20 payments on 2 tokens', async function () {
    beforeERC20Balance1 = await token1.balanceOf(payee2);
    beforeERC20Balance2 = await token2.balanceOf(payee2);

    const amount = 2;
    const feeAmount = 1;
    const nbTxs = 4;
    const [
      tokenAddresses,
      recipients,
      amounts,
      paymentReferences,
      feeAmounts,
    ] = getBatchPaymentsInputs(nbTxs, token1Address, payee2, amount, referenceExample1, feeAmount);

    tokenAddresses[2] = token2Address;
    tokenAddresses[3] = token2Address;

    const tx = await batch
      .connect(spender3)
      .batchERC20PaymentsMultiTokensWithReference(
        tokenAddresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
        feeAddress,
      );
    await tx.wait();

    afterERC20Balance1 = await token1.balanceOf(payee2);
    expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * 2));

    afterERC20Balance2 = await token2.balanceOf(payee2);
    expect(afterERC20Balance2).to.be.equal(beforeERC20Balance2.add(amount * 2));
  });

  it('Should pay 100 ERC20 payments', async function () {
    beforeERC20Balance1 = await token1.balanceOf(payee3);

    const amount = 2;
    const feeAmount = 1;
    const nbTxs = 100;
    const [
      token1Addresses,
      recipients,
      amounts,
      paymentReferences,
      feeAmounts,
    ] = getBatchPaymentsInputs(nbTxs, token1Address, payee3, amount, referenceExample1, feeAmount);

    const tx = await batch
      .connect(spender1)
      .batchERC20PaymentsWithReference(
        token1Addresses[0],
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
        feeAddress,
      );
    await tx.wait();

    afterERC20Balance1 = await token1.balanceOf(payee3);
    expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * nbTxs));
  });

  it('Should pay 100 ERC20 payments on multiple tokens', async function () {
    beforeERC20Balance1 = await token1.balanceOf(payee3);

    const amount = 2;
    const feeAmount = 1;
    const nbTxs = 100;
    const [
      token1Addresses,
      recipients,
      amounts,
      paymentReferences,
      feeAmounts,
    ] = getBatchPaymentsInputs(nbTxs, token1Address, payee3, amount, referenceExample1, feeAmount);

    const tx = await batch
      .connect(spender1)
      .batchERC20PaymentsMultiTokensWithReference(
        token1Addresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
        feeAddress,
      );

    const receipt = await tx.wait();
    if (logGasInfos) {
      console.log(`nbTxs= ${nbTxs}, gas consumption: `, receipt.gasUsed.toString());
    }

    afterERC20Balance1 = await token1.balanceOf(payee3);
    expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * nbTxs));
  });

  it('Should revert batch if not enough funds', async function () {
    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2, payee3],
          [5, 30, 400],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('revert transferFromWithReference failed');
  });

  it('Should revert batch without approval', async function () {
    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2, payee3],
          [20, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('revert transferFromWithReference failed');
  });

  it('Should revert batch multi tokens if not enough funds', async function () {
    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address, token1Address],
          [payee1, payee2, payee3],
          [5, 30, 400],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('revert transferFromWithReference failed');
  });

  it('Should revert batch multi tokens without approval', async function () {
    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address, token1Address],
          [payee1, payee2, payee3],
          [20, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('revert transferFromWithReference failed');
  });

  it('Should revert batch multi tokens if input s arrays do not have same size', async function () {
    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address],
          [payee1, payee2, payee3],
          [5, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address, token1Address],
          [payee1, payee2],
          [5, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address, token1Address],
          [payee1, payee2, payee3],
          [5, 30],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address, token1Address],
          [payee1, payee2, payee3],
          [5, 30, 40],
          [referenceExample1, referenceExample2],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address, token1Address],
          [payee1, payee2, payee3],
          [5, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');
  });

  it('Should revert batch if input s arrays do not have same size', async function () {
    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2, payee3],
          [5, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2],
          [5, 30, 40],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2, payee3],
          [5, 30],
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');

    await expect(
      batch
        .connect(spender3)
        .batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2, payee3],
          [5, 30, 40],
          [referenceExample1, referenceExample2],
          [1, 2, 3],
          feeAddress,
        ),
    ).revertedWith('the input arrays must have the same length');
  });
});

// Allow to create easly BatchPayments input, especially for gas optimization
const getBatchPaymentsInputs = function (
  nbTxs: number,
  token1Address: string,
  recipient: string,
  amount: number,
  referenceExample1: string,
  feeAmount: number,
): [Array<string>, Array<string>, Array<number>, Array<string>, Array<number>] {
  let token1Addresses = [];
  let recipients = [];
  let amounts = [];
  let paymentReferences = [];
  let feeAmounts = [];

  for (let i = 0; i < nbTxs; i++) {
    token1Addresses.push(token1Address);
    recipients.push(recipient);
    amounts.push(amount);
    paymentReferences.push(referenceExample1);
    feeAmounts.push(feeAmount);
  }
  return [token1Addresses, recipients, amounts, paymentReferences, feeAmounts];
};
