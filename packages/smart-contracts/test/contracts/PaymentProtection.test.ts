import { ethers } from 'hardhat';
import {
  ERC20Proxy,
  ERC20Proxy__factory,
  PaymentProtectionProxy,
  PaymentProtectionProxy__factory,
} from '../../src/types';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';

use(solidity);

describe('contract: PaymentProtectionProxy', () => {
  const referenceExample = '0xaaaa000000000000000000000000000000000000000000000000000000000000';
  let signer: Signer;
  let from: string;
  let to: string;
  let erc20Proxy: ERC20Proxy;
  let paymentProtectionProxy: PaymentProtectionProxy;
  let testERC20: Contract;

  before(async () => {
    [from, to] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    erc20Proxy = await new ERC20Proxy__factory(signer).deploy();
    paymentProtectionProxy = await new PaymentProtectionProxy__factory(signer).deploy();
  });

  beforeEach(async () => {
    const erc20Factory = await ethers.getContractFactory('TestERC20');
    testERC20 = await erc20Factory.deploy(1000);
    await testERC20.approve(paymentProtectionProxy.address, '1000');
  });

  it('allows to make a payment', async function () {
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);

    const data = await erc20Proxy.interface.encodeFunctionData('transferFromWithReference', [
      testERC20.address,
      to,
      '100',
      '0xaaaa',
    ]);
    console.log(data);
    await paymentProtectionProxy.singlePaymentProtection(
      referenceExample,
      erc20Proxy.address,
      data,
    );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(100).toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
  });

  it('prevent to make a double payment', async function () {
    const data = await erc20Proxy.interface.encodeFunctionData('transferFromWithReference', [
      testERC20.address,
      to,
      '100',
      referenceExample,
    ]);
    await expect(
      paymentProtectionProxy.singlePaymentProtection(referenceExample, erc20Proxy.address, data),
    ).to.be.revertedWith('21316');
  });
});
