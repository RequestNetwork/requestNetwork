import '@nomiclabs/hardhat-ethers';
import { ethers } from 'hardhat';
import { Signer, utils } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import { RequestHashStorage__factory, RequestHashStorage } from '../../src/types';

use(solidity);

describe('contract: RequestHashStorage', () => {
  let admin: string;
  let submitter: string;
  let thirdParty: string;

  let adminSigner: Signer;
  let otherSigner: Signer;
  let submitterSigner: Signer;
  let requestHashStorage: RequestHashStorage;

  let adminSignerAddress: string;
  let otherSignerAddress: string;
  const feesParameters = '0x0000000000000000000000000000000000000000000000000000000000000010';
  const hashExample = 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';

  const ADMIN_ROLE = utils.formatBytes32String('');
  const PUBLISHER_ROLE = utils.formatBytes32String("PUBLISHER");

  before(async () => {
    [admin, submitter, thirdParty] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, submitterSigner, otherSigner] = await ethers.getSigners();
    otherSignerAddress = (await otherSigner.getAddress()).toLowerCase();
    adminSignerAddress = await adminSigner.getAddress();
  });

  beforeEach(async () => {
    requestHashStorage = await new RequestHashStorage__factory(adminSigner).deploy();
    await requestHashStorage.grantRole(PUBLISHER_ROLE, submitter);
  });

  it('allows the whitelisted admin to be changed', async () => {
    await expect(requestHashStorage.grantRole(ADMIN_ROLE, thirdParty)).to.emit(
      requestHashStorage,
      'RoleGranted',
    ).withArgs(
      ADMIN_ROLE,
      thirdParty,
      adminSignerAddress
    );
  });

  it('does not let non-admin change the admin whitelist', async () => {
    await expect(
      requestHashStorage.connect(otherSigner).grantRole(ADMIN_ROLE, thirdParty),
    ).to.be.revertedWith(`AccessControl: account ${otherSignerAddress} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`);
  });

  it('allows the whitelist to be changed', async () => {
    await expect(requestHashStorage.grantRole(PUBLISHER_ROLE, thirdParty)).to.emit(
      requestHashStorage,
      'RoleGranted',
    ).withArgs(
      PUBLISHER_ROLE,
      thirdParty,
      adminSignerAddress
    );

    await expect(requestHashStorage.revokeRole(PUBLISHER_ROLE, thirdParty)).to.emit(
      requestHashStorage,
      'RoleRevoked',
    ).withArgs(
      PUBLISHER_ROLE,
      thirdParty,
      adminSignerAddress
    );
  });

  it('does not let non-admin change the whitelist', async () => {
    await expect(
      requestHashStorage.connect(otherSigner).grantRole(PUBLISHER_ROLE, thirdParty),
    ).to.be.revertedWith(`AccessControl: account ${otherSignerAddress} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`);
    await expect(
      requestHashStorage.connect(otherSigner).revokeRole(PUBLISHER_ROLE, admin),
    ).to.be.revertedWith(`AccessControl: account ${otherSignerAddress} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`);
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
    ).to.be.revertedWith(`AccessControl: account ${otherSignerAddress} is missing role ${PUBLISHER_ROLE}`);
  });
});
