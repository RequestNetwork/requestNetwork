const ethers = require('ethers');

const { expectEvent } = require('@openzeppelin/test-helpers');
const EthereumProxy = artifacts.require('./EthereumProxy.sol');

contract('EthereumProxy', function (accounts) {
  const from = accounts[0];
  const to = accounts[1];
  const otherGuy = accounts[2];
  let ethProxy;
  const referenceExample = '0xaaaa';
  const DEFAULT_GAS_PRICE = new ethers.utils.BigNumber('100000000000');
  const amount = new ethers.utils.BigNumber('10000000000000000');
  const provider = new ethers.providers.JsonRpcProvider();

  beforeEach(async () => {
    ethProxy = await EthereumProxy.new({
      from,
    });
  });

  it('allows to store a reference', async function () {
    let { logs } = await ethProxy.transferWithReference(to, referenceExample, {
      from,
      value: amount,
    });

    // transferReference indexes the event log, therefore the keccak256 is stored
    expectEvent.inLogs(logs, 'TransferWithReference', {
      to,
      amount: amount.toString(),
      paymentReference: ethers.utils.keccak256(referenceExample),
    });
  });

  it('allows to transfer ethers', async function () {
    const fromOldBalance = await provider.getBalance(from);
    const toOldBalance = await provider.getBalance(to);

    const tx = await ethProxy.transferWithReference(to, referenceExample, {
      from,
      value: amount,
      gasPrice: DEFAULT_GAS_PRICE,
    });

    const gasCost = DEFAULT_GAS_PRICE.mul(new ethers.utils.BigNumber(tx.receipt.gasUsed));

    const fromNewBalance = await provider.getBalance(from);
    const toNewBalance = await provider.getBalance(to);

    // Check balance changes
    expect(fromNewBalance.toString()).to.equals(fromOldBalance.sub(gasCost).sub(amount).toString());
    expect(toNewBalance.toString()).to.equals(toOldBalance.add(amount).toString());
  });
});
