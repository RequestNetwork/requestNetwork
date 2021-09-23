import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  ERC20EscrowToPayV1__factory,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  ERC20EscrowToPayV1
} from '../../src/types';

use(solidity);

describe("Contract: ERC20EscrowToPayV1", () => {
    const referenceExample1 = '0xaaaa';
    const referenceExample2 = '0xbbbb';
    const referenceExample3 = '0xcccc';
    let testERC20: Contract, erc20EscrowToPayV1: ERC20EscrowToPayV1, erc20FeeProxy: ERC20FeeProxy;
    let owner: Signer, payee: Signer, payer: Signer, buidler: Signer;
    let payeeAddress: string, payerAddress: string, feeAddress: string, erc20EscrowToPayAddress: string;
    
    before( async () => {
        // Get the Signers
        [ owner, payee, payer, buidler ] = await ethers.getSigners();
        payeeAddress = await payee.getAddress();
        payerAddress = await payer.getAddress();
        feeAddress = await buidler.getAddress();
        
        // Deploy the smart-contracts. 
        testERC20 = await new TestERC20__factory(owner).deploy('100000000000000000');
        erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
        erc20EscrowToPayV1 = await new ERC20EscrowToPayV1__factory(owner).deploy(erc20FeeProxy.address);
    
        erc20EscrowToPayAddress = erc20EscrowToPayV1.address;
        await testERC20.connect(owner).transfer(payerAddress, 100000000);
    });
    
    it("ERC20EscrowToPayV1: Should create a new escrow and deposit funds", async () => {
        await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1010);

        const payerOldBalance = await testERC20.balanceOf(payerAddress);
        const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
        const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);

        expect(
            await erc20EscrowToPayV1.connect(payer).openEscrow(
                referenceExample1,
                testERC20.address,
                '1000',
                payeeAddress,
                '10',
                feeAddress,
            ),
        )
            .to.emit(erc20EscrowToPayV1, "OpenEscrow")
            .withArgs(ethers.utils.keccak256(referenceExample1));

        const payerNewBalance = await testERC20.balanceOf(payerAddress);
        const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
        const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);

        expect(payerNewBalance.toString()).to.equals(payerOldBalance.sub(1010).toString());
        expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.toString());
        expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.add(1010).toString());
    });
    it("ERC20EscrowToPayV1: Should close escrow, pay request and fees", async () => {
        const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
        
        expect(await erc20EscrowToPayV1.connect(payer).closeEscrow(referenceExample1))
            .to.emit(erc20EscrowToPayV1, 'EscrowCompleted')
            .withArgs(ethers.utils.keccak256(referenceExample1));
        
        const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);
        const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
        
        expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(1000).toString());
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(10).toString());
        expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(1010).toString());
    });
    it("ERC20EscrowToPayV1: Should allow the payer to open a dispute", async () => {
        await testERC20.connect(payer).approve(erc20EscrowToPayAddress, '101');
        
        await erc20EscrowToPayV1.connect(payer).openEscrow(
            referenceExample2,
            testERC20.address,
            '100',
            payeeAddress,
            '1',
            feeAddress,
        );
            
        expect(await erc20EscrowToPayV1.connect(payer).openDispute(referenceExample2))
            .to.emit(erc20EscrowToPayV1, "DisputeOpened")
            .withArgs(ethers.utils.keccak256(referenceExample2));
    }); 
    it("ERC20EscrowToPayV1: Should resolve a dispute, pay request and fees", async () => {
        const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);

        expect(await erc20EscrowToPayV1.connect(payer).resolveDispute(referenceExample2))
            .to.emit(erc20EscrowToPayV1, "DisputeResolved")
            .withArgs(ethers.utils.keccak256(referenceExample2));
        
        const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);
        const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
        
        expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(100).toString());
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(1).toString());
        expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(101).toString());
    });
    it("ERC20EscrowToPayV1: Should escalte a dispute, pay fees and timelock funds", async () => {
        await testERC20.connect(payer).approve(erc20EscrowToPayAddress, '202');
        await erc20EscrowToPayV1.connect(payer).openEscrow(
            referenceExample3,
            testERC20.address,
            '200',
            payeeAddress,
            '2',
            feeAddress,
        ); 
        await erc20EscrowToPayV1.connect(payer).openDispute(referenceExample3);

        const feeOldBalance = await testERC20.balanceOf(feeAddress);
        const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
        
        expect(await erc20EscrowToPayV1.connect(payer).lockDisputedFunds(referenceExample3))
            .to.emit(erc20EscrowToPayV1, "LockPeriodStarted");
        
        const disputeMapping = await (erc20EscrowToPayV1.disputeMapping(referenceExample3));
        const tokentimelock = await disputeMapping.tokentimelock;
        const tokenTimelockNewBalance = await testERC20.balanceOf(tokentimelock);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);
        const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
        
        
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(2).toString());
        expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(202).toString());
        expect(tokenTimelockNewBalance.toString()).to.equals(escrowOldBalance.sub(2).toString());
    });
    it("ERC20EscrowToPayV1: Should release the TokenTimelocked funds", async () => {
        const disputeMapping = await (erc20EscrowToPayV1.disputeMapping(referenceExample3));
        const tokentimelock = await disputeMapping.tokentimelock;
        
        const payerOldBalance = await testERC20.balanceOf(payerAddress);
        const tokenTimelockOldBalance = await testERC20.balanceOf(tokentimelock);

        expect(await erc20EscrowToPayV1.connect(payer).withdrawLockedFunds(referenceExample3))
            .to.be.reverted;
        
        const tokenTimelockNewBalance = await testERC20.balanceOf(tokentimelock);
        const payerNewBalance = await testERC20.balanceOf(payerAddress);
        
        expect(payerNewBalance.toString()).to.equals(payerOldBalance.add(200).toString());
        expect(tokenTimelockNewBalance.toString()).to.equals(tokenTimelockOldBalance.sub(200).toString());
    });
    /*
      it("ERC20EscrowToPayV1: Should get the correct data from the disputeMapping", async () => {
          disputeMapping = await erc20EscrowToPayV1.connect(payer).disputeMapping(referenceExample2);
    
          timelockBalance = await testERC20.balanceOf(disputeMapping.tokentimelock);

          const timestamp = await erc20EscrowToPayV1.connect(payer).getLockPeriodEndTime(referenceExample2);
          date = new Date(timestamp.toNumber() * 1000);
      });
      it("ERC20EscrowToPayV1: Should check the timelock balance is correct", async () => {
          expect(await disputeMapping.amount).to.be.equal(timelockBalance);
      });
      it("ERC20EscrowToPayV1: Should display the correct values of the TokenTimelock period", async () => {

          console.log(` 
          ------ Lock Period Initiated -----
          `);
          console.log(`
              Payment reference       :               ${disputeMapping.paymentReference},
              TokenTimelock contract  :               ${disputeMapping.tokentimelock},
              TimeLock balance        :               ${timelockBalance},
              TimeLock endtime        :               ${date}

              --- Escrow balance reset to zero ---
              ERC20EscrowToPayV1 address        :               ${erc20EscrowToPayAddress},
              ERC20EscrowToPayV1 balance        :               ${escrowBalance}
          `);
      });
      it("ERC20EscrowToPayV1: Should payout the funds when lock period is over", async () => {
        payerBalanceOld = await testERC20.balanceOf(payerAddress);
        
        expect(erc20EscrowToPayV1.connect(payer).withdrawLockedFunds(referenceExample2));

        escrowBalance = await testERC20.balanceOf(erc20EscrowToPayV1.address);
        disputeMapping = await erc20EscrowToPayV1.connect(payer).disputeMapping(referenceExample2);
        timelockBalance = await testERC20.balanceOf(disputeMapping.tokentimelock);
        payerBalanceNew = await testERC20.balanceOf(payerAddress);
        feeAddressBalance = await testERC20.balanceOf(feeAddress);

        console.log(`
        --- PAYER BALANCE ---    
            Payer Old Balance                   :               ${payerBalanceOld},
            Payer New Balance                   :               ${payerBalanceNew}

        --- DisputeMapping DELETED ---
            Payment reference                   :               ${disputeMapping.paymentReference},
            TokenTimelock contract              :               ${disputeMapping.tokentimelock},
            TimeLock balance                    :               ${timelockBalance},
            TimeLock endtime                    :               ${date}
        
            ERC20EscrowToPay address            :               ${erc20EscrowToPayAddress},
            ERC20EscrowToPay balance            :               ${escrowBalance._isBigNumber}
            
        --- FEE DETAILS ---
            Fee Address                         :               ${feeAddress}, 
            Fee Address balance                 :               ${feeAddressBalance}
        `);
      });  
  });
*/

});
