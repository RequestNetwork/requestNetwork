import '@nomiclabs/hardhat-ethers';
import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { StorageFeeCollector, StorageFeeCollector__factory } from '../../types';

use(solidity);

describe('contract: StorageFeeCollector', () => {
  let burner: string;
  let burner2: string;
  let thirdParty: string;

  let adminSigner: Signer;
  let otherSigner: Signer;
  let storageFeeCollector: StorageFeeCollector;

  before(async () => {
    [, thirdParty, burner, burner2] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, otherSigner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    storageFeeCollector = await new StorageFeeCollector__factory(adminSigner).deploy(burner);
  });

  describe('addWhitelistAdmin', () => {
    it('Allows the admin whitelist to be changed', async () => {
      await expect(storageFeeCollector.addWhitelistAdmin(thirdParty))
        .to.emit(storageFeeCollector, 'WhitelistAdminAdded')
        .withArgs(thirdParty);
    });

    it('Non admin should not be able to change the admin whitelist', async () => {
      await expect(storageFeeCollector.addWhitelistAdmin(thirdParty, { from: thirdParty })).to.be
        .reverted;
    });
  });

  describe('setRequestBurnerContract', async () => {
    it('Allows burnerContract to be changed', async () => {
      await expect(storageFeeCollector.setRequestBurnerContract(burner2))
        .to.emit(storageFeeCollector, 'UpdatedBurnerContract')
        .withArgs(burner2);
      expect(await storageFeeCollector.requestBurnerContract(), 'burner not changed').to.be.equal(
        burner2,
      );
    });

    it('Non admin should not be able to change burnerContract', async () => {
      await expect(
        storageFeeCollector.connect(otherSigner).setRequestBurnerContract(burner2),
      ).to.be.revertedWith('WhitelistAdminRole: caller does not have the WhitelistAdmin role');
    });
  });

  describe('setFeeParameters', async () => {
    it('Allows parameters to be changed', async () => {
      const minimumFee = BigNumber.from(1);
      const rateFeesNumerator = BigNumber.from(2);
      const rateFeesDenominator = BigNumber.from(3);

      await expect(
        storageFeeCollector.setFeeParameters(minimumFee, rateFeesNumerator, rateFeesDenominator),
      )
        .to.emit(storageFeeCollector, 'UpdatedFeeParameters')
        .withArgs(minimumFee, rateFeesNumerator, rateFeesDenominator);

      expect(
        (await storageFeeCollector.minimumFee()).toString(),
        'minimumFee not changed',
      ).to.equal(minimumFee.toString());
      expect(
        (await storageFeeCollector.rateFeesNumerator()).toString(),
        'rateFeesNumerator not changed',
      ).to.equal(rateFeesNumerator.toString());
      expect(
        (await storageFeeCollector.rateFeesDenominator()).toString(),
        'rateFeesDenominator not changed',
      ).to.equal(rateFeesDenominator.toString());
    });

    it('Non admin should not be able to change parameters', async () => {
      const minimumFee = BigNumber.from(1);
      const rateFeesNumerator = BigNumber.from(2);
      const rateFeesDenominator = BigNumber.from(3);

      await expect(
        storageFeeCollector
          .connect(otherSigner)
          .setFeeParameters(minimumFee, rateFeesNumerator, rateFeesDenominator),
      ).to.be.revertedWith('WhitelistAdminRole: caller does not have the WhitelistAdmin role');
    });
  });

  describe('getFeesAmount', async () => {
    it('getFeesAmount gives correct values', async function () {
      const minimumFee = BigNumber.from(100);
      const rateFeesNumerator = BigNumber.from(3);
      const rateFeesDenominator = BigNumber.from(5);

      await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
      );

      const contentSize = BigNumber.from(1000);

      let estimation = await storageFeeCollector.getFeesAmount(contentSize);
      expect(estimation.toString(), 'estimation wrong').to.equal('600');
    });

    it('getFeesAmount gives correct values under the minimum', async () => {
      const minimumFee = BigNumber.from(1000000);
      const rateFeesNumerator = BigNumber.from(3);
      const rateFeesDenominator = BigNumber.from(5);

      await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
      );

      const contentSize = BigNumber.from(1000);

      const estimation = await storageFeeCollector.getFeesAmount(contentSize);

      expect(estimation.toString(), 'estimation wrong').to.equal(minimumFee.toString());
    });

    it('getFeesAmount gives correct values with default value', async () => {
      const contentSize = BigNumber.from(1000);

      const estimation = await storageFeeCollector.getFeesAmount(contentSize);
      expect(estimation.toString(), 'estimation wrong').to.equal('0');
    });

    it('getFeesAmount gives correct values with denominator equal 0', async () => {
      const minimumFee = BigNumber.from(100);
      const rateFeesNumerator = BigNumber.from(3);
      const rateFeesDenominator = BigNumber.from(0);

      await storageFeeCollector.setFeeParameters(
        minimumFee,
        rateFeesNumerator,
        rateFeesDenominator,
      );

      const contentSize = BigNumber.from(1000);

      const estimation = await storageFeeCollector.getFeesAmount(contentSize);
      expect(estimation.toString(), 'estimation wrong').to.equal('3000');
    });

    it('getFeesAmount must revert if overflow', async () => {
      const minimumFee = BigNumber.from(100);
      // const rateFeesNumerator = BigNumber.from(10).pow(BigNumber.from(255));
      const rateFeesNumerator = BigNumber.from(10).pow(75);
      const rateFeesDenominator = BigNumber.from(2);

      await storageFeeCollector.setFeeParameters(
        minimumFee.toString(),
        rateFeesNumerator.toString(),
        rateFeesDenominator.toString(),
      );
      const contentSize = BigNumber.from(1000);

      await expect(storageFeeCollector.getFeesAmount(contentSize)).to.be.revertedWith(
        'SafeMath: multiplication overflow',
      );
    });
  });
});
