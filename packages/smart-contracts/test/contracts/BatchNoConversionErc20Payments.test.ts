import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect } from 'chai';
import {
  TestERC20__factory,
  TestERC20,
  ERC20FeeProxy,
  EthereumFeeProxy__factory,
  BatchNoConversionPayments,
  ERC20FeeProxy__factory,
  BatchNoConversionPayments__factory,
  ChainlinkConversionPath,
} from '../../src/types';
import { chainlinkConversionPath } from '../../src/lib';
import { CurrencyManager } from '@requestnetwork/currency';
import { RequestDetail } from 'types/dist/payment-types';

const logGasInfos = false;

describe('contract: batchNoConversionPayments: ERC20', () => {
  let payee1: string;
  let payee2: string;
  let payee3: string;
  let ownerAddress: string;
  let spender1Address: string;
  let spender2Address: string;
  let spender3Address: string;

  let feeAddress: string;

  let token1: TestERC20;
  let token2: TestERC20;
  let token3: TestERC20;
  let batch: BatchNoConversionPayments;
  let chainlinkPath: ChainlinkConversionPath;
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

  const currencyManager = CurrencyManager.getDefault();
  const USD_hash = currencyManager.fromSymbol('USD')!.hash;

  before(async () => {
    [, payee1, payee2, payee3, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [owner, spender1, spender2, spender3] = await ethers.getSigners();

    erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
    const ethFeeProxy = await new EthereumFeeProxy__factory(owner).deploy();
    chainlinkPath = chainlinkConversionPath.connect(network.name, owner);
    batch = await new BatchNoConversionPayments__factory(owner).deploy(
      erc20FeeProxy.address,
      ethFeeProxy.address,
      chainlinkPath.address,
      await owner.getAddress(),
    );
    token1 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    token2 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    token3 = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));

    ownerAddress = await owner.getAddress();
    spender1Address = await spender1.getAddress();
    spender2Address = await spender2.getAddress();
    spender3Address = await spender3.getAddress();
    token1Address = token1.address;
    token2Address = token2.address;
    token3Address = token3.address;
    batchAddress = batch.address;

    await batch.connect(owner).setBatchFee(1000);
    // batch fee amount USD limited to 1$
    await batch.connect(owner).setBatchFeeAmountUSDLimit(BigNumber.from(1e8).div(1000));
  });

  beforeEach(async () => {
    // reset every amount of tokens and approvals.
    await token1.connect(spender1).transfer(ownerAddress, await token1.balanceOf(spender1Address));
    await token1.connect(spender2).transfer(ownerAddress, await token1.balanceOf(spender2Address));
    await token1.connect(spender3).transfer(ownerAddress, await token1.balanceOf(spender3Address));

    await token1.connect(spender1).approve(batchAddress, 0);
    await token1.connect(spender3).approve(batchAddress, 0);

    // 2nd token
    await token2.connect(spender3).transfer(ownerAddress, await token2.balanceOf(spender3Address));
    await token1.connect(spender3).approve(batchAddress, 0);

    // 3nd token
    await token3.connect(spender3).transfer(ownerAddress, await token3.balanceOf(spender3Address));
    await token3.connect(spender3).approve(batchAddress, 0);
  });

  describe('Batch working well: right args, and approvals', () => {
    it('Should pay 3 ERC20 payments with paymentRef and pay batch fee', async () => {
      await token1.connect(owner).transfer(spender3Address, 1000);
      await token1.connect(spender3).approve(batchAddress, 1000);

      beforeERC20Balance1 = await token1.balanceOf(payee1);
      beforeERC20Balance2 = await token1.balanceOf(payee2);
      beforeERC20Balance3 = await token1.balanceOf(spender3Address);

      await expect(
        batch.connect(spender3).batchERC20Payments(
          [
            {
              recipient: payee1,
              requestAmount: 200,
              path: [token1Address],
              paymentReference: referenceExample1,
              feeAmount: 20,
              maxToSpend: '0',
              maxRateTimespan: '0',
            },
            {
              recipient: payee2,
              requestAmount: 30,
              path: [token1Address],
              paymentReference: referenceExample2,
              feeAmount: 2,
              maxToSpend: '0',
              maxRateTimespan: '0',
            },
            {
              recipient: payee2,
              requestAmount: 40,
              path: [token1Address],
              paymentReference: referenceExample3,
              feeAmount: 3,
              maxToSpend: '0',
              maxRateTimespan: '0',
            },
          ],
          [[token1Address, USD_hash]],
          0,
          feeAddress,
        ),
      )
        .to.emit(token1, 'Transfer')
        .withArgs(spender3Address, batchAddress, 200 + 30 + 40 + 20 + 2 + 3)
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token1Address,
          payee1,
          '200',
          ethers.utils.keccak256(referenceExample1),
          '20',
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
          27, // batch fee amount = (200+30+40)*10%
        );

      afterERC20Balance1 = await token1.balanceOf(payee1);
      expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(200));
      afterERC20Balance2 = await token1.balanceOf(payee2);
      expect(afterERC20Balance2).to.be.equal(beforeERC20Balance2.add(30 + 40));
      afterERC20Balance3 = await token1.balanceOf(spender3Address);
      expect(beforeERC20Balance3).to.be.equal(
        afterERC20Balance3.add(200 + 20 + 20 + (30 + 2 + 3) + (40 + 3 + 4)),
      );
    });

    it('Should pay 3 ERC20 payments Multi tokens with paymentRef and pay batch fee', async () => {
      await token1.connect(owner).transfer(spender3Address, 1000);
      await token2.connect(owner).transfer(spender3Address, 1000);
      await token3.connect(owner).transfer(spender3Address, 1000);

      await token1.connect(spender3).approve(batchAddress, 1000);
      await token2.connect(spender3).approve(batchAddress, 1000);
      await token3.connect(spender3).approve(batchAddress, 1000);

      beforeERC20Balance1 = await token1.balanceOf(payee1);
      const beforeERC20Balance2_token2 = await token2.balanceOf(payee2);
      const beforeERC20Balance2_token3 = await token3.balanceOf(payee2);
      beforeERC20Balance3 = await token1.balanceOf(spender3Address);

      const beforeFeeAddress_token1 = await token1.balanceOf(feeAddress);
      const beforeFeeAddress_token2 = await token2.balanceOf(feeAddress);
      const beforeFeeAddress_token3 = await token3.balanceOf(feeAddress);

      await expect(
        batch.connect(spender3).batchMultiERC20Payments(
          [
            {
              recipient: payee1,
              requestAmount: 500,
              path: [token1Address],
              paymentReference: referenceExample1,
              feeAmount: 60,
              maxToSpend: '0',
              maxRateTimespan: '0',
            },
            {
              recipient: payee2,
              requestAmount: 300,
              path: [token2Address],
              paymentReference: referenceExample2,
              feeAmount: 20,
              maxToSpend: '0',
              maxRateTimespan: '0',
            },
            {
              recipient: payee2,
              requestAmount: 400,
              path: [token3Address],
              paymentReference: referenceExample3,
              feeAmount: 30,
              maxToSpend: '0',
              maxRateTimespan: '0',
            },
          ],
          [],
          0,
          feeAddress,
        ),
      )
        // Transfer event of each token from the spender to the batch proxy
        .to.emit(token1, 'Transfer')
        .withArgs(spender3Address, batchAddress, 500 + 60)
        .to.emit(token2, 'Transfer')
        .withArgs(spender3Address, batchAddress, 300 + 20)
        .to.emit(token3, 'Transfer')
        .withArgs(spender3Address, batchAddress, 400 + 30)
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token1Address,
          payee1,
          '500',
          ethers.utils.keccak256(referenceExample1),
          '60',
          feeAddress,
        )
        .to.emit(token2, 'Transfer')
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token2Address,
          payee2,
          '300',
          ethers.utils.keccak256(referenceExample2),
          '20',
          feeAddress,
        )
        .to.emit(token3, 'Transfer')
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          token3Address,
          payee2,
          '400',
          ethers.utils.keccak256(referenceExample3),
          '30',
          feeAddress,
        )
        // batch fee amount from the spender to feeAddress for each token
        .to.emit(token1, 'Transfer')
        .withArgs(
          spender3Address,
          feeAddress,
          50, // batch fee amount = 500*10%
        )
        .to.emit(token2, 'Transfer')
        .withArgs(spender3Address, feeAddress, 30)
        .to.emit(token3, 'Transfer')
        .withArgs(spender3Address, feeAddress, 40);

      expect(await token1.balanceOf(payee1)).to.be.equal(beforeERC20Balance1.add(500));
      expect(await token2.balanceOf(payee2)).to.be.equal(beforeERC20Balance2_token2.add(300));
      expect(await token3.balanceOf(payee2)).to.be.equal(beforeERC20Balance2_token3.add(400));
      expect(beforeERC20Balance3).to.be.equal(
        (await token1.balanceOf(spender3Address)).add(500 + 60 + 50),
      );

      expect(await token1.balanceOf(feeAddress)).to.be.equal(beforeFeeAddress_token1.add(50 + 60));
      expect(await token2.balanceOf(feeAddress)).to.be.equal(beforeFeeAddress_token2.add(20 + 30));
      expect(await token3.balanceOf(feeAddress)).to.be.equal(
        beforeFeeAddress_token3.add((30 + 40) * 1),
      );
    });

    it('Should pay 3 ERC20 payments Multi tokens, with one payment of 0 token', async () => {
      await token1.connect(owner).transfer(spender3Address, 1000);
      await token2.connect(owner).transfer(spender3Address, 1000);
      await token3.connect(owner).transfer(spender3Address, 1000);

      await token1.connect(spender3).approve(batchAddress, 1000);
      await token2.connect(spender3).approve(batchAddress, 1000);
      await token3.connect(spender3).approve(batchAddress, 1000);

      beforeERC20Balance1 = await token1.balanceOf(payee1);
      const beforeERC20Balance2_token2 = await token2.balanceOf(payee2);
      const beforeERC20Balance2_token3 = await token3.balanceOf(payee2);
      beforeERC20Balance3 = await token1.balanceOf(spender3Address);

      const beforeFeeAddress_token1 = await token1.balanceOf(feeAddress);
      const beforeFeeAddress_token2 = await token2.balanceOf(feeAddress);
      const beforeFeeAddress_token3 = await token3.balanceOf(feeAddress);

      const tx = await batch.connect(spender3).batchMultiERC20Payments(
        [
          {
            recipient: payee1,
            requestAmount: 500,
            path: [token1Address],
            paymentReference: referenceExample1,
            feeAmount: 60,
            maxToSpend: '0',
            maxRateTimespan: '0',
          },
          {
            recipient: payee2,
            requestAmount: 0,
            path: [token2Address],
            paymentReference: referenceExample2,
            feeAmount: 0,
            maxToSpend: '0',
            maxRateTimespan: '0',
          },
          {
            recipient: payee2,
            requestAmount: 400,
            path: [token3Address],
            paymentReference: referenceExample3,
            feeAmount: 30,
            maxToSpend: '0',
            maxRateTimespan: '0',
          },
        ],
        [
          [token1Address, USD_hash],
          [token2Address, USD_hash],
          [token3Address, USD_hash],
        ],
        0,
        feeAddress,
      );

      await tx.wait();

      expect(await token1.balanceOf(payee1)).to.be.equal(beforeERC20Balance1.add(500));
      expect(await token2.balanceOf(payee2)).to.be.equal(beforeERC20Balance2_token2.add(0));
      expect(await token3.balanceOf(payee2)).to.be.equal(beforeERC20Balance2_token3.add(400));
      expect(beforeERC20Balance3).to.be.equal(
        (await token1.balanceOf(spender3Address)).add(500 + 60 + 50),
      );

      expect(await token1.balanceOf(feeAddress)).to.be.equal(beforeFeeAddress_token1.add(50 + 60));
      expect(await token2.balanceOf(feeAddress)).to.be.equal(beforeFeeAddress_token2.add(0));
      expect(await token3.balanceOf(feeAddress)).to.be.equal(
        beforeFeeAddress_token3.add((30 + 40) * 1),
      );
    });

    it('Should pay 4 ERC20 payments on 2 tokens', async () => {
      await token1.connect(owner).transfer(spender3Address, 1000);
      await token2.connect(owner).transfer(spender3Address, 1000);

      await token1.connect(spender3).approve(batchAddress, 1000);
      await token2.connect(spender3).approve(batchAddress, 1000);

      beforeERC20Balance1 = await token1.balanceOf(payee2);
      beforeERC20Balance2 = await token2.balanceOf(payee2);
      beforeERC20Balance3 = await token1.balanceOf(spender3Address);
      const beforeERC20Balance3Token2 = await token2.balanceOf(spender3Address);

      const amount = 20;
      const feeAmount = 1;

      const tx = await batch.connect(spender3).batchMultiERC20Payments(
        [
          ...Array(2).fill({
            recipient: payee2,
            requestAmount: amount,
            path: [token1Address],
            paymentReference: referenceExample1,
            feeAmount: feeAmount,
            maxToSpend: '0',
            maxRateTimespan: '0',
          }),
          ...Array(2).fill({
            recipient: payee2,
            requestAmount: amount,
            path: [token2Address],
            paymentReference: referenceExample1,
            feeAmount: feeAmount,
            maxToSpend: '0',
            maxRateTimespan: '0',
          }),
        ],
        [
          [token1Address, USD_hash],
          [token2Address, USD_hash],
        ],
        0,
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

    it('Should pay 10 ERC20 payments', async () => {
      await token1.connect(owner).transfer(spender3Address, 1000);
      await token1.connect(spender3).approve(batchAddress, 1000);

      beforeERC20Balance1 = await token1.balanceOf(payee1);
      const beforeFeeAddress_token1 = await token1.balanceOf(feeAddress);

      const amount = 20;
      const feeAmount = 10;
      const nbTxs = 10;

      const tx = await batch.connect(spender3).batchERC20Payments(
        [
          ...Array(nbTxs).fill({
            recipient: payee1,
            requestAmount: amount,
            path: [token1Address],
            paymentReference: referenceExample1,
            feeAmount: feeAmount,
            maxToSpend: '0',
            maxRateTimespan: '0',
          }),
        ],
        [[token1Address, USD_hash]],
        0,
        feeAddress,
      );
      await tx.wait();

      const receipt = await tx.wait();
      if (logGasInfos) {
        console.log(`nbTxs= ${nbTxs}, gas consumption: `, receipt.gasUsed.toString());
      }

      afterERC20Balance1 = await token1.balanceOf(payee1);
      expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * nbTxs));
      const afterFeeAddress_token1 = await token1.balanceOf(feeAddress);
      expect(afterFeeAddress_token1).to.be.equal(
        beforeFeeAddress_token1.add(feeAmount * nbTxs + (amount * nbTxs) / 10),
      );
    });

    it('Should pay 10 ERC20 payments on multiple tokens', async () => {
      await token1.connect(owner).transfer(spender3Address, 1000);
      await token2.connect(owner).transfer(spender3Address, 1000);

      await token1.connect(spender3).approve(batchAddress, 1000);
      await token2.connect(spender3).approve(batchAddress, 1000);

      beforeERC20Balance1 = await token1.balanceOf(payee1);
      beforeERC20Balance2 = await token2.balanceOf(payee1);

      const amount = 20;
      const feeAmount = 10;

      const tx = await batch.connect(spender3).batchMultiERC20Payments(
        [
          ...Array(5).fill({
            recipient: payee1,
            requestAmount: amount,
            path: [token1Address],
            paymentReference: referenceExample1,
            feeAmount: feeAmount,
            maxToSpend: '0',
            maxRateTimespan: '0',
          }),
          ...Array(5).fill({
            recipient: payee1,
            requestAmount: amount,
            path: [token2Address],
            paymentReference: referenceExample1,
            feeAmount: feeAmount,
            maxToSpend: '0',
            maxRateTimespan: '0',
          }),
        ],
        [
          [token1Address, USD_hash],
          [token2Address, USD_hash],
        ],
        0,
        feeAddress,
      );

      const receipt = await tx.wait();
      if (logGasInfos) {
        console.log(`nbTxs=10, gas consumption: `, receipt.gasUsed.toString());
      }

      afterERC20Balance1 = await token1.balanceOf(payee1);
      expect(afterERC20Balance1).to.be.equal(beforeERC20Balance1.add(amount * 5)); // 5 txs on token1
      afterERC20Balance2 = await token2.balanceOf(payee1);
      expect(afterERC20Balance2).to.be.equal(beforeERC20Balance2.add(amount * 5)); // 5 txs on token2
    });
  });

  describe('Batch revert, issues with: args, or funds, or approval', () => {
    let requestDetails: RequestDetail[] = [];
    beforeEach(async () => {
      requestDetails = [
        {
          recipient: payee1,
          requestAmount: '5',
          path: [token1Address],
          paymentReference: referenceExample1,
          feeAmount: '1',
          maxToSpend: '0',
          maxRateTimespan: '0',
        },
        {
          recipient: payee2,
          requestAmount: '30',
          path: [token1Address],
          paymentReference: referenceExample2,
          feeAmount: '2',
          maxToSpend: '0',
          maxRateTimespan: '0',
        },
        {
          recipient: payee3,
          requestAmount: '40',
          path: [token1Address],
          paymentReference: referenceExample3,
          feeAmount: '3',
          maxToSpend: '0',
          maxRateTimespan: '0',
        },
      ];
    });

    it('Should revert batch if not enough funds to pay the request', async () => {
      await token1.connect(owner).transfer(spender3Address, 100);
      await token1.connect(spender3).approve(batchAddress, 1000);

      requestDetails[2].requestAmount = '400';
      await expect(
        batch
          .connect(spender3)
          .batchERC20Payments(requestDetails, [[token1Address, USD_hash]], 0, feeAddress),
      ).revertedWith('Not enough funds, including fees');
    });

    it('Should revert batch if not enough funds to pay the batch fee', async () => {
      await token1.connect(owner).transfer(spender3Address, 303);
      await token1.connect(spender3).approve(batchAddress, 1000);

      requestDetails[0].requestAmount = '100';
      requestDetails[1].requestAmount = '200';
      await expect(
        batch
          .connect(spender3)
          .batchERC20Payments(
            requestDetails.slice(0, 2),
            [[token1Address, USD_hash]],
            0,
            feeAddress,
          ),
      ).revertedWith('Not enough funds, including fees');
    });

    it('Should revert batch without approval', async () => {
      await token1.connect(owner).transfer(spender3Address, 303);
      await token1.connect(spender3).approve(batchAddress, 10);
      requestDetails[0].requestAmount = '20';
      await expect(
        batch
          .connect(spender3)
          .batchERC20Payments(requestDetails, [[token1Address, USD_hash]], 0, feeAddress),
      ).revertedWith('Insufficient allowance for batch to pay');
    });

    it('Should revert batch multi tokens if not enough funds', async () => {
      await token1.connect(owner).transfer(spender3Address, 400);
      await token1.connect(spender3).approve(batchAddress, 1000);

      requestDetails[2].requestAmount = '400';
      await expect(
        batch
          .connect(spender3)
          .batchMultiERC20Payments(requestDetails, [[token1Address, USD_hash]], 0, feeAddress),
      ).revertedWith('Not enough funds');
    });

    it('Should revert batch multi tokens if not enough funds to pay the batch fee', async () => {
      await token1.connect(owner).transfer(spender3Address, 607);
      await token1.connect(spender3).approve(batchAddress, 1000);

      requestDetails[0].requestAmount = '100';
      requestDetails[1].requestAmount = '200';
      requestDetails[2].requestAmount = '300';
      requestDetails[2].recipient = payee2;
      await expect(
        batch
          .connect(spender3)
          .batchMultiERC20Payments(requestDetails, [[token1Address, USD_hash]], 0, feeAddress),
      ).revertedWith('Not enough funds');
    });

    it('Should revert batch multi tokens without approval', async () => {
      await token1.connect(owner).transfer(spender3Address, 1000);
      await token1.connect(spender3).approve(batchAddress, 10);

      requestDetails[0].requestAmount = '100';
      requestDetails[1].requestAmount = '200';
      requestDetails[2].requestAmount = '300';
      await expect(
        batch
          .connect(spender3)
          .batchMultiERC20Payments(requestDetails, [[token1Address, USD_hash]], 0, feeAddress),
      ).revertedWith('Insufficient allowance for batch to pay');
    });
  });
});
