const BigNumber = require('bn.js');

const chai = require('chai');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const StorageFeeCollector = artifacts.require('./StorageFeeCollector.sol');

chai.use(require('chai-bn')(BigNumber));
const { expect } = chai;

contract('StorageFeeCollector', function (accounts) {
  const admin = accounts[0];
  const otherGuy = accounts[1];
  const burner = accounts[2];
  const burner2 = accounts[3];
  let storageFeeCollector;

  beforeEach(async () => {
    storageFeeCollector = await StorageFeeCollector.new(burner, {
      from: admin,
    });
  });

  describe('addWhitelistAdmin', () => {
    it('Allows the admin whitelist to be changed', async function () {
      let { logs } = await storageFeeCollector.addWhitelistAdmin(otherGuy, { from: admin });
      expectEvent.inLogs(logs, 'WhitelistAdminAdded', {
        account: otherGuy,
      });
    });

    it('Non admin should not be able to change the admin whitelist', async function () {
      await expectRevert.unspecified(
        storageFeeCollector.addWhitelistAdmin(otherGuy, { from: otherGuy }),
      );
    });
  });

  describe('setRequestBurnerContract', async () => {
    it('Allows burnerContract to be changed', async function () {
      let { logs } = await storageFeeCollector.setRequestBurnerContract(burner2, { from: admin });
      expectEvent.inLogs(logs, 'UpdatedBurnerContract', {
        burnerAddress: burner2,
      });
      expect(
        await storageFeeCollector.requestBurnerContract.call(),
        'burner not changed',
      ).to.be.equal(burner2);
    });

    it('Non admin should not be able to change burnerContract', async function () {
      await expectRevert.unspecified(
        storageFeeCollector.setRequestBurnerContract(burner2, { from: otherGuy }),
      );
    });
  });

  describe('setFeeParameters', async () => {
    it('Allows parameters to be changed', async function () {
      const minimumFee = new BigNumber(1);
      const rateFeesNumerator = new BigNumber(2);
      const rateFeesDenominator = new BigNumber(3);

      let { logs } = await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
        { from: admin },
      );
      expectEvent.inLogs(logs, 'UpdatedFeeParameters', {
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
      });

      expect(
        await storageFeeCollector.minimumFee.call(),
        'minimumFee not changed',
      ).to.be.a.bignumber.that.equals(minimumFee);
      expect(
        await storageFeeCollector.rateFeesNumerator.call(),
        'rateFeesNumerator not changed',
      ).to.be.a.bignumber.that.equals(rateFeesNumerator);
      expect(
        await storageFeeCollector.rateFeesDenominator.call(),
        'rateFeesDenominator not changed',
      ).to.be.a.bignumber.that.equals(rateFeesDenominator);
    });

    it('Non admin should not be able to change parameters', async function () {
      const minimumFee = new BigNumber(1);
      const rateFeesNumerator = new BigNumber(2);
      const rateFeesDenominator = new BigNumber(3);

      await expectRevert.unspecified(
        storageFeeCollector.setFeeParameters(minimumFee, rateFeesNumerator, rateFeesDenominator, {
          from: otherGuy,
        }),
      );
    });
  });

  describe('getFeesAmount', async () => {
    it('getFeesAmount gives correct values', async function () {
      const minimumFee = new BigNumber(100);
      const rateFeesNumerator = new BigNumber(3);
      const rateFeesDenominator = new BigNumber(5);

      let { logs } = await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
        { from: admin },
      );

      const contentSize = new BigNumber(1000);

      let estimation = await storageFeeCollector.getFeesAmount(contentSize);
      expect(estimation, 'estimation wrong').to.be.a.bignumber.that.equals(new BigNumber(600));
    });

    it('getFeesAmount gives correct values under the minimum', async function () {
      const minimumFee = new BigNumber(1000000);
      const rateFeesNumerator = new BigNumber(3);
      const rateFeesDenominator = new BigNumber(5);

      let { logs } = await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
        { from: admin },
      );

      const contentSize = new BigNumber(1000);

      let estimation = await storageFeeCollector.getFeesAmount(contentSize);

      expect(estimation, 'estimation wrong').to.be.a.bignumber.that.equals(
        new BigNumber(minimumFee),
      );
    });

    it('getFeesAmount gives correct values with default value', async function () {
      const contentSize = new BigNumber(1000);

      let estimation = await storageFeeCollector.getFeesAmount(contentSize);
      expect(estimation, 'estimation wrong').to.be.a.bignumber.that.equals(new BigNumber(0));
    });

    it('getFeesAmount gives correct values with denominator equal 0', async function () {
      const minimumFee = new BigNumber(100);
      const rateFeesNumerator = new BigNumber(3);
      const rateFeesDenominator = new BigNumber(0);

      let { logs } = await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
        { from: admin },
      );

      const contentSize = new BigNumber(1000);

      let estimation = await storageFeeCollector.getFeesAmount(contentSize);
      expect(estimation, 'estimation wrong').to.be.a.bignumber.that.equals(new BigNumber(3000));
    });

    it('getFeesAmount must revert if overflow', async function () {
      const minimumFee = new BigNumber(100);
      const rateFeesNumerator = new BigNumber(10).pow(new BigNumber(255));

      const rateFeesDenominator = new BigNumber(2);

      let { logs } = await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
        { from: admin },
      );
      const contentSize = new BigNumber(1000);

      await expectRevert.unspecified(storageFeeCollector.getFeesAmount(contentSize));
    });
  });
});
