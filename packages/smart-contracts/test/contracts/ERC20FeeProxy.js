const ethers = require('ethers');

const { expect } = require('chai');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const TestERC20 = artifacts.require('./TestERC20.sol');
const BadERC20 = artifacts.require('./BadERC20.sol');
const ERC20True = artifacts.require('ERC20True');
const ERC20False = artifacts.require('ERC20False');
const ERC20NoReturn = artifacts.require('ERC20NoReturn');
const ERC20Revert = artifacts.require('ERC20Revert');

contract('ERC20FeeProxy', function (accounts) {
  const from = accounts[0];
  const to = accounts[1];
  const otherGuy = accounts[2];
  const feeAddress = '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';
  let erc20FeeProxy;
  let testERC20;
  const referenceExample = '0xaaaa';

  beforeEach(async () => {
    testERC20 = await TestERC20.new(1000, {
      from,
    });
    erc20FeeProxy = await ERC20FeeProxy.new({
      from,
    });
  });

  it('stores reference and paid fee', async function () {
    await testERC20.approve(erc20FeeProxy.address, '102', { from });

    let { logs } = await erc20FeeProxy.transferFromWithReferenceAndFee(
      testERC20.address,
      to,
      '100',
      referenceExample,
      '2',
      feeAddress,
      { from },
    );

    // transferReference indexes the event log, therefore the keccak256 is stored
    expectEvent.inLogs(logs, 'TransferWithReferenceAndFee', {
      tokenAddress: testERC20.address,
      to,
      amount: '100',
      paymentReference: ethers.utils.keccak256(referenceExample),
      feeAmount: '2',
      feeAddress,
    });
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
      {
        from,
      },
    );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toNumber()).to.equals(fromOldBalance.toNumber() - 102);
    expect(toNewBalance.toNumber()).to.equals(toOldBalance.toNumber() + 100);
    expect(feeNewBalance.toNumber()).to.equals(feeOldBalance.toNumber() + 2);
  });

  it('should revert fee is no allowance', async function () {
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    await expectRevert.unspecified(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '10',
        feeAddress,
        {
          from,
        },
      ),
    );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toNumber()).to.equals(fromOldBalance.toNumber());
    expect(toNewBalance.toNumber()).to.equals(toOldBalance.toNumber());
    expect(feeNewBalance.toNumber()).to.equals(feeOldBalance.toNumber());
  });
  it('should revert fee if error', async function () {
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    await expectRevert.unspecified(
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
    );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toNumber()).to.equals(fromOldBalance.toNumber());
    expect(toNewBalance.toNumber()).to.equals(toOldBalance.toNumber());
    expect(feeNewBalance.toNumber()).to.equals(feeOldBalance.toNumber());
  });

  it('should revert if no fund', async function () {
    await expectRevert.unspecified(
      erc20FeeProxy.transferFromWithReferenceAndFee(
        testERC20.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
        {
          from: otherGuy,
        },
      ),
    );
  });

  it('no fee transfer if amount is 0', async function () {
    await testERC20.approve(erc20FeeProxy.address, '100', { from });
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);

    let { logs } = await erc20FeeProxy.transferFromWithReferenceAndFee(
      testERC20.address,
      to,
      '100',
      referenceExample,
      '0',
      feeAddress,
      {
        from,
      },
    );

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);

    // Check balance changes
    expect(fromNewBalance.toNumber()).to.equals(fromOldBalance.toNumber() - 100);
    expect(toNewBalance.toNumber()).to.equals(toOldBalance.toNumber() + 100);
    expect(feeNewBalance.toNumber()).to.equals(feeOldBalance.toNumber());

    // transferReference indexes the event log, therefore the keccak256 is stored
    expectEvent.inLogs(logs, 'TransferWithReferenceAndFee', {
      tokenAddress: testERC20.address,
      to,
      amount: '100',
      paymentReference: ethers.utils.keccak256(referenceExample),
      feeAmount: '0',
      feeAddress,
    });
  });

  it('transfers tokens for payment and fees on BadERC20', async function () {
    badERC20 = await BadERC20.new(1000, 'BadERC20', 'BAD', 8, {
      from,
    });
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
    expect(fromNewBalance.toNumber()).to.equals(fromOldBalance.toNumber() - 102);
    expect(toNewBalance.toNumber()).to.equals(toOldBalance.toNumber() + 100);
    expect(feeNewBalance.toNumber()).to.equals(feeOldBalance.toNumber() + 2);
  });

  it('transfers tokens for payment and fees on a variety of ERC20 contract formats', async function () {
    const passContracts = [await ERC20True.new(), await ERC20NoReturn.new()];

    const failContracts = [await ERC20False.new(), await ERC20Revert.new()];

    for (let contract of passContracts) {
      let { logs } = await erc20FeeProxy.transferFromWithReferenceAndFee(
        contract.address,
        to,
        '100',
        referenceExample,
        '2',
        feeAddress,
        {
          from,
        },
      );

      expectEvent.inLogs(logs, 'TransferWithReferenceAndFee', {
        tokenAddress: contract.address,
        to,
        amount: '100',
        paymentReference: ethers.utils.keccak256(referenceExample),
        feeAmount: '2',
        feeAddress,
      });
    }

    for (let contract of failContracts) {
      await expectRevert.unspecified(
        erc20FeeProxy.transferFromWithReferenceAndFee(
          contract.address,
          to,
          '100',
          referenceExample,
          '2',
          feeAddress,
          {
            from,
          },
        ),
      );
    }
  });
});
