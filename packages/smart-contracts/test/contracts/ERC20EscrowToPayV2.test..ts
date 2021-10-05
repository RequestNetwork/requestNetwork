import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  ERC20EscrowToPayV2__factory,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  ERC20EscrowToPayV2
} from '../../src/types';

use(solidity);

describe("Contract: ERC20EscrowToPayV2", () => {
    const referenceExample1 = '0xaaaa';
    const referenceExample2 = '0xbbbb';
    let testERC20: Contract, erc20EscrowToPayV2: ERC20EscrowToPayV2, erc20FeeProxy: ERC20FeeProxy;
    let owner: Signer, payer: Signer, payee: Signer, buidler: Signer;
    let payerAddress: string, payeeAddress: string, feeAddress: string, erc20EscrowToPayAddress: string;
    
    before(async () => {
        // Get the Signers
        [owner, payer, payee, buidler] = await ethers.getSigners();
        payerAddress = await payer.getAddress();
        payeeAddress = await payee.getAddress();
        feeAddress = await buidler.getAddress();
        
        // Deploy the smart-contracts. 
        testERC20 = await new TestERC20__factory(owner).deploy('100000000000000000');
        erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
        erc20EscrowToPayV2 = await new ERC20EscrowToPayV2__factory(owner).deploy(erc20FeeProxy.address, feeAddress);
    
        erc20EscrowToPayAddress = erc20EscrowToPayV2.address;
        await testERC20.connect(owner).transfer(payerAddress, 100000000);
    });
    
    describe("Normal Flow: Open & Close Escrow", () => {
        it("Should transfer requested amount + feeAmount from payer to escrow contract", async () => {
            await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);
    
            const payerOldBalance = await testERC20.balanceOf(payerAddress);
            const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
    
            expect(
                await erc20EscrowToPayV2.connect(payer).payRequestToEscrow(
                    testERC20.address,
                    1000,
                    referenceExample1
                ),
            )
                .to.emit(erc20EscrowToPayV2, "RequestInEscrow")
                .withArgs(ethers.utils.keccak256(referenceExample1));
    
            const payerNewBalance = await testERC20.balanceOf(payerAddress);
            const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
    
            expect(payerNewBalance.toString()).to.equals(payerOldBalance.sub(1001).toString());
            expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.add(1001).toString());
        });
        it("Should transfer the payment and pay fees when closing the escrow", async () => {
            const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
            const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            const buidlerOldBalance = await testERC20.balanceOf(feeAddress);

            expect(await erc20EscrowToPayV2.connect(payer).payRequestFromEscrow(
                referenceExample1,
                payeeAddress),
            )
                .to.emit(erc20EscrowToPayV2, "RequestWithdrawnFromEscrow")
                .withArgs(ethers.utils.keccak256(referenceExample1));
            
            const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
            const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            const buidlerNewBalance = await testERC20.balanceOf(feeAddress);

            expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(1000).toString());
            expect(buidlerNewBalance.toString()).to.equals(buidlerOldBalance.add(1).toString());
            expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(1001).toString());
        })
    });

    describe("Freeze Funds Flow: Open Escrow & freeze request for 12 months", () => {
        before(async () => {
            await erc20EscrowToPayV2.connect(payer).payRequestToEscrow(
                testERC20.address,
                1000,
                referenceExample2
            );
        });
        it("Should revert if not payer tries to freezeRequest", async () => {
            expect(erc20EscrowToPayV2.connect(payee).FreezeRequest(referenceExample2))
                .to.be.reverted;
        })
        it("Should only let the payer freeze the request for twelve months", async () => {
            expect(await erc20EscrowToPayV2.connect(payer).FreezeRequest(referenceExample2))
                .to.emit(erc20EscrowToPayV2, "RequestFreezed")
                .withArgs(ethers.utils.keccak256(referenceExample2));
            
            expect(await
                (await erc20EscrowToPayV2.connect(payer)
                    .requestMapping(referenceExample2)).isFrozen)
                .to.be.true;
            
            expect(await
                (await erc20EscrowToPayV2.connect(payer)
                    .requestMapping(referenceExample2)).unlockDate)
                .to.be.above(0);            

        });
        it("Should revert payer tries to withdraw before unlockDate", async () => {
            expect(await erc20EscrowToPayV2.connect(payer).withdrawFrozenFunds(referenceExample2)).to.throw;
        });
    });







});
        
    
//         it("ERC20EscrowToPayV1: Should close escrow, pay request and fees", async () => {
//             const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
//             const feeOldBalance = await testERC20.balanceOf(feeAddress);
//             const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            
//             expect(await erc20EscrowToPayV1.connect(payer).closeEscrow(referenceExample1))
//                 .to.emit(erc20EscrowToPayV1, 'EscrowCompleted')
//                 .withArgs(ethers.utils.keccak256(referenceExample1));
            
