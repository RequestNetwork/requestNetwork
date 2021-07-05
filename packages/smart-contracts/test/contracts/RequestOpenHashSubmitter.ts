import '@nomiclabs/hardhat-ethers';
import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  RequestHashStorage__factory,
  RequestHashStorage,
  RequestOpenHashSubmitter,
  RequestOpenHashSubmitter__factory,
} from '../../types';

use(solidity);

describe('contract: RequestOpenHashSubmitter', () => {
  let admin: string;
  let submitter: string;
  let burner: string;
  let thirdParty: string;

  let adminSigner: Signer;
  let otherSigner: Signer;
  let submitterSigner: Signer;
  let burnerSigner: Signer;

  let requestOpenHashSubmitter: RequestOpenHashSubmitter;
  let requestHashStorage: RequestHashStorage;

  const hashExample = 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';
  const feesParameters = '0x00000000000000000000000000000000000000000000000000000000000003e8'; // = 1000

  before(async () => {
    [admin, submitter, burner, thirdParty] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, submitterSigner, burnerSigner, otherSigner] = await ethers.getSigners();
    requestHashStorage = await new RequestHashStorage__factory(adminSigner).deploy();
    await requestHashStorage.addWhitelisted(submitter);
  });

  beforeEach(async () => {
    requestOpenHashSubmitter = await new RequestOpenHashSubmitter__factory(adminSigner).deploy(
      requestHashStorage.address,
      burner,
    );
    await requestHashStorage.addWhitelisted(requestOpenHashSubmitter.address);
  });

  describe('addWhitelisted', () => {
    it('Allows the whitelist to be changed', async () => {
      await expect(requestOpenHashSubmitter.connect(adminSigner).addWhitelistAdmin(thirdParty))
        .to.emit(requestOpenHashSubmitter, 'WhitelistAdminAdded')
        .withArgs(thirdParty);

      await expect(requestOpenHashSubmitter.connect(otherSigner).renounceWhitelistAdmin())
        .to.emit(requestOpenHashSubmitter, 'WhitelistAdminRemoved')
        .withArgs(thirdParty);
    });

    it('Non admin should not be able to change the whitelist', async () => {
      await expect(
        requestHashStorage.connect(otherSigner).addWhitelisted(thirdParty),
      ).to.be.revertedWith('WhitelistAdminRole: caller does not have the WhitelistAdmin role');
      await expect(
        requestHashStorage.connect(otherSigner).addWhitelisted(admin),
      ).to.be.revertedWith('WhitelistAdminRole: caller does not have the WhitelistAdmin role');
    });
  });

  describe('submitHash', () => {
    it('Allows submitHash without fee', async function () {
      const provider = new ethers.providers.JsonRpcProvider();
      let oldBurnerBalance = await provider.getBalance(burner);

      await expect(
        requestOpenHashSubmitter.connect(submitterSigner).submitHash(hashExample, feesParameters),
      )
        .to.emit(requestHashStorage, 'NewHash')
        .withArgs(hashExample, requestOpenHashSubmitter.address, feesParameters);

      expect(await provider.getBalance(burner), 'Fee not collected by burner').to.be.equal(
        oldBurnerBalance,
      );
    });

    it('Allows submitHash with fees', async () => {
      const provider = new ethers.providers.JsonRpcProvider();
      const intialBurnerBalance = await provider.getBalance(burner);

      const minimumFee = BigNumber.from(100);
      const rateFeesNumerator = BigNumber.from(3);
      const rateFeesDenominator = BigNumber.from(5);

      await requestOpenHashSubmitter
        .connect(adminSigner)
        .setFeeParameters(minimumFee, rateFeesNumerator, rateFeesDenominator);

      const fees = BigNumber.from(600);
      await expect(
        requestOpenHashSubmitter.connect(submitterSigner).submitHash(hashExample, feesParameters, {
          value: fees,
        }),
      )
        .to.emit(requestHashStorage, 'NewHash')
        .withArgs(hashExample, requestOpenHashSubmitter.address, feesParameters);

      const newBalanceBurner = await provider.getBalance(burner);
      expect(newBalanceBurner.toString(), 'Fee not collected by burner').to.be.equal(
        BigNumber.from(intialBurnerBalance).add(fees).toString(),
      );
    });

    it('should not be able to submitHash with the wrong fees', async () => {
      const minimumFee = BigNumber.from(100);
      const rateFeesNumerator = BigNumber.from(3);
      const rateFeesDenominator = BigNumber.from(5);

      await requestOpenHashSubmitter
        .connect(adminSigner)
        .setFeeParameters(minimumFee, rateFeesNumerator, rateFeesDenominator);

      // No fees
      await expect(
        requestOpenHashSubmitter.submitHash(hashExample, feesParameters),
      ).to.be.revertedWith('msg.value does not match the fees');

      // Fees too big
      await expect(
        requestOpenHashSubmitter.submitHash(hashExample, feesParameters, {
          value: BigNumber.from(1000),
        }),
      ).to.be.revertedWith('msg.value does not match the fees');
    });
  });
});
