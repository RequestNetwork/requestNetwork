import { ethers } from 'hardhat';
import {
  ERC20FeeProxy,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  DoublePaymentPreventionApp__factory,
  DoublePaymentPreventionApp,
} from '../../../types';
import { Contract, Signer, utils } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';

use(solidity);

describe('Double Payment Prevention', () => {
  const feeAddress = '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';
  const referenceExample = '0xaaaa';
  const otherRef = '0xbbbb';
  let signer: Signer;
  let from: string;
  let to: string;
  let erc20FeeProxy: ERC20FeeProxy;
  let testERC20: Contract;
  let doublePaymentPreventionApp: DoublePaymentPreventionApp;

  before(async () => {
    [from, to] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    erc20FeeProxy = await new ERC20FeeProxy__factory(signer).deploy();
    doublePaymentPreventionApp = await new DoublePaymentPreventionApp__factory(signer).deploy();
    testERC20 = await new TestERC20__factory(signer).deploy(100000000000);
  });

  beforeEach(async () => {
    await testERC20.approve(erc20FeeProxy.address, '1000');
  });

  it('Make a payment - no hooks data', async function () {
    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
        '0x',
      ),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        testERC20.address,
        to,
        '100',
        ethers.utils.keccak256(referenceExample),
        '2',
        feeAddress,
      );
  });

  it('Make a payment - with double payment prevention data', async function () {
    const doublePaymentPreventionData =
      await doublePaymentPreventionApp.computeBeforePaymentAppData(referenceExample, '0x');
    const hooksData = await erc20FeeProxy.computeHooksData(
      doublePaymentPreventionApp.address,
      doublePaymentPreventionData,
    );

    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
        hooksData,
      ),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        testERC20.address,
        to,
        '100',
        ethers.utils.keccak256(referenceExample),
        '2',
        feeAddress,
      );
  });

  it('Prevent a payment - with double payment prevention data', async function () {
    const doublePaymentPreventionData =
      await doublePaymentPreventionApp.computeBeforePaymentAppData(referenceExample, '0x');
    const hooksData = await erc20FeeProxy.computeHooksData(
      doublePaymentPreventionApp.address,
      doublePaymentPreventionData,
    );

    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
        hooksData,
      ),
    ).to.be.revertedWith('Payment already executed');
  });

  it('Make a payment - do not prevent other payments', async function () {
    const doublePaymentPreventionData =
      await doublePaymentPreventionApp.computeBeforePaymentAppData(otherRef, '0x');
    const hooksData = await erc20FeeProxy.computeHooksData(
      doublePaymentPreventionApp.address,
      doublePaymentPreventionData,
    );

    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        otherRef,
        '2',
        feeAddress,
        hooksData,
      ),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(testERC20.address, to, '100', ethers.utils.keccak256(otherRef), '2', feeAddress);
  });

  it('Fails if payment reference mismatch', async function () {
    const doublePaymentPreventionData =
      await doublePaymentPreventionApp.computeBeforePaymentAppData(otherRef, '0x');
    const hooksData = await erc20FeeProxy.computeHooksData(
      doublePaymentPreventionApp.address,
      doublePaymentPreventionData,
    );

    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
        hooksData,
      ),
    ).to.be.revertedWith('Payment Reference does not match');
  });
});
