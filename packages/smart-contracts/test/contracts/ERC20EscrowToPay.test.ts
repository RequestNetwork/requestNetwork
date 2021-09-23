import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  ERC20EscrowToPayV1__factory,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  TestERC20,
  ERC20EscrowToPayV1
} from '../../src/types';

use(solidity);

describe("Contract: ERC20EscrowToPayV1", () => {
    const referenceExample1 = '0xaaaa';
    const referenceExample2 = '0xbbbb';
    let testERC20: TestERC20, erc20EscrowToPay: ERC20EscrowToPayV1, erc20FeeProxy: ERC20FeeProxy;
    let date: Date, claimDate: BigNumber;
    let disputeMapping: any;
    let timelockBalance: BigNumber, payerBalanceNew: BigNumber, escrowBalance: BigNumber, feeAddressBalance: BigNumber, payerBalanceOld: BigNumber;
    let owner: Signer, payee: Signer, payer: Signer, buidler: Signer;
    let payeeAddress: string, payerAddress: string, feeAddress: string, erc20EscrowToPayAddress: string;
    
  before( async () => {
    // Get the Signers
    [owner, payee, payer, buidler] = await ethers.getSigners();
    payeeAddress = await payee.getAddress();
    payerAddress = await payer.getAddress();
    feeAddress = await buidler.getAddress();
    
    // Deploy the smart-contracts. 
    testERC20 = await new TestERC20__factory(owner).deploy('1000000000000');
    erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
    erc20EscrowToPay = await new ERC20EscrowToPayV1__factory(owner).deploy(erc20FeeProxy.address);
    
    erc20EscrowToPayAddress = erc20EscrowToPay.address;
    await testERC20.connect(owner).transfer(payerAddress, '100000');
  });

  describe("Contract: ERC20EscrowToPayV1 - Normal Flow", () => {
      it("ERC20EscrowToPayV1: Should open an escrow and approval to transfer TestERC20 tokens", async () => {
        await testERC20.connect(payer).approve(erc20EscrowToPayAddress, '1010');

        const payerOldBalance = await testERC20.balanceOf(payerAddress);
        const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
        const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);

        expect(await erc20EscrowToPay.connect(payer).openEscrow(
            referenceExample1,
            testERC20.address,
            '1000',
            payeeAddress,
            '10',
            feeAddress,
            ),
        ).to.emit(erc20EscrowToPay, "OpenEscrow")
            .withArgs(
                ethers.utils.keccak256(referenceExample1),
                testERC20.address,
                '1000',
                payeeAddress,
                '10',
                feeAddress,
                claimDate,
            );

        const payerNewBalance = await testERC20.balanceOf(payerAddress);
        const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
        const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
    
        // Check balance changes
        expect(payerNewBalance.toString()).to.equals(payerOldBalance.sub(1010).toString());
        expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(1000).toString());
        expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.add(10).toString());
      });
      it("ERC20EscrowToPayV1: Should let payer execute closeEscrow(), and the transfer funds to payee, and pay fees", async () => {
        const payerOldBalance = await testERC20.balanceOf(payerAddress);
        const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
        const feeOldBalance = await testERC20.balanceOf(feeAddress);

        await erc20EscrowToPay.connect(payer).closeEscrow(referenceExample1);

        const payerNewBalance = await testERC20.balanceOf(payerAddress);
        const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
        const feeNewBalance = await testERC20.balanceOf(feeAddress);

        expect(payerNewBalance.toString()).to.equals(payerOldBalance.sub(1010).toString());
        expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(1000).toString());
        expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(10).toString());
      });
  });

  describe("Contract: ERC20EscrowToPayV1 - Dispute Flow ", () => {
      it("ERC20EscrowToPayV1: Should allow the payer to open a dispute", async () => {
        await testERC20.connect(payer).approve(erc20EscrowToPayAddress, '101');

        await erc20EscrowToPay.connect(payer).openEscrow(
            referenceExample2,
            testERC20.address,
            '100',
            payeeAddress,
            '1',
            feeAddress,
        );
        
        expect(await erc20EscrowToPay.connect(payer).openDispute(referenceExample2))
        .to.emit(erc20EscrowToPay, "DisputeOpened")
            .withArgs('0x32ff26200094816972dfdd450fd4684ea4eca5fba257b0645ca2291a288b0086');
      }); 
      it("ERC20EscrowToPayV1: Should let the payer initiate a dispute", async () => {
          // Initiate Lock Period
          expect(await erc20EscrowToPay.connect(payer).openDispute(referenceExample2));
          escrowBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
      });
      it("ERC20EscrowToPayV1: Should get the correct data from the disputeMapping", async () => {
          disputeMapping = await erc20EscrowToPay.connect(payer).disputeMapping(referenceExample2);
    
          timelockBalance = await testERC20.balanceOf(disputeMapping.tokentimelock);

          const timestamp = await erc20EscrowToPay.connect(payer).getLockPeriodEndTime(referenceExample2);
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
        
        expect(erc20EscrowToPay.connect(payer).withdrawLockedFunds(referenceExample2));

        escrowBalance = await testERC20.balanceOf(erc20EscrowToPay.address);
        disputeMapping = await erc20EscrowToPay.connect(payer).disputeMapping(referenceExample2);
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


});
