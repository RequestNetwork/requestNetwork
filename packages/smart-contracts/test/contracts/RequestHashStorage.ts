const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const RequestHashStorage = artifacts.require('./RequestHashStorage.sol');

contract('RequestHashStorage', function (accounts) {
  const admin = accounts[0];
  const hashSubmitter = accounts[1];
  const otherGuy = accounts[2];
  const feesParameters = '0x0000000000000000000000000000000000000000000000000000000000000010';
  let requestHashStorage;
  const hashExample = 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

  beforeEach(async () => {
    requestHashStorage = await RequestHashStorage.new({
      from: admin,
    });
    requestHashStorage.addWhitelisted(hashSubmitter);
  });

  it('Allows the admin whitelist to be changed', async function () {
    let { logs } = await requestHashStorage.addWhitelistAdmin(otherGuy, { from: admin });
    expectEvent.inLogs(logs, 'WhitelistAdminAdded', {
      account: otherGuy,
    });
  });

  it('Non admin should not be able to change the admin whitelist', async function () {
    await expectRevert.unspecified(
      requestHashStorage.addWhitelistAdmin(otherGuy, { from: otherGuy }),
    );
  });

  it('Allows the whitelist to be changed', async function () {
    let { logs } = await requestHashStorage.addWhitelisted(otherGuy, { from: admin });
    expectEvent.inLogs(logs, 'WhitelistedAdded', {
      account: otherGuy,
    });

    ({ logs } = await requestHashStorage.removeWhitelisted(otherGuy, { from: admin }));
    expectEvent.inLogs(logs, 'WhitelistedRemoved', {
      account: otherGuy,
    });
  });

  it('Non admin should not be able to change the whitelist', async function () {
    await expectRevert.unspecified(requestHashStorage.addWhitelisted(otherGuy, { from: otherGuy }));
    await expectRevert.unspecified(requestHashStorage.addWhitelisted(admin, { from: otherGuy }));
  });

  it('Allows address whitelisted to submit hash', async function () {
    let { logs } = await requestHashStorage.declareNewHash(hashExample, feesParameters, {
      from: hashSubmitter,
    });

    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample,
      hashSubmitter,
      feesParameters,
    });
  });

  it('Non whitelisted should not be able to submit hash', async function () {
    await expectRevert.unspecified(
      requestHashStorage.declareNewHash(hashExample, feesParameters, { from: admin }),
    );
    await expectRevert.unspecified(
      requestHashStorage.declareNewHash(hashExample, feesParameters, { from: otherGuy }),
    );
  });
});
