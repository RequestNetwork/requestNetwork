import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { EthereumFeeProxy, BatchPayments } from '../../src/types';
import { batchPaymentsArtifact } from '../../src/lib';

import { ethereumFeeProxyArtifact } from '../../src/lib/';
import { HttpNetworkConfig } from 'hardhat/types';

use(solidity);

const logInfos = false;

describe('contract: BatchPayments: Ethereum', () => {
  let ownerAddress: string;
  let payeeOne: string;
  let payeeTwo: string;
  let feeAddress: string;
  let batchAddress: string;

  let owner: Signer;

  let beforeEthBalance: BigNumber;
  let beforeEthBalance1: BigNumber;
  let afterEthBalance: BigNumber;
  let afterEthBalance1: BigNumber;

  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';

  let ethFeeProxy: EthereumFeeProxy;
  let batch: BatchPayments;
  const networkConfig = network.config as HttpNetworkConfig;
  const provider = new ethers.providers.JsonRpcProvider(networkConfig.url);

  let amount = 100;
  let feeAmount = 1;
  let nbTxs: number;
  let tx;

  before(async () => {
    [, payeeOne, payeeTwo, feeAddress] = (await ethers.getSigners()).map((s) => s.address);
    [owner] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();

    ethFeeProxy = ethereumFeeProxyArtifact.connect(network.name, owner);
    let ethFeeProxyAddress = ethFeeProxy.address;

    batch = batchPaymentsArtifact.connect(network.name, owner);
    batchAddress = batch.address;

    if (logInfos) {
      console.log('ethFeeProxyAddress addr', ethFeeProxyAddress);
      console.log('batch addr', batchAddress);
      console.log(
        'batch Erc20 proxy addr',
        await batch.paymentErc20FeeProxy.call({ from: ownerAddress }),
      );
      console.log(
        'batch Eth proxy addr',
        await batch.paymentEthereumFeeProxy.call({ from: ownerAddress }),
      );
    }
  });

  it('Should pay 2 payments and return the excess of ethers', async function () {
    beforeEthBalance = await provider.getBalance(payeeOne);
    let totalAmout = BigNumber.from('1000');

    await expect(
      batch
        .connect(owner)
        .batchEthereumPaymentsWithReferenceAndFee(
          [payeeOne, payeeTwo],
          [20, 30],
          [referenceExample1, referenceExample2],
          [1, 2],
          feeAddress,
          {
            value: totalAmout,
          },
        ),
    )
      .to.emit(ethFeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(payeeOne, '20', ethers.utils.keccak256(referenceExample1), '1', feeAddress)
      .to.emit(ethFeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(payeeTwo, '30', ethers.utils.keccak256(referenceExample2), '2', feeAddress);

    afterEthBalance = await provider.getBalance(payeeOne);
    expect(afterEthBalance).to.be.equal(beforeEthBalance.add(20));
    expect(await provider.getBalance(batchAddress)).to.be.equal(0);
  });

  it('Should pay 2 payments with the exact amount', async function () {
    beforeEthBalance = await provider.getBalance(payeeOne);
    beforeEthBalance1 = await provider.getBalance(payeeTwo);
    let totalAmout = BigNumber.from('53');

    tx = await batch
      .connect(owner)
      .batchEthereumPaymentsWithReferenceAndFee(
        [payeeOne, payeeTwo],
        [20, 30],
        [referenceExample1, referenceExample2],
        [1, 2],
        feeAddress,
        {
          value: totalAmout,
        },
      );
    await tx.wait();

    afterEthBalance = await provider.getBalance(payeeOne);
    expect(afterEthBalance).to.be.equal(beforeEthBalance.add(20));

    afterEthBalance1 = await provider.getBalance(payeeTwo);
    expect(afterEthBalance1).to.be.equal(beforeEthBalance1.add(30));
  });

  it('Gas evaluation: Should pay multiple Ethereum payments', async function () {
    let listTxs = [1, 12]; // [1, 4, 8, 12, 30, 100]; //
    for (let i = 0; i < listTxs.length; i += 1) {
      beforeEthBalance = await provider.getBalance(payeeTwo);
      nbTxs = listTxs[i];
      let [_, recipients, amounts, paymentReferences, feeAmounts] = getInputsBatchPayments(
        nbTxs,
        '_noTokenAddress',
        payeeTwo,
        amount,
        referenceExample1,
        feeAmount,
      );
      let totalAmount = BigNumber.from(((amount + feeAmount) * nbTxs).toString());

      tx = await batch
        .connect(owner)
        .batchEthereumPaymentsWithReferenceAndFee(
          recipients,
          amounts,
          paymentReferences,
          feeAmounts,
          feeAddress,
          {
            value: totalAmount,
          },
        );

      const receipt = await tx.wait();
      if (logInfos) {
        console.log(`nbTxs= ${nbTxs}, gas consumption: `, receipt.gasUsed.toString());
      }

      afterEthBalance = await provider.getBalance(payeeTwo);
      expect(afterEthBalance).to.be.equal(beforeEthBalance.add(amount * nbTxs));
    }
  });

  it('Should revert and any payment is achieved because funds are not sufficient', async function () {
    beforeEthBalance = await provider.getBalance(payeeOne);
    beforeEthBalance1 = await provider.getBalance(payeeTwo);
    let totalAmout = BigNumber.from('40');

    await expect(
      batch
        .connect(owner)
        .batchEthereumPaymentsWithReferenceAndFee(
          [payeeOne, payeeTwo],
          [20, 30],
          [referenceExample1, referenceExample2],
          [1, 2],
          feeAddress,
          {
            value: totalAmout,
          },
        ),
    ).to.be.reverted;

    afterEthBalance = await provider.getBalance(payeeOne);
    expect(afterEthBalance).to.be.equal(beforeEthBalance);

    afterEthBalance1 = await provider.getBalance(payeeTwo);
    expect(afterEthBalance1).to.be.equal(beforeEthBalance1);
  });
});

// Allow to create easly BatchPayments input, especially for gas optimization. tokenAddress is unused for batch Ethereum
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