//             const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
//             const feeNewBalance = await testERC20.balanceOf(feeAddress);
//             const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            
//             expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(1000).toString());
//             expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(10).toString());
//             expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(1010).toString());
//         });
//         it("ERC20EscrowToPayV1: Should allow the payer to open a dispute", async () => {
//             await testERC20.connect(payer).approve(erc20EscrowToPayAddress, '101');
            
//             await erc20EscrowToPayV1.connect(payer).openEscrow(
//                 referenceExample2,
//                 testERC20.address,
//                 '100',
//                 payeeAddress,
//                 '1',
//                 feeAddress,
//             );
                
//             expect(await erc20EscrowToPayV1.connect(payer).openDispute(referenceExample2))
//                 .to.emit(erc20EscrowToPayV1, "DisputeOpened")
//                 .withArgs(ethers.utils.keccak256(referenceExample2));
//         }); 
//         it("ERC20EscrowToPayV1: Should resolve a dispute, pay request and fees", async () => {
//             const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
//             const feeOldBalance = await testERC20.balanceOf(feeAddress);
//             const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
    
//             expect(await erc20EscrowToPayV1.connect(payer).resolveDispute(referenceExample2))
//                 .to.emit(erc20EscrowToPayV1, "DisputeResolved")
//                 .withArgs(ethers.utils.keccak256(referenceExample2));
            
//             const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
//             const feeNewBalance = await testERC20.balanceOf(feeAddress);
//             const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            
//             expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(100).toString());
//             expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(1).toString());
//             expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(101).toString());
//         });
//         it("ERC20EscrowToPayV1: Should escalate the dispute, pay the fees and timelock the funds", async () => {
//             await testERC20.connect(payer).approve(erc20EscrowToPayAddress, '202');
//             await erc20EscrowToPayV1.connect(payer).openEscrow(
//                 referenceExample3,
//                 testERC20.address,
//                 '200',
//                 payeeAddress,
//                 '2',
//                 feeAddress,
//             ); 
//             await erc20EscrowToPayV1.connect(payer).openDispute(referenceExample3);
    
//             const feeOldBalance = await testERC20.balanceOf(feeAddress);
//             const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            
//             expect(await erc20EscrowToPayV1.connect(payer).lockDisputedFunds(referenceExample3))
//                 .to.emit(erc20EscrowToPayV1, "LockPeriodStarted");
            
//             const disputeMapping = await (erc20EscrowToPayV1.disputeMapping(referenceExample3));
//             const tokentimelock = await disputeMapping.tokentimelock;
//             const tokenTimelockNewBalance = await testERC20.balanceOf(tokentimelock);
//             const feeNewBalance = await testERC20.balanceOf(feeAddress);
//             const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            
            
//             expect(feeNewBalance.toString()).to.equals(feeOldBalance.add(2).toString());
//             expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(202).toString());
//             expect(tokenTimelockNewBalance.toString()).to.equals(escrowOldBalance.sub(2).toString());
//         });
//         it("ERC20EscrowToPayV1: Should revert and NOT release the TokenTimelocked funds", async () => {
//             const disputeMapping = await (erc20EscrowToPayV1.disputeMapping(referenceExample3));
//             const tokentimelock = await disputeMapping.tokentimelock;
//             const payerOldBalance = await testERC20.balanceOf(payerAddress);
//             const tokenTimelockOldBalance = await testERC20.balanceOf(tokentimelock);
    
//             await expect(erc20EscrowToPayV1.connect(payer).withdrawTimeLockedFunds(referenceExample3)).to.be.reverted;
            
//             const tokenTimelockNewBalance = await testERC20.balanceOf(tokentimelock);
//             const payerNewBalance = await testERC20.balanceOf(payerAddress);
            
//             expect(payerNewBalance.toString()).to.equals(payerOldBalance);
//             expect(tokenTimelockNewBalance.toString()).to.equals(tokenTimelockOldBalance);
//         });
//         it("ERC20EscrowToPayV1: Shouldn't let the payee close the escrow before the claimDate", async () => {
//             await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1010);
//             expect(
//                 await erc20EscrowToPayV1.connect(payer).openEscrow(
//                     referenceExample4,
//                     testERC20.address,
//                     '1000',
//                     payeeAddress,
//                     '10',
//                     feeAddress,
//                 ),
//             )
//             .to.emit(erc20EscrowToPayV1, "OpenEscrow")
//             .withArgs(ethers.utils.keccak256(referenceExample4));
                    
//             const payerOldBalance = await testERC20.balanceOf(payerAddress);
//             const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
//             const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
    
//             await expect(erc20EscrowToPayV1.connect(payee).closeEscrow(referenceExample4)).to.be.reverted;
            
//             const payerNewBalance = await testERC20.balanceOf(payerAddress);
//             const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
//             const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
    
//             expect(payerNewBalance.toString()).to.equals(payerOldBalance);
//             expect(payeeNewBalance.toString()).to.equals(payeeOldBalance);
//             expect(escrowNewBalance.toString()).to.equals(escrowOldBalance);
//         });
//     }) 

// });
