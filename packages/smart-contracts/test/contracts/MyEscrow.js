const ethers = require('ethers');

const { expect } = require('chai');
const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const Contract = artifacts.require("MyEscrow");


// Traditional Truffle test
contract("MyEscrow", (accounts) => {
  it("Should deploy normally", async function () {
    const instance = await Contract.new();
    const payer = accounts[1];
    const payee = accounts[2];
    const feeAmount = 2;
    const feeAddress = '0xF4255c5e53a08f72b0573D1b8905C5a50aA9c2De';
    const paymentReference = '0xaaaa';
  
    console.log(`MyEscrow is deployed to address: ${instance.address}`);
  })
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

¨