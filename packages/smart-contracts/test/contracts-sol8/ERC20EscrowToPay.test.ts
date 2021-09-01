import { ethers } from 'hardhat';
import { BigNumber, BytesLike, Signer } from 'ethers';
import { expect, use } from 'chai';
import { solidity } from 'ethereum-waffle';
import {
  MyEscrow__factory,
  TestToken__factory,
  ERC20FeeProxy__factory,
  TestERC20FeeProxy,
  TestToken,
  MyEscrow
} from '../../src/types';

use(solidity);

describe("Contracts: TestToken, TestERC20FeeProxy, MyEscrow", () => {
  let paymentRef1: BytesLike, paymentRef2: BytesLike, feeAmount: number, amount: number;
  let token: TestToken, myEscrow: MyEscrow, erc20FeeProxy: TestERC20FeeProxy;
  let date: Date;
  let disputeMapping: any;
  let timelockBalance: BigNumber, payerBalanceNew: BigNumber, totalSupply: BigNumber, escrowBalance: BigNumber, feeAddressBalance: BigNumber, payerBalanceOld: BigNumber;
  let owner: Signer, payee: Signer, payer: Signer, buidler: Signer;
  let ownerAddress: string, payeeAddress: string, payerAddress: string, buidlerAddress: string, erc20FeeProxyAddress: string, myEscrowAddress: string;
  
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
  buidlerAddress = await buidler.getAddress();
  
  // Get the ContractFactory
  token = await new TestToken__factory(owner).deploy();
  erc20FeeProxy = await new ERC20FeeProxy__factory(owner).deploy();
  myEscrow = await new MyEscrow__factory(owner).deploy(erc20FeeProxy.address);
  
  // await the deployment of the contracts
  totalSupply = await token.balanceOf(ownerAddress);
  await token.transfer(payerAddress, 1000);
  erc20FeeProxyAddress = erc20FeeProxy.address;
  myEscrowAddress = myEscrow.address;
  

      console.log(`
                              ------ PRE-TEST STATUS ------

      *ACCOUNTS:
          -Owner Address           :               ${ownerAddress},
          -Payee Address           :               ${payeeAddress},
          -Payer Address           :               ${payerAddress},
          -Payer Balance           :               ${await token.balanceOf(payerAddress)},
          -FeeAddress              :               ${buidlerAddress}

      *CONTRACTS:
          -TestERC20 Address       :               ${token.address},
          -TestERC20 owner         :               ${await token.owner()},
          -ERC20FeeProxy Address   :               ${erc20FeeProxyAddress},
          -MyEscrow Address        :               ${myEscrowAddress}
      `);  
  });

  describe("Deployments", () => {
      it("TestERC20: Should set the right owner", async () => {
          // Excpect the contract owner to be equal to owner.
          expect(await token.owner()).to.equal(ownerAddress);
      });
      it("TestERC20: Should assign the totalsupply of TestERC20 tokens to the owner", async () => {
          expect(await token.totalSupply()).to.equal(totalSupply);
      });
      it("ERC20FeeProxy: Contract address should remain the same at every deployment", async () => {
      expect(erc20FeeProxy.address).to.equal(erc20FeeProxyAddress);
      });
      it("MyEscrow: Contract address should remain the same at every deployment", async () => {
          expect(myEscrow.address).to.equal(myEscrowAddress);
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
          expect(payeeBalance).to.equal(25);
      });
      it("TestERC20: Should fail if sender don't have enough TestERC20 tokens", async () => {
          const initialOwnerBalance = await token.balanceOf(ownerAddress);

          // Transfer 50 TestERC20 tokens, from payer (25) to owner, 'require' will evaluate false and revert the transaction.
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
          expect(payeeBalance).to.equal(75);
      });
  });

  describe("Transactions - MyEscrow Contract :", () => {
      
      it("MyEscrow: Should let payer to deposit 100 TestERC20 tokens into the Escrow contract", async () => {
          await token.balanceOf(payerAddress);
          await token.connect(payer).approve(myEscrow.address, 110);
            
          await myEscrow.connect(payer).initAndDeposit(token.address, amount, payeeAddress, paymentRef1, feeAmount, buidlerAddress);
          const payerBalanceNew = await token.balanceOf(payerAddress);
          expect(payerBalanceNew).to.equal(1015);
      });
      it("MyEscrow: Should return the Invoice data from the invoiceMapping", async () => {
          const receipt = await myEscrow.getInvoice(paymentRef1);
          console.log(receipt);
          expect(receipt.payee, receipt.payer).to.equal(payeeAddress, payerAddress);
      });
      it("MyEscrow: Should let the payer withdraw funds to the payee", async () => {
          await myEscrow.connect(payer).withdrawFunds(paymentRef1);
          const payeeBalance = await token.balanceOf(payeeAddress);
          expect(payeeBalance).to.equal(75 + amount);
      });
  });

  describe("Transactions - Lock Period:", () => {
      it("MyEscrow: Should let the payer initiate a new escrow", async () => {
          console.log('');
          
          await token.connect(payer).approve(myEscrow.address, 110);
          await expect(myEscrow.connect(payer).initAndDeposit(token.address, amount, payeeAddress, paymentRef2, feeAmount, buidlerAddress))
          .to.emit(myEscrow, "EscrowInitiated");
          //.withArgs('Oxbbbb', 100, payeeAddress, token.address, 10, feeAddress.address);


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

          const timestamp = await myEscrow.connect(payer).getLockPeriodEndTime(paymentRef2);
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
        payerBalanceOld = await token.balanceOf(payerAddress);
        
        expect(myEscrow.connect(payer).withdrawLockedFunds(paymentRef2));

        escrowBalance = await token.balanceOf(myEscrow.address);
        disputeMapping = await myEscrow.connect(payer).disputeMapping(paymentRef2);
        timelockBalance = await token.balanceOf(disputeMapping.tokentimelock);
        payerBalanceNew = await token.balanceOf(payerAddress);
        feeAddressBalance = await token.balanceOf(buidlerAddress);

        console.log(`
        --- PAYER BALANCE ---    
            Payer Old Balance       :               ${payerBalanceOld},
            Payer New Balance       :               ${payerBalanceNew}

        --- DisputeMapping DELETED ---
            Payment reference       :               ${disputeMapping.paymentReference},
            TokenTimelock contract  :               ${disputeMapping.tokentimelock},
            TimeLock balance        :               ${timelockBalance},
            TimeLock endtime        :               ${date}
        
            MyEscrow address        :               ${myEscrow.address},
            MyEscrow balance        :               ${escrowBalance._isBigNumber}
            
        --- FEE DETAILS ---
            Fee Address             :               ${buidlerAddress}, 
            Fee Address balance     :               ${feeAddressBalance}
        `);
      });  
  });

});
