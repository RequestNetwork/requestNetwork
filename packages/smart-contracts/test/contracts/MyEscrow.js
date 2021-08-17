const { expect, use} = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("ethers");
const hre = require("hardhat");

  
use(solidity);

describe("Contracts: TestToken, ERC20FeeProxy, MyEscrow", () => {

    let owner, payee, payer, feeAddress, addrs, totalSupply, token;
    const feeAmount = 10;
    const amount = 100;
    const paymentRef1 = 0xaaaa;
    const paymentRef2 = 0xbbbb;
    const paymentRef3 = 0xcccc;
    var date;
    var timelockBalance;
    var disputeMapping;
    var escrowBalance;

    
    // Will run before tests, re-deploying the contract once,
    // it receives a callback, which can be async.
    before(async function () {
        // Get the ContractFactory
        _contractInstance = await hre.ethers.getContractFactory("TestToken", {From: owner});
        token = await _contractInstance.deploy();
        _contractInstance = await hre.ethers.getContractFactory("ERC20FeeProxy", {From: owner});
        ERC20FeeProxy = await _contractInstance.deploy();
        _contractInstance = await hre.ethers.getContractFactory("MyEscrow", {From: owner});
        myEscrow = await _contractInstance.deploy(ERC20FeeProxy.address);

        // Get the Signers
        [owner, payee, payer, feeAddress, ...addrs] = await hre.ethers.getSigners();

        // await the deployment of the contracts
        
        totalSupply = await token.balanceOf(owner.address);
        await token.transfer(payer.address, 1000);

        console.log(" ------ Pre-test results ------ ");
            console.log(`
            ACCOUNTS:
                Owner Address           :               ${owner.address},
                Payee Address           :               ${payee.address},
                Payer Address           :               ${payer.address},
                Payer Balance           :               ${await token.balanceOf(payer.address)},
                FeeAddress              :               ${feeAddress.address}
    
            CONTRACTS:
                TestERC20 Address       :               ${token.address},
                TestERC20 owner         :               ${await token.owner()},
                ERC20FeeProxy Address   :               ${ERC20FeeProxy.address},
                MyEscrow Address        :               ${myEscrow.address}
            `);  
    });


    describe("Deployments", () => {

        it("TestERC20: Should set the right owner", async () => {
            // Excpect the contract owner to be equal to owner.
            expect(await token.owner()).to.equal(owner.address);
        });
        it("TestERC20: Should assign the totalsupply of TestERC20 tokens to the owner", async function () {
            expect(await token.totalSupply()).to.equal(totalSupply);
        });
        it("ERC20FeeProxy: Contract address should remain the same at every deployment", async () => {
            expect(ERC20FeeProxy.address).to.equal("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
        });
        it("MyEscrow: Contract address should remain the same at every deployment", async () => {
            expect(await myEscrow.address).to.equal("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
        });
    });
    

    describe("Transactions - TestERC20 Contract :", () => {

        it("TestERC20: Should transfer 50 TestERC20 tokens from owner to payer", async () => {
            await token.transfer(payer.address, 50);
            const payerBalance = await token.balanceOf(payer.address);
            expect(payerBalance).to.equal(1050);
        });  
        it("TestERC20: Should transfer 25 tokens between payer and payee", async () => {
            // OBS: We use .connect(signer) to send a transaction from another account
            await token.connect(payer).transfer(payee.address, 25);
            const payeeBalance = await token.balanceOf(payee.address);
            expect(payeeBalance).to.equal(25);
        });
        it("TestERC20: Should fail if sender don't have enough TestERC20 tokens", async () => {
            const initialOwnerBalance = await token.balanceOf(owner.address);

            // Transfer 50 TestERC20 tokens, from payer (25) to owner, 'require' will evaluate false and revert the transaction.
            expect(token.connect(payer).transfer(payee.address, 1500)).to.be.revertedWith('ERC20: transfer amount exceeds balance');

            // Owner balance should not have changed.
            expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });
        it("TestERC20: Should update the balances after transfers", async () => {
            // Transfer 100 tokens from owner to payer.
            await token.transfer(payer.address, amount);

            const payerBalance = await token.balanceOf(payer.address);
            expect(payerBalance).to.equal(1125);

            // Transfer 50 tokens from owner to payee.
            await token.transfer(payee.address, 50);

            const payeeBalance = await token.balanceOf(payee.address);
            expect(payeeBalance).to.equal(75);
        });
    });

    describe("Transactions - MyEscrow Contract :", () => {
        
        it("MyEscrow: Should let payer to deposit 100 TestERC20 tokens into the Escrow contract", async () => {
            await token.balanceOf(payer.address);
            await token.connect(payer).approve(myEscrow.address, 110);
             
            await myEscrow.connect(payer).initAndDeposit(token.address, amount, payee.address, paymentRef1, feeAmount, feeAddress.address);
            const payerBalanceNew = await token.balanceOf(payer.address);
            expect(payerBalanceNew).to.equal(1015);
        });
        it("MyEscrow: Should return the Invoice data from the invoiceMapping", async () => {
            const receipt = await myEscrow.getInvoice(paymentRef1);
            expect(receipt.payee, receipt.payer).to.equal(payee.address, payer.address);
        });
        it("MyEscrow: Should let the payer withdraw funds to the payee", async () => {
            await myEscrow.connect(payer).withdrawFunds(paymentRef1);
            const payeeBalance = await token.balanceOf(payee.address);
            expect(payeeBalance).to.equal(75 + amount);
        });
    });

    describe("Transactions - Lock Period:", () => {

        it("MyEscrow: Should let the payer initiate a new escrow", async () => {
            console.log('');
            
            await token.connect(payer).approve(myEscrow.address, 110);
            await expect(myEscrow.connect(payer).initAndDeposit(token.address, amount, payee.address, paymentRef2, feeAmount, feeAddress.address))
            .to.emit(myEscrow, "EscrowInitiated");
            //.withArgs('Oxbbbb', 100, payee.address, token.address, 10, feeAddress.address);


            escrowBalance = await token.balanceOf(myEscrow.address);
            expect(escrowBalance).to.equal(amount + feeAmount);
            
            console.log(' ------ New escrow initiated -----');
            console.log(`
                Payment reference       :               ${paymentRef2},
                Escrow balance incl.fee :               ${escrowBalance},
            `);
        }); 
        it("MyEscrow: Should let the payer initiate the lock period", async () => {
            // Initiate Lock Period
            expect(await myEscrow.connect(payer).initLockPeriod(paymentRef2));
            escrowBalance = await token.balanceOf(myEscrow.address);
        });
        it("MyEscrow: Should get the correct data from the disputeMapping", async () => {
            disputeMapping = await myEscrow.connect(payer).disputeMapping(paymentRef2);
      
            timelockBalance = await token.balanceOf(disputeMapping.tokentimelock);

            const timestamp = await myEscrow.connect(payer).getDispute(paymentRef2);
            date = new Date(timestamp.toNumber() * 1000);
        });
        it("MyEscrow: Should check the timelock balance is correct", async () => {
            expect(await disputeMapping.amount).to.be.equal(timelockBalance);
        });
        it("MyEscrow: Should display the correct values of the TokenTimelock period", async () => {

            console.log(` 
            ------ Lock Period Initiated -----
            `);
            console.log(`
                Payment reference       :               ${disputeMapping.paymentReference},
                TokenTimelock contract  :               ${disputeMapping.tokentimelock},
                TimeLock balance        :               ${timelockBalance},
                TimeLock endtime        :               ${date}

                --- Escrow balance reset to zero ---
                MyEscrow address        :               ${myEscrow.address},
                MyEscrow balance        :               ${escrowBalance}
            `);
        });
        it("MyEscrow: Should payout the funds when lock period is over", async () => {
            console.log('');
            const payeeBalanceOld = await token.balanceOf(payee.address);
            const payerBalanceOld = await token.balanceOf(payer.address);
            const receipt = expect(await myEscrow.connect(payer).withdrawLockedFunds(paymentRef2));
            
            escrowBalance = await token.balanceOf(myEscrow.address);
            disputeMapping = await myEscrow.connect(payer).disputeMapping(paymentRef2);
            timelockBalance = await token.balanceOf(disputeMapping.tokentimelock);
            payerBalanceNew = await token.balanceOf(payer.address);
            const payeeBalance = await token.balanceOf(payee.address);
            const feeAddressBalance = await token.balanceOf(feeAddress.address);

            //console.log(receipt);
            //console.log(disputeMapping);

            console.log(`
            --- Payer balance ---    
                Payer Old Balance       :               ${payerBalanceOld},
                Payer New Balance       :               ${payerBalanceNew}

            --- DisputeMapping deleted ---
                Payment reference       :               ${disputeMapping.paymentReference},
                TokenTimelock contract  :               ${disputeMapping.tokentimelock},
                TimeLock balance        :               ${timelockBalance},
                TimeLock endtime        :               ${date}
            
                MyEscrow address        :               ${myEscrow.address},
                MyEscrow balance        :               ${escrowBalance}
                
                Fee Address             :               ${feeAddress.address}, 
                Fee Address balance     :               ${feeAddressBalance}
            `);
        });  
    });
    

});




/*
    await expect(counter.increment())
    .to.emit(counter, 'ValueChanged')
    .withArgs(0, 1);

    await expect(myEscrow.connect(payer).initAndDeposit(token.address, 100, payee.address, paymentRef1, 10, feeAddress.address))
    .to.emit(myEscrow, "EscrowInitiated")
    .withArgs('Oxbbbb', 100, payee.address, token.address, 10, feeAddress.address);
    *

    expect(await token.connect(payer).approve(myEscrow.address, 100))
    .to.emit(TestERC20, 'Approval')
    .withArgs(payer.address, myEscrow.address, 100);

    await myEscrow.connect(payer).initAndDeposit(token.address, amount, payee.address, paymentRef2, feeAmount, feeAddress.address);

*/