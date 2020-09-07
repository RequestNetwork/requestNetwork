const ethers = require('ethers');

const { expect } = require('chai');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const ERC20Proxy = artifacts.require('./ERC20Proxy.sol');
const TestERC20 = artifacts.require('./TestERC20.sol');

contract('ERC20Proxy', function (accounts) {
  const from = accounts[0];
  const to = accounts[1];
  const otherGuy = accounts[2];
  let erc20Proxy;
  let testERC20;
  const referenceExample = '0xaaaa';

  beforeEach(async () => {
    testERC20 = await TestERC20.new(1000, {
      from,
    });
    erc20Proxy = await ERC20Proxy.new({
      from,
    });
  });

  it('allows to store a reference', async function () {
    await testERC20.approve(erc20Proxy.address, '100', { from });

    let { logs } = await erc20Proxy.transferFromWithReference(
      testERC20.address,
      to,
      '100',
      referenceExample,
      { from },
    );

    // transferReference indexes the event log, therefore the keccak256 is stored
    expectEvent.inLogs(logs, 'TransferWithReference', {
      tokenAddress: testERC20.address,
      to,
      amount: '100',
      paymentReference: ethers.utils.keccak256(referenceExample),
    });
  });

  it('allows to transfer tokens', async function () {
    await testERC20.approve(erc20Proxy.address, '100', { from });

    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);

    await erc20Proxy.transferFromWithReference(testERC20.address, to, '100', referenceExample, {
      from,
    });

    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);

    // Check balance changes
    expect(fromNewBalance.toNumber()).to.equals(fromOldBalance.toNumber() - 100);
    expect(toNewBalance.toNumber()).to.equals(toOldBalance.toNumber() + 100);
  });

  it('should revert if no fund', async function () {
    await expectRevert.unspecified(
      erc20Proxy.transferFromWithReference(testERC20.address, to, '100', referenceExample, {
        from: otherGuy,
      }),
    );
  });
});
