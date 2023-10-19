import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';

let latestBlockchainSnapshot: number;
const moveTimeForward = async (timeInSeconds: number) => {
  latestBlockchainSnapshot = await ethers.provider.send('evm_snapshot', []);
  await ethers.provider.send('evm_increaseTime', [timeInSeconds]);
  await ethers.provider.send('evm_mine', []);
};

const revertTimeToSnapshot = async () => {
  await ethers.provider.send('evm_revert', [latestBlockchainSnapshot]);
};

import {
  ERC20EscrowToPay__factory,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  ERC20EscrowToPay,
} from '../../src/types';

use(solidity);

describe('Contract: ERC20EscrowToPay', () => {
  const referenceExample1 = '0xaaaa';
  const referenceExample2 = '0xbbbb';
  const referenceExample3 = '0xcccc';
  const referenceExample4 = '0xdddd';
  const referenceExample5 = '0xeeee';
  const referenceExample6 = '0xffff';
  const referenceExample7 = '0xaabb';
  const referenceExample8 = '0xaacc';
  const referenceExample9 = '0xaadd';
  const referenceExample10 = '0xaadb';

  let testERC20: Contract, erc20EscrowToPay: ERC20EscrowToPay, erc20FeeProxy: ERC20FeeProxy;
  let owner: Signer, payer: Signer, payee: Signer, buidler: Signer, admin: Signer;
  let payerAddress: string,
    payeeAddress: string,
    feeAddress: string,
    erc20EscrowToPayAddress: string,
    adminAddress: string;

  before(async () => {
    // Get the Signers
    [owner, payer, payee, buidler, admin] = await ethers.getSigners();
    payerAddress = await payer.getAddress();
    payeeAddress = await payee.getAddress();
    feeAddress = await buidler.getAddress();
    adminAddress = await admin.getAddress();

    // Deploy the smart-contracts.
    testERC20 = await new TestERC20__factory(owner).deploy('100000000000000000');
    erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
    erc20EscrowToPay = await new ERC20EscrowToPay__factory(owner).deploy(
      erc20FeeProxy.address,
      adminAddress,
    );

    erc20EscrowToPayAddress = erc20EscrowToPay.address;
    await testERC20.connect(owner).transfer(payerAddress, 100000000);
  });

  describe('Normal flow:', () => {
    it('Should transfer amount to escrow and fees to buidler', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);

      const payerOldBalance = await testERC20.balanceOf(payerAddress);
      const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
      const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
      const builderOldBalance = await testERC20.balanceOf(feeAddress);

      expect(
        await erc20EscrowToPay
          .connect(payer)
          .payEscrow(testERC20.address, payeeAddress, '1000', referenceExample1, '1', feeAddress),
      )
        .to.emit(testERC20, 'Transfer')
        .to.emit(testERC20, 'Approval')
        .to.emit(erc20EscrowToPay, 'TransferWithReferenceAndFee');

      const payerNewBalance = await testERC20.balanceOf(payerAddress);
      const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
      const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
      const builderNewBalance = await testERC20.balanceOf(feeAddress);

      expect(payerNewBalance.toString()).to.equals(payerOldBalance.sub(1001).toString());
      expect(payeeNewBalance).to.equals(payeeOldBalance);
      expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.add(1000).toString());
      expect(builderNewBalance.toString()).to.equals(builderOldBalance.add(1).toString());
    });
    it('Should transfer amount to payee from escrow', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 2002);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 2000, referenceExample2, 2, feeAddress);

      const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
      const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
      const buidlerOldBalance = await testERC20.balanceOf(feeAddress);

      expect(await erc20EscrowToPay.connect(payer).payRequestFromEscrow(referenceExample2)).to.emit(
        erc20FeeProxy,
        'TransferWithReferenceAndFee',
      );

      const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
      const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
      const buidlerNewBalance = await testERC20.balanceOf(feeAddress);

      expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(2000).toString());
      expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(2000).toString());
      expect(buidlerNewBalance).to.equals(buidlerOldBalance);
    });
  });
  describe('Emergency claim flow:', () => {
    it('Should initiate emergencyClaim w/ 24 week lockperiod and emit event.', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 1000, referenceExample3, 1, feeAddress);

      expect(await erc20EscrowToPay.connect(payee).initiateEmergencyClaim(referenceExample3))
        .to.emit(erc20EscrowToPay, 'InitiatedEmergencyClaim')
        .withArgs(ethers.utils.keccak256(referenceExample3));
      const total24WeekMiliseconds = 3600 * 24 * 7 * 24;
      const contractEmergencyPeriod = await erc20EscrowToPay.connect(payee).emergencyClaimPeriod();
      expect(contractEmergencyPeriod).to.be.equal(total24WeekMiliseconds);
      const requestMapping = await erc20EscrowToPay
        .connect(payer)
        .requestMapping(referenceExample3);
      expect(requestMapping.emergencyState).to.be.true;
    });
    it('Should revert if claimed before claimDate.', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 1000, referenceExample4, 1, feeAddress);
      await erc20EscrowToPay.connect(payee).initiateEmergencyClaim(referenceExample4);

      expect(erc20EscrowToPay.connect(payee).completeEmergencyClaim(referenceExample4)).to.be
        .reverted;
      const requestMapping = await erc20EscrowToPay
        .connect(payer)
        .requestMapping(referenceExample4);

      expect(requestMapping.amount).to.be.equal(1000);
      expect(requestMapping.emergencyState).to.be.true;
    });

    it('Should be able to withdraw funds after emergency lockperiod ends', async () => {
      const thisReference = referenceExample10;
      // Create the escrow and initiate emergency
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 1000, thisReference, 1, feeAddress);
      expect(await erc20EscrowToPay.connect(payee).initiateEmergencyClaim(thisReference))
        .to.emit(erc20EscrowToPay, 'InitiatedEmergencyClaim')
        .withArgs(ethers.utils.keccak256(thisReference));
      const total24WeekMiliseconds = 3600 * 24 * 7 * 24;
      const futureDateTimestamp = Math.floor(Date.now() / 1000) + total24WeekMiliseconds;
      const requestMapping = await erc20EscrowToPay.connect(payer).requestMapping(thisReference);
      expect(parseInt(requestMapping.emergencyClaimDate.toString())).to.be.greaterThanOrEqual(
        futureDateTimestamp - 5,
      );
      // move the time forward
      moveTimeForward(total24WeekMiliseconds + 10);
      // withdraw the escrow funds
      const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
      await erc20EscrowToPay.connect(payee).completeEmergencyClaim(thisReference);
      const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
      expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(1000).toString());
      revertTimeToSnapshot();
    });
  });
  describe('Cancel emergency flow:', () => {
    it('Should cancel emergencyClaim, reset state and emit event.', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 2002);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 2000, referenceExample5, 2, feeAddress);
      await erc20EscrowToPay.connect(payee).initiateEmergencyClaim(referenceExample5);

      expect(await erc20EscrowToPay.connect(payer).revertEmergencyClaim(referenceExample5))
        .to.emit(erc20EscrowToPay, 'RevertedEmergencyClaim')
        .withArgs(ethers.utils.keccak256(referenceExample5));

      const requestMapping = await erc20EscrowToPay
        .connect(payer)
        .requestMapping(referenceExample5);
      expect(requestMapping.emergencyState).to.be.false;
      expect(requestMapping.emergencyClaimDate).to.equals(0);
    });
    it('Should revert if emergencyState is canceled.', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 2002);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 2000, referenceExample6, 2, feeAddress);
      await erc20EscrowToPay.connect(payee).initiateEmergencyClaim(referenceExample6);
      await erc20EscrowToPay.connect(payer).revertEmergencyClaim(referenceExample6);

      expect(erc20EscrowToPay.connect(payee).completeEmergencyClaim(referenceExample6)).to.be
        .reverted;

      const requestMapping = await erc20EscrowToPay
        .connect(payer)
        .requestMapping(referenceExample6);
      expect(requestMapping.amount).to.be.equal(2000);
      expect(requestMapping.emergencyState).to.be.false;
    });
  });
  describe('Freeze request flow:', () => {
    it('Should set to frozen w/ 52 week lockperiod, cancel emergency claim and emit event.', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 2002);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 2000, referenceExample7, 2, feeAddress);
      await erc20EscrowToPay.connect(payee).initiateEmergencyClaim(referenceExample7);

      expect(await erc20EscrowToPay.connect(payer).freezeRequest(referenceExample7))
        .to.emit(erc20EscrowToPay, 'RequestFrozen')
        .withArgs(ethers.utils.keccak256(referenceExample7));

      const requestMapping = await erc20EscrowToPay
        .connect(payer)
        .requestMapping(referenceExample7);
      expect(requestMapping.emergencyState).to.be.false;
      expect(requestMapping.isFrozen).to.be.true;
    });
    it('Should revert if executed before unlockDate.', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 2002);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 2000, referenceExample8, 2, feeAddress);
      await erc20EscrowToPay.connect(payer).freezeRequest(referenceExample8);

      expect(erc20EscrowToPay.connect(payer).refundFrozenFunds(referenceExample8)).to.be.reverted;
    });
    it('Should revert if try to execute EmergencyClaim while request is frozen', async () => {
      await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 2002);
      await erc20EscrowToPay
        .connect(payer)
        .payEscrow(testERC20.address, payeeAddress, 2000, referenceExample9, 2, feeAddress);
      await erc20EscrowToPay.connect(payer).freezeRequest(referenceExample9);

      const requestMapping = await erc20EscrowToPay
        .connect(payer)
        .requestMapping(referenceExample9);

      // Make sure the request to be frozen.
      expect(requestMapping.isFrozen).to.be.true;
      // Expect the call to be reverted.
      expect(erc20EscrowToPay.connect(payee).initiateEmergencyClaim(referenceExample9)).to.be
        .reverted;
    });
  });
  describe('Admin should be able to change emergency and freeze periods', () => {
    it('Minimum emergency period is 30 days', async () => {
      const twoDaysInSeconds = 3600 * 24 * 2;
      expect(
        erc20EscrowToPay.connect(admin).setEmergencyClaimPeriod(twoDaysInSeconds),
      ).to.be.revertedWith('emergency period too short');
    });

    it('Minimum frozen period is 30 days', async () => {
      const twentyNineDaysInSeconds = 3600 * 24 * 29;
      expect(
        erc20EscrowToPay.connect(admin).setFrozenPeriod(twentyNineDaysInSeconds),
      ).to.be.revertedWith('frozen period too short');
    });

    it('Should be able to adjust emergency period', async () => {
      const thirtyOneDaysInSeconds = 3600 * 24 * 31;
      await erc20EscrowToPay.connect(admin).setEmergencyClaimPeriod(thirtyOneDaysInSeconds);
      const contractEmergencyPeriod = await erc20EscrowToPay.connect(payee).emergencyClaimPeriod();
      expect(contractEmergencyPeriod).to.be.equal(thirtyOneDaysInSeconds);
    });
    it('Should be able to adjust freeze period', async () => {
      const thirtyOneDaysInSeconds = 3600 * 24 * 31;
      await erc20EscrowToPay.connect(admin).setFrozenPeriod(thirtyOneDaysInSeconds);
      const contractFreezePeriod = await erc20EscrowToPay.connect(payee).frozenPeriod();
      expect(contractFreezePeriod).to.be.equal(thirtyOneDaysInSeconds);
    });
    it('Contract creator who is not the owner, should not be able to change periods', async () => {
      expect(erc20EscrowToPay.connect(owner).setEmergencyClaimPeriod(100)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
      expect(erc20EscrowToPay.connect(owner).setFrozenPeriod(100)).to.be.revertedWith(
        'Ownable: caller is not the owner',
      );
    });
  });
});
