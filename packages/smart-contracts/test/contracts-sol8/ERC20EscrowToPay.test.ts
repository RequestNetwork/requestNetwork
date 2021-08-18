import { ethers} from 'hardhat';
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
  before(async function () {
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
    
    console.log(" ------ Pre-test results ------ ");
        console.log(`
        ACCOUNTS:
            Owner Address           :               ${ownerAddress},
            Payee Address           :               ${payeeAddress},
            Payer Address           :               ${payerAddress},
            Payer Balance           :               ${await token.balanceOf(payerAddress)},
            FeeAddress              :               ${buidlerAddress}

        CONTRACTS:
            TestERC20 Address       :               ${token.address},
            TestERC20 owner         :               ${await token.owner()},
            ERC20FeeProxy Address   :               ${erc20FeeProxyAddress},
            MyEscrow Address        :               ${myEscrowAddress}
        `);  
  });


    describe("Deployments", () => {

        it("TestERC20: Should set the right owner", async () => {
            // Excpect the contract owner to be equal to owner.
            expect(await token.owner()).to.equal(ownerAddress);
        });
        it("TestERC20: Should assign the totalsupply of TestERC20 tokens to the owner", async function () {
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
        it("MyEscrow: Shouldn't payout the funds when lock period is NOT over", async () => {
          console.log('');
          payerBalanceOld = await token.balanceOf(payerAddress);
          
          expect(myEscrow.connect(payer).withdrawLockedFunds(paymentRef2));
  
            
          escrowBalance = await token.balanceOf(myEscrow.address);
          disputeMapping = await myEscrow.connect(payer).disputeMapping(paymentRef2);
          timelockBalance = await token.balanceOf(disputeMapping.tokentimelock);
          payerBalanceNew = await token.balanceOf(payerAddress);
          feeAddressBalance = await token.balanceOf(buidlerAddress);

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
              
              Fee Address             :               ${buidlerAddress}, 
              Fee Address balance     :               ${feeAddressBalance}
          `);
        });  
    });
    

});



// STOP Here
/*
describe('contract: SwapToPay', () => {
  let from: string;
  let to: string;
  let builder: string;
  let adminSigner: Signer;
  let signer: Signer;

  const exchangeRateOrigin = Math.floor(Date.now() / 1000);
  const referenceExample = '0xaaaa';

  let paymentNetworkErc20: TestERC20;
  let spentErc20: TestERC20;
  let erc20FeeProxy: ERC20FeeProxy;
  let fakeSwapRouter: FakeSwapRouter;
  let testSwapToPay: ERC20SwapToPay;
  let initialFromBalance: BigNumber;
  let defaultSwapRouterAddress: string;

  const erc20Decimal = BigNumber.from('1000000000000000000');
  const erc20Liquidity = erc20Decimal.mul(100);

  before(async () => {
    [, from, to, builder] = (await ethers.getSigners()).map((s) => s.address);
    [adminSigner, signer] = await ethers.getSigners();

    erc20FeeProxy = erc20FeeProxyArtifact.connect(network.name, adminSigner);
    testSwapToPay = erc20SwapToPayArtifact.connect(network.name, adminSigner);
  });

  beforeEach(async () => {
    paymentNetworkErc20 = await new TestERC20__factory(adminSigner).deploy(erc20Decimal.mul(10000));
    spentErc20 = await new TestERC20__factory(adminSigner).deploy(erc20Decimal.mul(1000));

    // Deploy a fake router and feed it with 200 payment ERC20 + 100 requested ERC20
    // The fake router fakes 2 payment ERC20 = 1 requested ERC20
    fakeSwapRouter = await new FakeSwapRouter__factory(adminSigner).deploy();
    await spentErc20.transfer(fakeSwapRouter.address, erc20Liquidity.mul(2));
    await paymentNetworkErc20.transfer(fakeSwapRouter.address, erc20Liquidity);

    defaultSwapRouterAddress = await testSwapToPay.swapRouter();
    await testSwapToPay.setRouter(fakeSwapRouter.address);
    await testSwapToPay.approveRouterToSpend(spentErc20.address);
    await testSwapToPay.approvePaymentProxyToSpend(paymentNetworkErc20.address);
    testSwapToPay = await testSwapToPay.connect(signer);

    await spentErc20.transfer(from, erc20Decimal.mul(600));
    spentErc20 = TestERC20__factory.connect(spentErc20.address, signer);
    initialFromBalance = await spentErc20.balanceOf(from);
    await spentErc20.approve(testSwapToPay.address, initialFromBalance);
  });

  afterEach(async () => {
    testSwapToPay = testSwapToPay.connect(adminSigner);
    await testSwapToPay.setRouter(defaultSwapRouterAddress);

    // The contract should never keep any fund
    const contractPaymentCcyBalance = await spentErc20.balanceOf(testSwapToPay.address);
    const contractRequestCcyBalance = await paymentNetworkErc20.balanceOf(testSwapToPay.address);
    expect(contractPaymentCcyBalance.toNumber()).to.equals(0);
    expect(contractRequestCcyBalance.toNumber()).to.equals(0);
  });

  const expectFromBalanceUnchanged = async () => {
    const finalFromBalance = await spentErc20.balanceOf(from);
    expect(finalFromBalance.toString()).to.equals(initialFromBalance.toString());
  };

  it('swaps and pays the request', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        // Here we spend 26 max, for 22 used in theory, to test that 4 is given back
        26,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin + 100,
      ),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        ethers.utils.getAddress(paymentNetworkErc20.address),
        to,
        '10',
        ethers.utils.keccak256(referenceExample),
        '1',
        ethers.utils.getAddress(builder),
      );

    const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
    const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(1);
    expect(finalIssuerBalance.toNumber()).to.equals(10);

    // Test that the contract does not hold any fund after the transaction
    const finalContractPaymentBalance = await spentErc20.balanceOf(testSwapToPay.address);
    const finalContractRequestBalance = await paymentNetworkErc20.balanceOf(testSwapToPay.address);
    expect(finalContractPaymentBalance.toNumber()).to.equals(0);
    expect(finalContractRequestBalance.toNumber()).to.equals(0);
  });

  it('does not pay anyone if I swap 0', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        0,
        0,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        0,
        builder,
        exchangeRateOrigin + 100,
      ),
    )
      .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
      .withArgs(
        paymentNetworkErc20.address,
        to,
        '0',
        ethers.utils.keccak256(referenceExample),
        '0',
        builder,
      );

    const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
    const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
    expect(finalBuilderBalance.toNumber()).to.equals(0);
    expect(finalIssuerBalance.toNumber()).to.equals(0);
  });

  it('cannot swap if too few payment tokens', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        21, // Should be at least (10 + 1) * 2
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin + 15,
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  it('cannot swap with a past deadline', async function () {
    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        10,
        22,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1,
        builder,
        exchangeRateOrigin - 15, // Past deadline
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  it('cannot swap more tokens than liquidity', async function () {
    const tooHighAmount = 100;

    expect(erc20Liquidity.mul(2).lt(initialFromBalance), 'Test irrelevant with low balance').to.be
      .true;
    expect(
      erc20Liquidity.lt(erc20Decimal.mul(tooHighAmount).mul(2)),
      'Test irrelevant with low amount',
    ).to.be.true;

    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        erc20Decimal.mul(tooHighAmount),
        initialFromBalance,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        1000000,
        builder,
        exchangeRateOrigin + 15,
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  it('cannot swap more tokens than balance', async function () {
    const highAmount = erc20Decimal.mul(900);
    await spentErc20.approve(testSwapToPay.address, highAmount);

    expect(highAmount.gt(initialFromBalance), 'Test irrelevant with high balance').to.be.true;

    await expect(
      testSwapToPay.swapTransferWithReference(
        to,
        100,
        highAmount,
        [spentErc20.address, paymentNetworkErc20.address],
        referenceExample,
        10,
        builder,
        exchangeRateOrigin + 15,
      ),
    ).to.be.reverted;
    await expectFromBalanceUnchanged();
  });

  describe('Bad ERC20 support', () => {
    let badERC20: BadERC20;
    beforeEach(async () => {
      badERC20 = await new BadERC20__factory(adminSigner).deploy(1000, 'BadERC20', 'BAD', 8);
    });
    it('can approve bad ERC20 to be spent by the proxy', async () => {
      await expect(testSwapToPay.approvePaymentProxyToSpend(badERC20.address))
        .to.emit(badERC20, 'Approval')
        .withArgs(
          testSwapToPay.address,
          erc20FeeProxy.address,
          BigNumber.from(2).pow(256).sub(1).toString(),
        );

      const approval = await badERC20.allowance(testSwapToPay.address, erc20FeeProxy.address);
      expect(approval.toString()).to.equals(BigNumber.from(2).pow(256).sub(1).toString());
    });

    it('can approve bad ERC20 to be swapped by the router', async () => {
      await expect(testSwapToPay.approveRouterToSpend(badERC20.address))
        .to.emit(badERC20, 'Approval')
        .withArgs(
          testSwapToPay.address,
          fakeSwapRouter.address,
          BigNumber.from(2).pow(256).sub(1).toString(),
        );

      const approval = await badERC20.allowance(testSwapToPay.address, fakeSwapRouter.address);
      expect(approval.toString()).to.equals(BigNumber.from(2).pow(256).sub(1).toString());
    });

    it('swaps badERC20 to another ERC20 for payment', async () => {
      await testSwapToPay.approveRouterToSpend(badERC20.address);

      await badERC20.transfer(from, '100');
      await badERC20.connect(signer).approve(testSwapToPay.address, initialFromBalance);

      await expect(
        testSwapToPay.swapTransferWithReference(
          to,
          10,
          26,
          [badERC20.address, paymentNetworkErc20.address],
          referenceExample,
          1,
          builder,
          exchangeRateOrigin + 100,
        ),
      )
        .to.emit(erc20FeeProxy, 'TransferWithReferenceAndFee')
        .withArgs(
          paymentNetworkErc20.address,
          to,
          '10',
          ethers.utils.keccak256(referenceExample),
          '1',
          builder,
        );

      // Test that issuer and builder (fee receiver) have been paid
      const finalBuilderBalance = await paymentNetworkErc20.balanceOf(builder);
      const finalIssuerBalance = await paymentNetworkErc20.balanceOf(to);
      expect(finalBuilderBalance.toNumber()).to.equals(1);
      expect(finalIssuerBalance.toNumber()).to.equals(10);

      // Test that the contract does not hold any fund after the transaction
      const finalContractPaymentBalance = await badERC20.balanceOf(testSwapToPay.address);
      const finalContractRequestBalance = await paymentNetworkErc20.balanceOf(
        testSwapToPay.address,
      );
      expect(finalContractPaymentBalance.toNumber()).to.equals(0);
      expect(finalContractRequestBalance.toNumber()).to.equals(0);
    });
  });
});
*/
