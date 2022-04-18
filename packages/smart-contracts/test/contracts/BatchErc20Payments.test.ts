import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect } from 'chai';
import { TestERC20__factory, TestERC20, BatchPayments, ERC20FeeProxy } from '../../src/types';
import { batchPaymentsArtifact, erc20FeeProxyArtifact } from '../../src/lib';

const logGasInfos = false;

describe('contract: BatchPayments: ERC20', () => {
  let payee1: string;
  let payee2: string;
  let payee3: string;
  let spender3Address: string;
  let feeAddress: string;

  let token1: TestERC20;
  let token2: TestERC20;
  let token3: TestERC20;
  let batch: BatchPayments;
  let erc20FeeProxy: ERC20FeeProxy;

  let token1Address: string;
  let token2Address: string;
  let token3Address: string;
  let batchAddress: string;

  let owner: Signer;
  let spender1: Signer;
  let spender2: Signer;
  let spender3: Signer;

  let beforeERC20Balance1: BigNumber;
  let afterERC20Balance1: BigNumber;
  let beforeERC20Balance2: BigNumber;
  let afterERC20Balance2: BigNumber;
  let beforeERC20Balance3: BigNumber;
  let afterERC20Balance3: BigNumber;

  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';
  const referenceExample3 = '0xcccc';

  const erc20Decimal = BigNumber.from('1000000000000000000');

  before(async () => {
    [, payee1, payee2, payee3, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [owner, spender1, spender2, spender3] = await ethers.getSigners();

    erc20FeeProxy = erc20FeeProxyArtifact.connect(network.name, owner);
    batch = batchPaymentsArtifact.connect(network.name, owner);
    token1 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    token2 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    token3 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));

    const spender1Address = await spender1.getAddress();
    const spender2Address = await spender2.getAddress();
    spender3Address = await spender3.getAddress();
    token1Address = token1.address;
    token2Address = token2.address;
    token3Address = token3.address;
    batchAddress = batch.address;

    await token1.connect(owner).transfer(spender1Address, 1000);
    await token1.connect(owner).transfer(spender2Address, 160);
    await token1.connect(owner).transfer(spender3Address, 260);
    await token1.connect(spender1).approve(batchAddress, 1000);
    await token1.connect(spender3).approve(batchAddress, 370);

    // 2nd token
    await token2.connect(owner).transfer(spender1Address, 1000);
    await token2.connect(spender1).approve(batchAddress, 1000);
    await token2.connect(owner).transfer(spender3Address, 1000);
    await token2.connect(spender3).approve(batchAddress, 1000);

    // 3nd token
    await token3.connect(owner).transfer(spender3Address, 100);
    await token3.connect(spender3).approve(batchAddress, 100);

    // set batch fee at 100 (=10%) for the purpose of the tests.
    await batch.connect(owner).setBatchFee(100);
  });

  after(async () => {
    await batch.connect(owner).setBatchFee(10);
  });

  describe('Batch working well: right args, and approvals', () => {
    it('Should pay 3 ERC20 payments with paymentRef and pay batch fee', async function () {
      beforeERC20Balance1 = await token1.balanceOf(payee1);
      beforeERC20Balance2 = await token1.balanceOf(payee2);
      beforeERC20Balance3 = await token1.balanceOf(spender3Address);

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
        .withArgs(spender3Address, batchAddress, 20 + 30 + 40 + 1 + 2 + 3)
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token1Address,
          payee1,
          '20',
          ethers.utils.keccak256(referenceExample1),
          '1',
          feeAddress,
        )
        .to.emit(token1, 'Transfer')
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token1Address,
          payee2,
          '30',
          ethers.utils.keccak256(referenceExample2),
          '2',
          feeAddress,
        )
        .to.emit(token1, 'Transfer')
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token1Address,
          payee2,
          '40',
          ethers.utils.keccak256(referenceExample3),
          '3',
          feeAddress,
        )
        // batch fee amount from the spender to feeAddress
        .to.emit(token1, 'Transfer')
        .withArgs(
          spender3Address,
          feeAddress,
          9, // batch fee amount = (20+30+40)*10%
        );

      afterERC20Balance1 = await token1.balanceOf(payee1);
      expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(20));
      afterERC20Balance2 = await token1.balanceOf(payee2);
      expect(afterERC20Balance2).to.be.equal(beforeERC20Balance2.add(30 + 40));

      afterERC20Balance3 = await token1.balanceOf(spender3Address);
      expect(beforeERC20Balance3).to.be.equal(
        afterERC20Balance3.add(20 + 1 + 2 + (30 + 2 + 3) + (40 + 3 + 4)),
      );
    });

    it('Should pay 3 ERC20 payments Multi tokens with paymentRef and pay batch fee', async function () {
      beforeERC20Balance1 = await token1.balanceOf(payee1);
      const beforeERC20Balance2_token2 = await token2.balanceOf(payee2);
      const beforeERC20Balance2_token3 = await token3.balanceOf(payee2);
      beforeERC20Balance3 = await token1.balanceOf(spender3Address);

      const beforeFeeAddress_token1 = await token1.balanceOf(feeAddress);
      const beforeFeeAddress_token2 = await token2.balanceOf(feeAddress);
      const beforeFeeAddress_token3 = await token3.balanceOf(feeAddress);

      await expect(
        batch
          .connect(spender3)
          .batchERC20PaymentsMultiTokensWithReference(
            [token1Address, token2Address, token3Address],
            [payee1, payee2, payee2],
            [20, 30, 40],
            [referenceExample1, referenceExample2, referenceExample3],
            [1, 2, 3],
            feeAddress,
          ),
      )
        // Transfer event of each token from the spender to the batch proxy
        .to.emit(token1, 'Transfer')
        .withArgs(spender3Address, batchAddress, 20 + 1)
        .to.emit(token2, 'Transfer')
        .withArgs(spender3Address, batchAddress, 30 + 2)
        .to.emit(token3, 'Transfer')
        .withArgs(spender3Address, batchAddress, 40 + 3)
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token1Address,
          payee1,
          '20',
          ethers.utils.keccak256(referenceExample1),
          '1',
          feeAddress,
        )
        .to.emit(token2, 'Transfer')
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token2Address,
          payee2,
          '30',
          ethers.utils.keccak256(referenceExample2),
          '2',
          feeAddress,
        )
        .to.emit(token3, 'Transfer')
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token3Address,
          payee2,
          '40',
          ethers.utils.keccak256(referenceExample3),
          '3',
          feeAddress,
        )
        // batch fee amount from the spender to feeAddress for each token
        .to.emit(token1, 'Transfer')
        .withArgs(
          spender3Address,
          feeAddress,
          2, // batch fee amount = 20*10%
        )
        .to.emit(token2, 'Transfer')
        .withArgs(spender3Address, feeAddress, 3)
        .to.emit(token3, 'Transfer')
        .withArgs(spender3Address, feeAddress, 4);

      afterERC20Balance1 = await token1.balanceOf(payee1);
      expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(20));

      expect(await token1.balanceOf(payee1)).to.be.equal(beforeERC20Balance1.add(20));
      expect(await token2.balanceOf(payee2)).to.be.equal(beforeERC20Balance2_token2.add(30));
      expect(await token3.balanceOf(payee2)).to.be.equal(beforeERC20Balance2_token3.add(40));
      expect(beforeERC20Balance3).to.be.equal(
        (await token1.balanceOf(spender3Address)).add(20 + 1 + 2),
      );

      expect(await token1.balanceOf(feeAddress)).to.be.equal(beforeFeeAddress_token1.add(1 + 2));
      expect(await token2.balanceOf(feeAddress)).to.be.equal(beforeFeeAddress_token2.add(2 + 3));
      expect(await token3.balanceOf(feeAddress)).to.be.equal(
        beforeFeeAddress_token3.add((3 + 4) * 1),
      );
    });

    it('Should pay 4 ERC20 payments on 2 tokens', async function () {
      beforeERC20Balance1 = await token1.balanceOf(payee2);
      beforeERC20Balance2 = await token2.balanceOf(payee2);
      beforeERC20Balance3 = await token1.balanceOf(spender3Address);
      const beforeERC20Balance3Token2 = await token2.balanceOf(spender3Address);

      const amount = 20;
      const feeAmount = 1;
      const nbTxs = 4;
      const [
        tokenAddresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
      ] = getBatchPaymentsInputs(
        nbTxs,
        token1Address,
        payee2,
        amount,
        referenceExample1,
        feeAmount,
      );

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

      afterERC20Balance3 = await token1.balanceOf(spender3Address);
      expect(beforeERC20Balance3).to.be.equal(afterERC20Balance3.add((20 + 1 + 2) * 2));

      const afterERC20Balance3Token2 = await token2.balanceOf(spender3Address);
      expect(beforeERC20Balance3Token2).to.be.equal(afterERC20Balance3Token2.add((20 + 1 + 2) * 2));
    });

    it('Should pay 10 ERC20 payments', async function () {
      beforeERC20Balance1 = await token1.balanceOf(payee3);

      const amount = 2;
      const feeAmount = 1;
      const nbTxs = 10;
      const [
        token1Addresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
      ] = getBatchPaymentsInputs(
        nbTxs,
        token1Address,
        payee3,
        amount,
        referenceExample1,
        feeAmount,
      );

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

      const receipt = await tx.wait();
      if (logGasInfos) {
        console.log(`nbTxs= ${nbTxs}, gas consumption: `, receipt.gasUsed.toString());
      }

      afterERC20Balance1 = await token1.balanceOf(payee3);
      expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * nbTxs));
    });

    it('Should pay 10 ERC20 payments on multiple tokens', async function () {
      beforeERC20Balance1 = await token1.balanceOf(payee3);
      beforeERC20Balance2 = await token2.balanceOf(payee3);

      const amount = 2;
      const feeAmount = 1;
      const nbTxs = 10;
      const [
        tokenAddresses,
        recipients,
        amounts,
        paymentReferences,
        feeAmounts,
      ] = getBatchPaymentsInputs(
        nbTxs,
        token1Address,
        payee3,
        amount,
        referenceExample1,
        feeAmount,
      );

      for (let i = 0; i < 5; i++) {
        tokenAddresses[i] = token2Address;
      }

      const tx = await batch
        .connect(spender1)
        .batchERC20PaymentsMultiTokensWithReference(
          tokenAddresses,
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
      expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * 5));
      afterERC20Balance2 = await token2.balanceOf(payee3);
      expect(afterERC20Balance2).to.be.equal(beforeERC20Balance2.add(amount * 5));
    });
  });

  describe('Batch revert, issues with: args, or funds, or approval', () => {
    it('Should revert batch if not enough funds to pay the request', async function () {
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
      ).revertedWith('revert');
    });

    it('Should revert batch if not enough funds to pay the batch fee', async function () {
      await expect(
        batch.connect(spender3).batchERC20PaymentsWithReference(
          token1Address,
          [payee1, payee2],
          [5, 131], // 131 = (await token1.balanceOf(spender3Address)).sub(5+1+2)
          [referenceExample1, referenceExample2],
          [1, 2],
          feeAddress,
        ),
      ).revertedWith('revert');
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
      ).revertedWith('revert');
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
      ).revertedWith('revert');
    });

    it('Should revert batch multi tokens if not enough funds to pay the batch fee', async function () {
      await expect(
        batch.connect(spender3).batchERC20PaymentsMultiTokensWithReference(
          [token1Address, token1Address, token1Address],
          [payee1, payee2, payee2],
          [5, 30, 75], // 75 = (await token1.balanceOf(spender3Address)).sub(5+1+30+2+3)
          [referenceExample1, referenceExample2, referenceExample3],
          [1, 2, 3],
          feeAddress,
        ),
      ).revertedWith('revert');
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
      ).revertedWith('revert');
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
});

// Allow to create easly BatchPayments input, especially for gas optimization
const getBatchPaymentsInputs = function (
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
