import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';

import {
  ERC20EscrowToPay__factory,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  ERC20EscrowToPay
} from '../../src/types';

use(solidity);

describe("Contract: ERC20EscrowToPay", () => {
    const referenceExample1 = '0xaaaa';
    const referenceExample2 = '0xbbbb';
    const referenceExample3 = '0xcccc';
    let testERC20: Contract, erc20EscrowToPay: ERC20EscrowToPay, erc20FeeProxy: ERC20FeeProxy;
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
        erc20EscrowToPay = await new ERC20EscrowToPay__factory(owner).deploy(erc20FeeProxy.address);
    
        erc20EscrowToPayAddress = erc20EscrowToPay.address;
        await testERC20.connect(owner).transfer(payerAddress, 100000000);
    });
    
    describe("Normal Flow: Open & Close Escrow", () => {
        it("Should transfer amount + fee from payer to escrow and fee address", async () => {
            await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);
    
            const payerOldBalance = await testERC20.balanceOf(payerAddress);
            const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
            const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            const builderOldBalance = await testERC20.balanceOf(feeAddress);
    
            expect(
                await erc20EscrowToPay.connect(payer).payEscrow(
                    testERC20.address,
                    payeeAddress,
                    1000,
                    referenceExample1,
                    1,
                    feeAddress
                ),
            )
                .to.emit(erc20EscrowToPay, "RequestInEscrow")
                .withArgs(ethers.utils.keccak256(referenceExample1));
    
            const payerNewBalance = await testERC20.balanceOf(payerAddress);
            const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
            const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);
            const builderNewBalance = await testERC20.balanceOf(feeAddress);
    
            expect(payerNewBalance.toString()).to.equals(payerOldBalance.sub(1001).toString());
            expect(payeeNewBalance).to.equals(payeeOldBalance);
            expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.add(1000).toString());
            expect(builderNewBalance.toString()).to.equals(builderOldBalance.add(1).toString());
        });
        it("Should transfer the payment to the payee when closing the escrow", async () => {
            const payeeOldBalance = await testERC20.balanceOf(payeeAddress);
            const escrowOldBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);

            expect(await erc20EscrowToPay.connect(payer).payRequestFromEscrow(referenceExample1))
                .to.emit(erc20EscrowToPay, "RequestWithdrawnFromEscrow")
                .withArgs(ethers.utils.keccak256(referenceExample1));
            
            const payeeNewBalance = await testERC20.balanceOf(payeeAddress);
            const escrowNewBalance = await testERC20.balanceOf(erc20EscrowToPayAddress);

            expect(payeeNewBalance.toString()).to.equals(payeeOldBalance.add(1000).toString());
            expect(escrowNewBalance.toString()).to.equals(escrowOldBalance.sub(1000).toString());
        })
    });

    describe("Emergency Claim Flow", () => {
        before(async () => {
            await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);
            await erc20EscrowToPay.connect(payer).payEscrow(
                testERC20.address,
                payeeAddress,
                1000,
                referenceExample2,
                1,
                feeAddress
            );
        });
        it("Should let the payee initiate emergencyClaim of Escrow funds", async () => {
            expect(await erc20EscrowToPay.connect(payee).initiateEmergencyClaim(referenceExample2))
                .to.emit(erc20EscrowToPay, "InitiatedEmergencyClaim")
                .withArgs(ethers.utils.keccak256(referenceExample2));
            
            expect(await
                (await erc20EscrowToPay.connect(payee)
                    .requestMapping(referenceExample2)).emergencyState)
                .to.be.true;
            
            expect(await
                (await erc20EscrowToPay.connect(payee)
                    .requestMapping(referenceExample2)).emergencyClaimDate)
                .to.be.above(100000);
        })
        
    });
        
    describe("Freeze Funds Flow: Open Escrow & freeze request for 12 months", () => {
        before(async () => {
            await testERC20.connect(payer).approve(erc20EscrowToPayAddress, 1001);

            await erc20EscrowToPay.connect(payer).payEscrow(
                testERC20.address,
                payeeAddress,
                1000,
                referenceExample3,
                1,
                feeAddress
            );
        });
        it("Should revert if not payer tries to freezeRequest", async () => {
            expect(erc20EscrowToPay.connect(payee).freezeRequest(referenceExample3))
                .to.be.reverted;
        })
        it("Should only let the payer freeze the request for twelve months", async () => {
            expect(await erc20EscrowToPay.connect(payer).freezeRequest(referenceExample3))
                .to.emit(erc20EscrowToPay, "RequestFrozen")
                .withArgs(ethers.utils.keccak256(referenceExample3));
            
            expect(await
                (await erc20EscrowToPay.connect(payer)
                    .requestMapping(referenceExample3)).isFrozen)
                .to.be.true;
            
            expect(await
                (await erc20EscrowToPay.connect(payer)
                    .requestMapping(referenceExample3)).unlockDate)
                .to.be.above(1000000);            

        });
    });

});
  