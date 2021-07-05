import { ethers } from 'hardhat';
import {
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  BadERC20__factory,
  ERC20True__factory,
  ERC20NoReturn__factory,
  ERC20Revert__factory,
  ERC20False__factory,
} from '../../types';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';

use(solidity);

describe('contract: ERC20FeeProxy', () => {
  const feeAddress = '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';
  const referenceExample = '0xaaaa';
  let signer: Signer;
  let from: string;
  let to: string;
  let erc20FeeProxy: ERC20FeeProxy;
  let testERC20: Contract;

  before(async () => {
    [from, to] = (await ethers.getSigners()).map((s) => s.address);
    [signer] = await ethers.getSigners();

    const proxyFactory = await new ERC20FeeProxy__factory(signer);
    erc20FeeProxy = await proxyFactory.deploy();
    console.log('Proxy deployed, starting tests');
  });

  beforeEach(async () => {
    // FIXME: Use fixtures https://ethereum-waffle.readthedocs.io/en/latest/fixtures.html
    const erc20Factory = await ethers.getContractFactory('TestERC20');
    testERC20 = await erc20Factory.deploy(1000);
  });

  it('stores reference and paid fee', async function () {
    await testERC20.approve(erc20FeeProxy.address, '102');

    expect(
      await erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
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

  it('transfers tokens for payment and fees', async function () {
    await testERC20.approve(erc20FeeProxy.address, '102', { from });

    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    await erc20FeeProxy.transferFromWithReferenceAndFee(
      testERC20.address,
      to,
      '100',
      referenceExample,
      '2',
      feeAddress,
    );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(102).toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
    expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(2).toString());
  });

  it('should revert if no allowance', async function () {
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
      ),
    ).to.be.reverted;

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.toString(), 'Payer balance changed');
    expect(toNewBalance.toString()).to.equals(toOldBalance.toString(), 'Issuer balance changed');
    expect(feeNewBalance.toString()).to.equals(
      feeOldBalance.toString(),
      'Fee account balance changed',
    );
  });

  it('should revert if error', async function () {
    await testERC20.approve(erc20FeeProxy.address, '102', { from });

    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '-10',
        feeAddress,
        {
          from,
        },
      ),
    ).to.be.reverted;

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.toString());
    expect(feeNewBalance.toString()).to.equals(feeOldBalance.toString());
  });

  it('should revert if no fund', async function () {
    await testERC20.approve(erc20FeeProxy.address, '10000', { from });
    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '10000',
        referenceExample,
        '0',
        feeAddress,
      ),
    ).to.be.reverted;
  });

  it('no fee transfer if amount is 0', async function () {
    await testERC20.approve(erc20FeeProxy.address, '100');
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    await expect(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '0',
        feeAddress,
        {
          from,
        },
      ),
    )
      // transferReference indexes the event log, therefore the keccak256 is stored
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        testERC20.address,
        to,
        '100',
        ethers.utils.keccak256(referenceExample),
        '0',
        feeAddress,
      );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(100).toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
    expect(feeNewBalance.toString()).to.equals(feeOldBalance.toString());
  });

  it('transfers tokens for payment and fees on BadERC20', async function () {
    const badERC20Factory = new BadERC20__factory(signer);
    const badERC20 = await badERC20Factory.deploy(1000, 'BadERC20', 'BAD', 8);
    await badERC20.approve(erc20FeeProxy.address, '102', { from });

    const fromOldBalance = await badERC20.balanceOf(from);
    const toOldBalance = await badERC20.balanceOf(to);
    const feeOldBalance = await badERC20.balanceOf(feeAddress);

    await erc20FeeProxy.transferFromWithReferenceAndFee(
      badERC20.address,
      to,
      '100',
      referenceExample,
      '2',
      feeAddress,
      {
        from,
      },
    );

    const fromNewBalance = await badERC20.balanceOf(from);
    const toNewBalance = await badERC20.balanceOf(to);
    const feeNewBalance = await badERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(102).toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(100).toString());
    expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(2).toString());
  });

  it('transfers tokens for payment and fees on a variety of ERC20 contract formats', async function () {
    const ERC20TrueFactory = new ERC20True__factory(signer);
    const ERC20NoReturnFactory = new ERC20NoReturn__factory(signer);
    const ERC20FalseFactory = new ERC20False__factory(signer);
    const ERC20RevertFactory = new ERC20Revert__factory(signer);
    const passContracts = [await ERC20TrueFactory.deploy(), await ERC20NoReturnFactory.deploy()];
    const failContracts = [await ERC20FalseFactory.deploy(), await ERC20RevertFactory.deploy()];

    for (let tokenContract of passContracts) {
      await expect(
        erc20FeeProxy.transferFromWithReferenceAndFee(
          tokenContract.address,
          to,
          '100',
          referenceExample,
          '2',
          feeAddress,
        ),
      )
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          tokenContract.address,
          to,
          '100',
          ethers.utils.keccak256(referenceExample),
          '2',
          feeAddress,
        );
    }

    for (let tokenContract of failContracts) {
      await expect(
        erc20FeeProxy.transferFromWithReferenceAndFee(
          tokenContract.address,
          to,
          '100',
          referenceExample,
          '2',
          feeAddress,
        ),
      ).to.be.reverted;
    }
  });
});
