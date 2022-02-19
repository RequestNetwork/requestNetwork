import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  TestERC20__factory,
  TestERC20,
  BatchPayments,
  BatchPayments__factory,
  ERC20Proxy,
} from '../../src/types';
import { erc20ProxyArtifact } from '../../src/lib';

use(solidity);

describe('contract: BatchPayments', () => {
  let payeeOne: string;
  let payeeTwo: string;
  let payeeThree: string;
  let payeeFour: string;

  let spenderAddress: string;
  let spender1Address: string;

  let owner: Signer;
  let spender: Signer;
  let spender1: Signer;

  let beforeERC20Balance: BigNumber;
  let afterERC20Balance: BigNumber;

  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';
  const referenceExample3 = '0xcccc';
  const referenceExample4 = '0xdddd';

  let token: TestERC20;
  let batch: BatchPayments;
  let erc20Proxy: ERC20Proxy;

  const erc20Decimal = BigNumber.from('1000000000000000000');
  const etherAmount = BigNumber.from('900000000000000000');
  const etherTransferAmount = BigNumber.from('225000000000000000');

  before(async () => {
    [, payeeOne, payeeTwo, payeeThree, payeeFour] = (await ethers.getSigners()).map(
      (s) => s.address,
    );
    [owner, spender, spender1] = await ethers.getSigners();
    spenderAddress = await spender.getAddress();
    spender1Address = await spender1.getAddress();

    erc20Proxy = erc20ProxyArtifact.connect(network.name, owner);
    token = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    batch = await new BatchPayments__factory(owner).deploy(erc20Proxy.address);

    await token.connect(owner).transfer(spenderAddress, 160);
    await token.connect(owner).transfer(spender1Address, 160);
    await token.connect(spender).approve(batch.address, 160);
  });
  it('Should execute a batch payments of Ether to four accounts', async function () {
    await expect(
      batch
        .connect(spender)
        .batchEtherPayment(
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [etherTransferAmount, etherTransferAmount, etherTransferAmount, etherTransferAmount],
          { value: etherAmount },
        ),
    )
      .to.emit(batch, 'EthTransfer')
      .withArgs(spenderAddress, etherAmount.toString());
  });
  it('Should execute a batch payments of a ERC20 to four accounts', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    await expect(
      batch
        .connect(spender)
        .batchERC20Payment(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 20, 20, 20],
        ),
    ).to.emit(token, 'Transfer');

    afterERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(20));
  });
  it('Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    await expect(
      batch
        .connect(spender)
        .batchERC20PaymentWithReference(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 20, 20, 20],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
        ),
    )
      .to.emit(token, 'Transfer')
      .to.emit(batch, 'TransferWithReference')
      .withArgs(token.address, payeeTwo, '20', ethers.utils.keccak256(referenceExample2));

    afterERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(20));
  });
  it('Should revert if not enough ether value', async function () {
    expect(
      batch
        .connect(spender1)
        .batchEtherPayment(
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [etherTransferAmount, etherTransferAmount, etherTransferAmount, etherTransferAmount],
          { value: etherAmount.div(2) },
        ),
    ).to.be.reverted;
  });
  it('Should revert if not enough tokens', async function () {
    expect(
      batch
        .connect(spender)
        .batchERC20PaymentWithReference(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 20, 20, 30],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
        ),
    ).to.be.reverted;
  });
  it('Should revert without approval', async function () {
    expect(
      batch
        .connect(spender1)
        .batchERC20PaymentWithReference(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 20, 20, 20],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
        ),
    ).to.be.reverted;
  });
});
