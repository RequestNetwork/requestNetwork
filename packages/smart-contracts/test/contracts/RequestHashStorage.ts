import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { RequestHashStorage__factory } from '../../types';
import { RequestHashStorage } from '../../types';

use(solidity);

describe('contract: RequestHashStorage', () => {
  let admin: string;
  let submitter: string;
  let thirdParty: string;

  let adminSigner: Signer;
  let otherSigner: Signer;
  let submitterSigner: Signer;
  let requestHashStorage: RequestHashStorage;

  const feesParameters = '0x0000000000000000000000000000000000000000000000000000000000000010';
  const hashExample = 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

  before(async () => {
    [admin, submitter, thirdParty] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, submitterSigner, otherSigner] = await ethers.getSigners();
  });

  beforeEach(async () => {
    requestHashStorage = await new RequestHashStorage__factory(adminSigner).deploy();
    await requestHashStorage.addWhitelisted(submitter);
  });

  it('allows the whitelisted admin to be changed', async () => {
    await expect(requestHashStorage.addWhitelistAdmin(thirdParty)).to.emit(
      requestHashStorage,
      'WhitelistAdminAdded',
    );
  });

  it('does not let non-admin change the admin whitelist', async () => {
    await expect(
      requestHashStorage.connect(otherSigner).addWhitelistAdmin(thirdParty),
    ).to.be.revertedWith('WhitelistAdminRole: caller does not have the WhitelistAdmin role');
  });

  it('allows the whitelist to be changed', async () => {
    await expect(requestHashStorage.addWhitelisted(thirdParty)).to.emit(
      requestHashStorage,
      'WhitelistedAdded',
    );

    await expect(requestHashStorage.removeWhitelisted(thirdParty)).to.emit(
      requestHashStorage,
      'WhitelistedRemoved',
    );
  });

  it('does not let non-admin change the whitelist', async () => {
    await expect(
      requestHashStorage.connect(otherSigner).addWhitelisted(thirdParty),
    ).to.be.revertedWith('WhitelistAdminRole: caller does not have the WhitelistAdmin role');
    await expect(
      requestHashStorage.connect(otherSigner).removeWhitelisted(admin),
    ).to.be.revertedWith('WhitelistAdminRole: caller does not have the WhitelistAdmin role');
  });

  it('allows whitelisted address to submit hash', async function () {
    await expect(
      requestHashStorage.connect(submitterSigner).declareNewHash(hashExample, feesParameters),
    )
      .to.emit(requestHashStorage, 'NewHash')
      .withArgs(hashExample, submitter, feesParameters);
  });

  it('does not let non-whitelisted submit hashes', async function () {
    await expect(
      requestHashStorage.connect(otherSigner).declareNewHash(hashExample, feesParameters),
    ).to.be.revertedWith('WhitelistedRole: caller does not have the Whitelisted role');
  });
});
