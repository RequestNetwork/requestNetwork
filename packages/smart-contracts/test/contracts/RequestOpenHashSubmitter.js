const { expect } = require('chai');
const BigNumber = require('bn.js');
const utils = require('./utils.js');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const RequestOpenHashSubmitter = artifacts.require('./RequestOpenHashSubmitter.sol');
const RequestHashStorage = artifacts.require('./RequestHashStorage.sol');

contract('RequestOpenHashSubmitter', function (accounts) {
  const admin = accounts[0];
  const otherGuy = accounts[1];
  const submitter = accounts[2];
  const burner = accounts[3];
  let requestOpenHashSubmitter;
  let requestHashStorage;

  const hashExample = 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';
  const feesParameters = '0x00000000000000000000000000000000000000000000000000000000000003e8'; // = 1000

  beforeEach(async () => {
    requestHashStorage = await RequestHashStorage.new();
    requestHashStorage.addWhitelisted(submitter);

    requestOpenHashSubmitter = await RequestOpenHashSubmitter.new(
      requestHashStorage.address,
      burner,
    );
    requestHashStorage.addWhitelisted(requestOpenHashSubmitter.address);
  });

  describe('addWhitelisted', () => {
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
      await expectRevert.unspecified(
        requestHashStorage.addWhitelisted(otherGuy, { from: otherGuy }),
      );
      await expectRevert.unspecified(requestHashStorage.addWhitelisted(admin, { from: otherGuy }));
    });
  });

  describe('submitHash', () => {
    it('Allows submitHash without fee', async function () {
      let oldBurnerBalance = await web3.eth.getBalance(burner);

      let { receipt, logs } = await requestOpenHashSubmitter.submitHash(
        hashExample,
        feesParameters,
        { from: submitter },
      );
      const event = utils.getEventFromReceipt(receipt.rawLogs[0], RequestHashStorage.abi);

      expect(event.name, 'event name is wrong').to.be.equal('NewHash');
      expect(event.data[0], 'event hash is wrong').to.be.equal(hashExample);
      expect(event.data[1], 'event submitter is wrong').to.be.equal(
        requestOpenHashSubmitter.address,
      );
      expect(event.data[2], 'event feesParameters is wrong').to.be.equal(feesParameters);

      expect(await web3.eth.getBalance(burner), 'Fee not collected by burner').to.be.equal(
        oldBurnerBalance,
      );
    });

    it('Allows submitHash with fees', async function () {
      let oldBurnerBalance = new BigNumber(await web3.eth.getBalance(burner));

      const minimumFee = new BigNumber(100);
      const rateFeesNumerator = new BigNumber(3);
      const rateFeesDenominator = new BigNumber(5);

      await requestOpenHashSubmitter.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
        { from: admin },
      );

      const fees = new BigNumber(600);
      let { receipt, logs } = await requestOpenHashSubmitter.submitHash(
        hashExample,
        feesParameters,
        { from: submitter, value: fees },
      );

      const event = utils.getEventFromReceipt(receipt.rawLogs[0], RequestHashStorage.abi);
      expect(event.name, 'event name is wrong').to.be.equal('NewHash');
      expect(event.data[0], 'event hash is wrong').to.be.equal(hashExample);
      expect(event.data[1], 'event hashSubmitter is wrong').to.be.equal(
        requestOpenHashSubmitter.address,
      );
      expect(event.data[2], 'event feesParameters is wrong').to.be.equal(feesParameters);

      const newBalanceBurner = new BigNumber(await web3.eth.getBalance(burner));
      expect(newBalanceBurner, 'Fee not collected by burner').to.be.bignumber.equal(
        new BigNumber(oldBurnerBalance).add(fees),
      );
    });

    it('should not be able to submitHash with the wrong fees', async function () {
      const minimumFee = new BigNumber(100);
      const rateFeesNumerator = new BigNumber(3);
      const rateFeesDenominator = new BigNumber(5);

      await requestOpenHashSubmitter.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
        { from: admin },
      );

      // No fees
      await expectRevert.unspecified(
        requestOpenHashSubmitter.submitHash(hashExample, feesParameters),
      );

      // Fees too big
      await expectRevert.unspecified(
        requestOpenHashSubmitter.submitHash(hashExample, feesParameters, {
          value: new BigNumber(1000),
        }),
      );
    });
  });
});
