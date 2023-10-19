import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect } from 'chai';
import { deepCopy } from '@requestnetwork/utils';
import {
  EthereumFeeProxy__factory,
  BatchNoConversionPayments__factory,
  ERC20FeeProxy__factory,
  ChainlinkConversionPath,
} from '../../src/types.js';
import { EthereumFeeProxy, BatchNoConversionPayments } from '../../src/types.js';
import { chainlinkConversionPath } from '../../src/lib.js';
import { HttpNetworkConfig } from 'hardhat/types';
import { PaymentTypes } from 'types/dist';
import { CurrencyManager, EvmChains } from '@requestnetwork/currency';

const logGasInfos = false;

describe('contract: batchNoConversionPayments: Ethereum', () => {
  let payee1: string;
  let payee2: string;
  let feeAddress: string;
  let batchAddress: string;

  let owner: Signer;
  let payee1Sig: Signer;

  let beforeEthBalance1: BigNumber;
  let beforeEthBalance2: BigNumber;
  let afterEthBalance1: BigNumber;
  let afterEthBalance2: BigNumber;

  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';

  let ethFeeProxy: EthereumFeeProxy;
  let chainlinkPath: ChainlinkConversionPath;
  let batch: BatchNoConversionPayments;
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);
  const currencyManager = CurrencyManager.getDefault();

  const ethRequestDetail1: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '200',
    path: [],
    paymentReference: referenceExample1,
    feeAmount: '10',
    maxToSpend: '0',
    maxRateTimespan: '0',
  };
  const ethRequestDetail2: PaymentTypes.RequestDetail = {
    recipient: '',
    requestAmount: '300',
    path: [],
    paymentReference: referenceExample2,
    feeAmount: '20',
    maxToSpend: '0',
    maxRateTimespan: '0',
  };

  before(async () => {
    [, payee1, payee2, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [owner, payee1Sig] = await ethers.getSigners();

    const erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
    ethFeeProxy = await new EthereumFeeProxy__factory(owner).deploy();
    EvmChains.assertChainSupported(network.name);
    chainlinkPath = chainlinkConversionPath.connect(network.name, owner);
    batch = await new BatchNoConversionPayments__factory(owner).deploy(
      erc20FeeProxy.address,
      ethFeeProxy.address,
      chainlinkPath.address,
      await owner.getAddress(),
    );
    batchAddress = batch.address;
    await batch.connect(owner).setBatchFee(100);
    await batch.setBatchFeeAmountUSDLimit(BigNumber.from(1e8).div(1000)); // 1$
    await batch.setNativeAndUSDAddress(
      currencyManager.fromSymbol('ETH')!.hash,
      currencyManager.fromSymbol('USD')!.hash,
    );
    ethRequestDetail1.recipient = payee1;
    ethRequestDetail2.recipient = payee2;
  });

  describe('Batch Eth normal flow', () => {
    it('Should pay 2 payments and contract do not keep funds of ethers', async () => {
      const beforeEthBalanceFee = await provider.getBalance(feeAddress);
      beforeEthBalance1 = await provider.getBalance(payee1);
      beforeEthBalance2 = await provider.getBalance(payee2);

      const copyEthRequestDetail1 = deepCopy(ethRequestDetail1);
      copyEthRequestDetail1.requestAmount = '2000';
      copyEthRequestDetail1.feeAmount = '100';

      const copyEthRequestDetail2 = deepCopy(ethRequestDetail2);
      copyEthRequestDetail2.requestAmount = '3000';
      copyEthRequestDetail2.feeAmount = '200';
      await expect(
        batch
          .connect(owner)
          .batchNativePayments([copyEthRequestDetail1, copyEthRequestDetail2], true, feeAddress, {
            value: BigNumber.from('6000'),
          }),
      )
        .to.emit(ethFeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(payee1, '2000', ethers.utils.keccak256(referenceExample1), '100', feeAddress)
        .to.emit(ethFeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(payee2, '3000', ethers.utils.keccak256(referenceExample2), '200', feeAddress);

      const afterEthBalanceFee = await provider.getBalance(feeAddress);
      expect(afterEthBalanceFee).to.be.equal(beforeEthBalanceFee.add(100 + 20 + 200 + 30));

      afterEthBalance1 = await provider.getBalance(payee1);
      expect(afterEthBalance1).to.be.equal(beforeEthBalance1.add(2000));

      afterEthBalance2 = await provider.getBalance(payee2);
      expect(afterEthBalance2).to.be.equal(beforeEthBalance2.add(3000));

      expect(await provider.getBalance(batchAddress)).to.be.equal(0);
    });

    it('Should pay 2 payments with the exact amount', async () => {
      beforeEthBalance1 = await provider.getBalance(payee1);
      beforeEthBalance2 = await provider.getBalance(payee2);

      const totalAmount = BigNumber.from('535'); // amount: 200+300, fee: 10+20, batchFee: 2+3

      const tx = await batch
        .connect(owner)
        .batchNativePayments([ethRequestDetail1, ethRequestDetail2], true, feeAddress, {
          value: totalAmount,
        });
      await tx.wait();

      afterEthBalance1 = await provider.getBalance(payee1);
      expect(afterEthBalance1).to.be.equal(beforeEthBalance1.add(200));

      afterEthBalance2 = await provider.getBalance(payee2);
      expect(afterEthBalance2).to.be.equal(beforeEthBalance2.add(300));

      expect(await provider.getBalance(batchAddress)).to.be.equal(0);
    });

    it('Should pay 10 Ethereum payments', async () => {
      beforeEthBalance2 = await provider.getBalance(payee2);

      const amount = 2;
      const feeAmount = 1;
      const nbTxs = 10; // to compare gas optim, go to 100.

      const copyEthRequestDetail = deepCopy(ethRequestDetail2);
      copyEthRequestDetail.requestAmount = amount.toString();
      copyEthRequestDetail.feeAmount = feeAmount.toString();
      const totalAmount = BigNumber.from(((amount + feeAmount) * nbTxs).toString());

      const tx = await batch
        .connect(owner)
        .batchNativePayments(Array(nbTxs).fill(copyEthRequestDetail), true, feeAddress, {
          value: totalAmount,
        });

      const receipt = await tx.wait();
      if (logGasInfos) {
        console.log(`nbTxs= ${nbTxs}, gas consumption: `, receipt.gasUsed.toString());
      }

      afterEthBalance2 = await provider.getBalance(payee2);
      expect(afterEthBalance2).to.be.equal(beforeEthBalance2.add(amount * nbTxs));

      expect(await provider.getBalance(batchAddress)).to.be.equal(0);
    });
  });

  describe('Batch revert, issues with: args, or funds', () => {
    it('Should revert batch if not enough funds', async () => {
      beforeEthBalance1 = await provider.getBalance(payee1);
      beforeEthBalance2 = await provider.getBalance(payee2);

      const totalAmount = BigNumber.from('400');

      await expect(
        batch
          .connect(owner)
          .batchNativePayments([ethRequestDetail1, ethRequestDetail2], true, feeAddress, {
            value: totalAmount,
          }),
      ).revertedWith('Not enough funds');

      afterEthBalance1 = await provider.getBalance(payee1);
      expect(afterEthBalance1).to.be.equal(beforeEthBalance1);

      afterEthBalance2 = await provider.getBalance(payee2);
      expect(afterEthBalance2).to.be.equal(beforeEthBalance2);

      expect(await provider.getBalance(batchAddress)).to.be.equal(0);
    });

    it('Should revert batch if not enough funds for the batch fee', async () => {
      beforeEthBalance1 = await provider.getBalance(payee1);
      beforeEthBalance2 = await provider.getBalance(payee2);

      const totalAmount = BigNumber.from('530'); // missing 5 (= (200+300) * 1%)

      await expect(
        batch
          .connect(owner)
          .batchNativePayments([ethRequestDetail1, ethRequestDetail2], true, feeAddress, {
            value: totalAmount,
          }),
      ).revertedWith('Not enough funds for batch fee');

      afterEthBalance1 = await provider.getBalance(payee1);
      expect(afterEthBalance1).to.be.equal(beforeEthBalance1);

      afterEthBalance2 = await provider.getBalance(payee2);
      expect(afterEthBalance2).to.be.equal(beforeEthBalance2);

      expect(await provider.getBalance(batchAddress)).to.be.equal(0);
    });
  });

  describe('Function allowed only to the owner', () => {
    it('Should allow the owner to update batchFee', async () => {
      const beforeBatchFee = BigNumber.from(await batch.batchFee.call({ from: owner }));
      let tx = await batch.connect(owner).setBatchFee(beforeBatchFee.add(100));
      await tx.wait();
      const afterBatchFee = BigNumber.from(await batch.batchFee.call({ from: owner }));
      expect(afterBatchFee).to.be.equal(beforeBatchFee.add(100));
    });

    it('Should applied the new batchFee', async () => {
      // check if batch fee applied are the one updated
      const beforeFeeAddress = await provider.getBalance(feeAddress);

      const tx = await batch
        .connect(owner)
        .batchNativePayments([ethRequestDetail1, ethRequestDetail2], true, feeAddress, {
          value: BigNumber.from('1000'),
        });
      await tx.wait();

      const afterFeeAddress = await provider.getBalance(feeAddress);
      expect(afterFeeAddress).to.be.equal(beforeFeeAddress.add(10 + 20 + (4 + 6))); // fee: (10+20), batch fee: (4+6)
    });

    it('Should revert if it is not the owner that try to update batchFee', async () => {
      await expect(batch.connect(payee1Sig).setBatchFee(300)).revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });
});
