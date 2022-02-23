import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  TestERC20__factory,
  TestERC20,
  BatchErc20Payments,
  BatchErc20Payments__factory,
  ERC20FeeProxy,
} from '../../src/types';
import { erc20FeeProxyArtifact } from '../../src/lib';

use(solidity);

describe('contract: BatchErc20Payments', () => {
  let payeeOne: string;
  let payeeTwo: string;
  let payeeThree: string;
  let payeeFour: string;
  let feeAddress: string;

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
  let batch: BatchErc20Payments;
  let erc20FeeProxy: ERC20FeeProxy;

  const erc20Decimal = BigNumber.from('1000000000000000000');

  before(async () => {
    [, payeeOne, payeeTwo, payeeThree, payeeFour, feeAddress] = (await ethers.getSigners()).map(
      (s) => s.address,
    );
    [owner, spender, spender1] = await ethers.getSigners();
    spenderAddress = await spender.getAddress();
    spender1Address = await spender1.getAddress();

    erc20FeeProxy = erc20FeeProxyArtifact.connect(network.name, owner);
    token = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));
    batch = await new BatchErc20Payments__factory(owner).deploy(erc20FeeProxy.address);

    await token.connect(owner).transfer(spenderAddress, 160);
    await token.connect(owner).transfer(spender1Address, 160);
    await token.connect(spender).approve(batch.address, 400);
  });
  it('Should execute a batch payments of a ERC20 to four accounts', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    await expect(
      batch
        .connect(spender)
        .batchOrphanERC20Payments(
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
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 20, 20, 20],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          1,
          feeAddress,
        ),
    )
      // .to.emit(token, 'Transfer')
      .to.emit(batch, 'TransferWithReferenceAndFee') //ToDO check if erc20FeeProxy emits
      .withArgs(
        token.address,
        payeeTwo,
        '20',
        ethers.utils.keccak256(referenceExample2),
        '1',
        feeAddress,
      ); // ToDo check all paymentRefs

    afterERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(24));
  });
  it('Should revert if not enough tokens', async function () {
    expect(
      batch
        .connect(spender)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 20, 20, 30],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          1,
          feeAddress,
        ),
    ).to.be.reverted; //ToDo
  });
  it('Should revert without approval', async function () {
    expect(
      batch
        .connect(spender1)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 20, 20, 20],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          1,
          feeAddress,
        ),
    ).to.be.reverted; //ToDo
  });
});
