/* eslint-disable prefer-const */
import { ethers } from 'hardhat';
import { BigNumber, BytesLike, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  ERC20EscrowToPay__factory,
  TestERC20__factory,
  ERC20FeeProxy__factory,
  ERC20FeeProxy,
  TestERC20,
  ERC20EscrowToPay
} from '../../src/types';

use(solidity);

describe("Contracts: TestERC20, ERC20FeeProxy, ERC20EscrowToPay", () => {
  let paymentRef1: BytesLike, paymentRef2: BytesLike, feeAmount: number, amount: number;
  let token: TestERC20, erc20EscrowToPay: ERC20EscrowToPay, erc20FeeProxy: ERC20FeeProxy;
  let date: Date;
  let disputeMapping: any;
  let timelockBalance: BigNumber, payerBalanceNew: BigNumber, escrowBalance: BigNumber, feeAddressBalance: BigNumber, payerBalanceOld: BigNumber;
  let owner: Signer, payee: Signer, payer: Signer, buidler: Signer;
  let ownerAddress: string, payeeAddress: string, payerAddress: string, feeAddress: string, erc20FeeProxyAddress: string, erc20EscrowToPayAddress: string;
  
  amount = 100;
  feeAmount = 10;
  paymentRef1 = '0xaaaa';
  paymentRef2 = '0xbbbb';
  

  // Will run before tests, re-deploying the contract once,
  // it receives a callback, which can be async.
  before(async () => {
  // Get the Signers
  [owner, payee, payer, buidler] = await ethers.getSigners();
  ownerAddress = await owner.getAddress();
  payeeAddress = await payee.getAddress();
  payerAddress = await payer.getAddress();
  feeAddress = await buidler.getAddress();
  
  // Get the ContractFactory
  token = await new TestERC20__factory(owner).deploy(1000000000);
  erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
  erc20EscrowToPay = await new ERC20EscrowToPay__factory(owner).deploy(erc20FeeProxy.address);
  
  
  await token.transfer(payerAddress, 1000);
  erc20FeeProxyAddress = erc20FeeProxy.address;
  erc20EscrowToPayAddress = erc20EscrowToPay.address;
  

    console.log(`
    ------ PRE-TEST STATUS ------

    *ACCOUNTS:
        -Owner Address                  :               ${ownerAddress},
        -Payee Address                  :               ${payeeAddress},
        -Payer Address                  :               ${payerAddress},
        -Payer Balance                  :               ${await token.balanceOf(payerAddress)},
        -FeeAddress                     :               ${feeAddress}

    *CONTRACTS:
        -TestERC20 Address              :               ${token.address},
        -TestERC20 owner                :               ${ownerAddress},
        -ERC20FeeProxy Address          :               ${erc20FeeProxyAddress},
        -erc20EscrowToPay Address       :               ${erc20EscrowToPayAddress}
    `);  
  });

  describe("Deployments", () => {
      it("TestERC20: Should have a totalSupply of 1000000000 TestERC20 Tokens ", async () => {
          expect(await token.totalSupply()).to.equal(1000000000);
      });
      it("ERC20FeeProxy: Contract address should remain the same at every deployment", async () => {
      expect(erc20FeeProxy.address).to.equal(erc20FeeProxyAddress);
      });
      it("ERC20EscrowToPay: Contract address should remain the same at every deployment", async () => {
          expect(erc20EscrowToPay.address).to.equal(erc20EscrowToPayAddress);
      });
  });
  
  describe("Transactions - TestERC20 Contract :", () => {
      it("TestERC20: Should transfer 50 TestERC20 tokens from owner to payer", async () => {
          await token.transfer(payerAddress, 50);
          const payerBalance = await token.balanceOf(payerAddress);
          expect(payerBalance).to.equal(1050);
      });  
      it("TestERC20: Should transfer 25 tokens between payer and payee", async () => {
          // OBS: We use .connect(signer) to send a transaction from another account
          await token.connect(payer).transfer(payeeAddress, 25);
          const payeeBalance = await token.balanceOf(payeeAddress);
          expect(payeeBalance).to.equal(35);
      });
      it("TestERC20: Should fail if sender don't have enough TestERC20 tokens", async () => {
          const initialOwnerBalance = await token.balanceOf(ownerAddress);

          // Transfer 50 TestERC20 tokens, from payer (25) to owner, 'require' will evaluate false and revert the transaction.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        expect(token.connect(payer).transfer(payeeAddress, 1500)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
        

          // Owner balance should not have changed.
          expect(await token.balanceOf(ownerAddress)).to.equal(initialOwnerBalance);
      });
      it("TestERC20: Should update the balances after transfers", async () => {
          // Transfer 100 tokens from owner to payer.
          await token.transfer(payerAddress, amount);

          const payerBalance = await token.balanceOf(payerAddress);
          expect(payerBalance).to.equal(1125);

          // Transfer 50 tokens from owner to payee.
          await token.transfer(payeeAddress, 50);

          const payeeBalance = await token.balanceOf(payeeAddress);
          expect(payeeBalance).to.equal(85);
      });
  });

  describe("Transactions - ERC20EscrowToPay Contract :", () => {
      
      it("ERC20EscrowToPay: Should let payer to deposit 100 TestERC20 tokens into the Escrow contract", async () => {
          await token.balanceOf(payerAddress);
          await token.connect(payer).approve(erc20EscrowToPayAddress, 110);
            
          await erc20EscrowToPay.connect(payer).openEscrow(paymentRef1, token.address, amount, payeeAddress,  feeAmount, feeAddress);
          const payerBalanceNew = await token.balanceOf(payerAddress);
          expect(payerBalanceNew).to.equal(1015);
      });
      it("ERC20EscrowToPay: Should return the Invoice data from the invoiceMapping", async () => {
          const receipt = await erc20EscrowToPay.getInvoice(paymentRef1);
          console.log(receipt);
          expect(receipt.payee, receipt.payer).to.equal(payeeAddress, payerAddress);
      });
      it("ERC20EscrowToPay: Should let the payer withdraw funds to the payee", async () => {
          await erc20EscrowToPay.connect(payer).closeEscrow(paymentRef1);
          const payeeBalance = await token.balanceOf(payeeAddress);
          expect(payeeBalance).to.equal(85 + amount);
      });
  });

  describe("Transactions - Lock Period:", () => {
      it("ERC20EscrowToPay: Should let the payer initiate a new escrow", async () => {
          console.log('');
          
          await token.connect(payer).approve(erc20EscrowToPayAddress, 110);
          await expect(erc20EscrowToPay.connect(payer).openEscrow(paymentRef2, token.address, amount, payeeAddress, feeAmount, feeAddress))
          .to.emit(erc20EscrowToPay, "OpenEscrow");
          //.withArgs('Oxbbbb', 100, payeeAddress, token.address, 10, feeAddress.address);


          escrowBalance = await token.balanceOf(erc20EscrowToPayAddress);
          expect(escrowBalance).to.equal(amount + feeAmount);
          
          console.log(' ------ New escrow initiated -----');
          console.log(`
              Payment reference         :               ${paymentRef2},
              Escrow balance incl.fee   :               ${escrowBalance}
          `);
      }); 
      it("ERC20EscrowToPay: Should let the payer initiate the lock period", async () => {
          // Initiate Lock Period
          expect(await erc20EscrowToPay.connect(payer).openDispute(paymentRef2));
          escrowBalance = await token.balanceOf(erc20EscrowToPayAddress);
      });
      it("ERC20EscrowToPay: Should get the correct data from the disputeMapping", async () => {
          disputeMapping = await erc20EscrowToPay.connect(payer).disputeMapping(paymentRef2);
    
          timelockBalance = await token.balanceOf(disputeMapping.tokentimelock);

          const timestamp = await erc20EscrowToPay.connect(payer).getLockPeriodEndTime(paymentRef2);
          date = new Date(timestamp.toNumber() * 1000);
      });
      it("ERC20EscrowToPay: Should check the timelock balance is correct", async () => {
          expect(await disputeMapping.amount).to.be.equal(timelockBalance);
      });
      it("ERC20EscrowToPay: Should display the correct values of the TokenTimelock period", async () => {
        console.log(`
        ------ Lock Period Initiated -----

            Payment reference           :               ${disputeMapping.paymentReference},
            TokenTimelock contract      :               ${disputeMapping.tokentimelock},
            TimeLock balance            :               ${timelockBalance},
            TimeLock endtime            :               ${date}


        --- Escrow balance reset to zero ---

            ERC20EscrowToPay address    :               ${erc20EscrowToPay.address},
            ERC20EscrowToPay balance    :               ${escrowBalance}
        `);
      });
      it("ERC20EscrowToPay: Should payout the funds when lock period is over", async () => {
        payerBalanceOld = await token.balanceOf(payerAddress);
        
        expect(erc20EscrowToPay.connect(payer).withdrawLockedFunds(paymentRef2));

        escrowBalance = await token.balanceOf(erc20EscrowToPayAddress);
        disputeMapping = await erc20EscrowToPay.connect(payer).disputeMapping(paymentRef2);
        timelockBalance = await token.balanceOf(disputeMapping.tokentimelock);
        payerBalanceNew = await token.balanceOf(payerAddress);
        feeAddressBalance = await token.balanceOf(feeAddress);

        console.log(`
        --- PAYER BALANCE --- 

            Payer Old Balance           :               ${payerBalanceOld},
            Payer New Balance           :               ${payerBalanceNew}

        --- DisputeMapping DELETED ---

            Payment reference           :               ${disputeMapping.paymentReference},
            TokenTimelock contract      :               ${disputeMapping.tokentimelock},
            TimeLock balance            :               ${timelockBalance},
            TimeLock endtime            :               ${date}
        
            ERC20EscrowToPay address    :               ${erc20EscrowToPayAddress},
            ERC20EscrowToPay balance    :               ${escrowBalance._isBigNumber}
            
        --- FEE DETAILS ---

            Fee Address                 :               ${feeAddress}, 
            Fee Address balance         :               ${feeAddressBalance}
        `);
      });  
  });

});
