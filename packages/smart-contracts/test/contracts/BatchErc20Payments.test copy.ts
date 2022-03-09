import { ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { TestERC20__factory, TestERC20, BatchErc20Payments } from '../../src/types';
import { batchErc20PaymentsArtifact } from '../../src/lib';

use(solidity);

describe('contract: BatchErc20Payments', () => {
  let payeeOne: string;
  let payeeTwo: string;
  let payeeThree: string;
  let payeeFour: string;
  let feeAddress: string;

  let spenderAddress: string;
  let spender1Address: string;
  let spender2Address: string;

  let owner: Signer;
  let spender: Signer;
  let spender1: Signer;
  let spender2: Signer;

  let beforeERC20Balance: BigNumber;
  let afterERC20Balance: BigNumber;

  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';
  const referenceExample3 = '0xcccc';
  const referenceExample4 = '0xdddd';

  let token: TestERC20;
  let batch: BatchErc20Payments;

  const erc20Decimal = BigNumber.from('1000000000000000000');

  before(async () => {
    [, payeeOne, payeeTwo, payeeThree, payeeFour, feeAddress] = (await ethers.getSigners()).map(
      (s) => s.address,
    );
    [owner, spender, spender1, spender2] = await ethers.getSigners();

    spenderAddress = await spender.getAddress();
    spender1Address = await spender1.getAddress();
    spender2Address = await spender2.getAddress();

    batch = await batchErc20PaymentsArtifact.connect(network.name, owner);
    token = await new TestERC20__factory(owner).deploy(erc20Decimal.mul(10000));

    const tmpForGasTest = 5; // default=1
    await token.connect(owner).transfer(spenderAddress, 150 * tmpForGasTest);
    await token.connect(owner).transfer(spender1Address, 160 * tmpForGasTest);
    await token.connect(owner).transfer(spender2Address, 160 * tmpForGasTest);
    await token.connect(spender).approve(batch.address, 170 * tmpForGasTest);
    await token.connect(spender2).approve(batch.address, 170 * tmpForGasTest);

    let allo = await token.allowance(spenderAddress, batch.address);
    console.log('allowance spender: batch', allo.toString());
    allo = await token.allowance(spender1Address, batch.address);
    console.log('allowance spender1: batch', allo.toString());
  });

  it('Should execute a batch payments of a ERC20 to four accounts', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    await expect(
      batch
        .connect(spender)
        .batchOrphanERC20Payments(
          token.address,
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

  it('Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
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
        token.address,
        payeeOne,
        '20',
        ethers.utils.keccak256(referenceExample1),
        '1',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        token.address,
        payeeTwo,
        '30',
        ethers.utils.keccak256(referenceExample2),
        '2',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        token.address,
        payeeThree,
        '40',
        ethers.utils.keccak256(referenceExample3),
        '3',
        feeAddress,
      )
      .to.emit(batch, 'TransferWithReferenceAndFee')
      .withArgs(
        token.address,
        payeeFour,
        '50',
        ethers.utils.keccak256(referenceExample4),
        '4',
        feeAddress,
      );

    afterERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(30));
  });

  it('Should execute an orphan batch payments of a ERC20 to four accounts', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeThree);
    await expect(
      batch
        .connect(spender)
        .batchOrphanERC20Payments(
          token.address,
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

  it('GAS EVALUATION 4p: Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 50],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    );

    afterERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(30));
  });

  it('Multi Token: Should pay multiple ERC20 payments with paymentRef', async function () {
    beforeERC20Balance = await token.connect(owner).balanceOf(payeeTwo);

    let tokenAddresses: Array<string> = [];
    let recipients: Array<string> = [];
    let amounts: Array<number> = [];
    let paymentReferences: Array<string> = [];
    let feeAmounts: Array<number> = [];

    let nbTxs = 4;
    let amount = 2;
    let feeAmount = 1;

    for (let i = 0; i < nbTxs; i++) {
      tokenAddresses.push(token.address);
      recipients.push(payeeTwo);
      amounts.push(amount);
      paymentReferences.push(referenceExample2);
      feeAmounts.push(feeAmount);
    }

    await expect(
      batch
        .connect(spender2)
        .batchERC20PaymentsMultiTokensWithReferenceAndFee(
          tokenAddresses,
          recipients,
          amounts,
          paymentReferences,
          feeAmounts,
          feeAddress,
        ),
    );

    afterERC20Balance = await token.connect(owner).balanceOf(payeeTwo);
    // console.log("beforeERC20Balance.add(amount*nbTxs)", new BigNumber(beforeERC20Balance.add(amount*nbTxs), 'hex'));
    expect(afterERC20Balance).to.be.equal(beforeERC20Balance.add(amount * nbTxs));
  });

  it('Should revert batchERC20PaymentsWithReferenceAndFee if not enough funds', async function () {
    expect(
      batch
        .connect(spender)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 52],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    ).to.be.revertedWith(
      'ProviderError: VM Exception while processing transaction: revert transferFromWithReference failed',
    );
  });
  it('Should revert batchERC20PaymentsMultiTokensWithReferenceAndFee if not enough funds', async function () {
    expect(
      batch
        .connect(spender)
        .batchERC20PaymentsMultiTokensWithReferenceAndFee(
          [token.address, token.address, token.address, token.address],
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 52],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    ).to.be.revertedWith(
      'ProviderError: VM Exception while processing transaction: revert transferFromWithReference failed',
    );
  });
  it('Should revert batchERC20PaymentsWithReferenceAndFee without approval', async function () {
    // 140 + 10 = 150 needed, 160 available, no approval.
    console.log('------------> WTFFFFFF', spenderAddress, spender1Address, batch.address);
    let allo = await token.allowance(spenderAddress, batch.address);
    console.log('allowance spender: batch', allo.toString());
    // let allo1 = await token.allowance(spender1Address, batch.address);
    // console.log("allowance spender1: batch", allo1.toString());

    // console.log("balance spender1", (await token.connect(owner).balanceOf(spender1Address)).toString());
    expect(
      batch
        .connect(spender1)
        .batchERC20PaymentsWithReferenceAndFee(
          token.address,
          [payeeOne, payeeTwo, payeeThree, payeeFour],
          [20, 30, 40, 50],
          [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
          [1, 2, 3, 4],
          feeAddress,
        ),
    ).to.be.revertedWith(
      'ProviderError: VM Exception while processing transaction: revert transferFromWithReference failed',
    );
  });
  // TODO
  // it('Should revert batchERC20PaymentsMultiTokensWithReferenceAndFee without approval', async function () {
  //   // 140 + 10 = 150 needed, 160 available, no approval.
  //   console.log("------------> WTFFFFFF 2")

  //   let allo = await token.allowance(spenderAddress, batch.address);
  //   console.log("allowance spender: batch", allo.toString());
  //   allo = await token.allowance(spender1Address, batch.address);
  //   console.log("allowance spender1: batch", allo.toString());

  //   // console.log("balance spender1", (await token.connect(spender1).balanceOf(spender1Address)).toString());
  //   expect(
  //     batch
  //       .connect(spender1)
  //       .batchERC20PaymentsMultiTokensWithReferenceAndFee(
  //         [token.address,token.address,token.address,token.address],
  //         [payeeOne, payeeTwo, payeeThree, payeeFour],
  //         [20, 30, 40, 50],
  //         [referenceExample1, referenceExample2, referenceExample3, referenceExample4],
  //         [1, 2, 3, 4],
  //         feeAddress,
  //       ),
  //   ).to.be.revertedWith(
  //     'ProviderError: VM Exception while processing transaction: revert transferFromWithReference failed',
  //   );
  // });
});
