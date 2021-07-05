import { ethers } from 'hardhat';
import { ERC20Proxy, ERC20Proxy__factory } from '../../types';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';

use(solidity);

describe('contract: ERC20Proxy', () => {
  const feeAddress = '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';
  const referenceExample = '0xaaaa';
  let signer: Signer;
  let from: string;
  let to: string;
  let otherGuy: string;
  let erc20Proxy: ERC20Proxy;
  let testERC20: Contract;

  before(async () => {
    [from, to] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    const proxyFactory = await new ERC20Proxy__factory(signer);
    erc20Proxy = await proxyFactory.deploy();
    console.log('Proxy deployed, starting tests');
  });

  beforeEach(async () => {
    const erc20Factory = await ethers.getContractFactory('TestERC20');
    testERC20 = await erc20Factory.deploy(1000);
    await testERC20.approve(erc20Proxy.address, '100');
  });

  it('allows to store a reference', async function () {
    await expect(
      erc20Proxy.transferFromWithReference(testERC20.address, to, '100', referenceExample),
    )
      .to.emit(erc20Proxy, 'TransferWithReference')
      // transferReference indexes the event log, therefore the keccak256 is stored
      .withArgs(testERC20.address, to, '100', ethers.utils.keccak256(referenceExample));
  });

  it('allows to transfer tokens', async function () {
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);

    await erc20Proxy.transferFromWithReference(testERC20.address, to, '100', referenceExample);

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(100).toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
  });

  it('should revert if no fund', async function () {
    await testERC20.transfer(to, testERC20.balanceOf(from));
    await expect(
      erc20Proxy.transferFromWithReference(testERC20.address, to, '100', referenceExample),
    ).to.be.reverted;
  });
});
