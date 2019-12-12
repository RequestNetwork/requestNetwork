const { expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const ERC20Proxy = artifacts.require('./ERC20Proxy.sol');

contract('ERC20Proxy', function(accounts) {
  const from = accounts[0];
  const to = accounts[1];
  let erc20Proxy;
  const referenceExample = 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

  beforeEach(async () => {
    erc20Proxy = await ERC20Proxy.new({
      from,
    });
  });

  it('Allows to store a reference', async function() {
    let { logs } = await erc20Proxy.transferFromWithReference(contractAddress, to, 100, referenceExample, { from });

    expectEvent.inLogs(logs, 'TransferWithReference', {
      tokenAddress: contractAddress,
      to,
      amount: 100,
      transferReference: referenceExample,
    });
  });
});
