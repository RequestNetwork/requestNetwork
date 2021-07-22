const { assert } = require("console");

const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const Contract = artifacts.require("./MyEscrow.sol");
const TestERC20 = artifacts.require("./TestERC20.sol");


// Traditional Truffle test
contract("MyEscrow", async (accounts) => {
  const DAI_address = '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35';
  
  const Owner = accounts[0];
  const payer = accounts[1];
  const payee = accounts[2];
  const feeAddress = accounts[3];
  const amount = 10;
  const feeAmount = 2;
  const paymentReferece = '0xaaaa';
  const paymentToken = DAI_address;

  let instance;

  before(async () => {
   instance = await Contract.deployed(ERC20FeeProxy, {from: Owner});
  });

  describe("Deployment tests", () => {
    it("Should deploy as normal and print out the contract address.", async () => {
      console.log(`MyEscrow is deployed to address: ${instance.address}`);
    });
  });

  describe("Deposits to Escrow", () => {
    it("Should Init and deposit ERC20 token to MyEscrow contract", async () => {
        await instance.initAndDeposit(paymentToken, amount, payee, paymentReferece, feeAmount, feeAddress, {from: Owner,});
        let result = await instance.getInvoice(paymentReferece);
        aassert(result.amount.toNumber() ===  10, "MyEscrow contract is not funded properly");
    });
  });
});
///  init and deposit
/// widthdraw as payer
/// withdraw from payee or other address - Revert
/// once paid to escrow, if paid again -revert
/// after withdraw, amount is 0, not withdraw multiple times.
/// all checks relating to uoutside account
/// 
/// 12 months lockup


/// finish functions
/// finish tests
/// frontend with buttons

/// wednesday presentation for Yoann
/// Julien, chris thursday?