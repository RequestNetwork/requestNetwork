var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
  return;
}

const CentralBankContract = artifacts.require("./base/token/CentralBank");
var BigNumber = require('bignumber.js');

contract('central bank contract ', accounts => {
  let centralBankInstance = null;
  const [account1, account2, account3] = accounts;

  it("is created with 0 total supply", async () => {
    const centralBankInstance = await CentralBankContract.new();

    assert.equal(await centralBankInstance.totalSupply(), 0);
  });

  it("can be created with an initial supply", async () => {
    const initialSupply = 1000;
    const centralBankInstance = await CentralBankContract.new(initialSupply);

    assert.equal(await centralBankInstance.totalSupply(), initialSupply);
  });

  it("can be minted", async () => {
    const centralBankInstance = await CentralBankContract.new();
    assert.equal(await centralBankInstance.totalSupply(), 0);
    
    await centralBankInstance.mint(100);
    assert.equal((await centralBankInstance.totalSupply()).toNumber(), 100);
  });

  it("can be minted several times", async () => {
    const centralBankInstance = await CentralBankContract.new();
    assert.equal(await centralBankInstance.totalSupply(), 0);
    
    await centralBankInstance.mint(100);
    await centralBankInstance.mint(100);
    await centralBankInstance.mint(100);
    assert.equal((await centralBankInstance.totalSupply()).toNumber(), 300);
    assert.equal((await centralBankInstance.balanceOf(account1)).toNumber(), 300);
  });

  it("mints maximum 10e21 tokens at once", async () => {
    const centralBankInstance = await CentralBankContract.new();
    assert.equal(await centralBankInstance.totalSupply(), 0);

    await centralBankInstance.mint(new BigNumber(10).pow(21).add(1));
    
    assert.equal((await centralBankInstance.totalSupply()).toNumber(), new BigNumber(10).pow(21));
  });

  it("permits transfers", async () => {
    const centralBankInstance = await CentralBankContract.new(1000);

    await centralBankInstance.transfer(account2, 10);
    
    assert.equal((await centralBankInstance.balanceOf(account1)).toNumber(), 1000-10);
    assert.equal((await centralBankInstance.balanceOf(account2)).toNumber(), 10);
    assert.equal((await centralBankInstance.totalSupply()).toNumber(), 1000);
  });

  it("permits allowance", async () => {
    const centralBankInstance = await CentralBankContract.new(1000);
    
    await centralBankInstance.approve(account2, 100)
    assert.equal((await centralBankInstance.allowance(account1, account2)).toNumber(), 100);
    
    await centralBankInstance.transferFrom(account1, account3, 10, { from: account2 });
    
    assert.equal((await centralBankInstance.balanceOf(account1)).toNumber(), 1000-10);
    assert.equal((await centralBankInstance.balanceOf(account2)).toNumber(), 0);
    assert.equal((await centralBankInstance.balanceOf(account3)).toNumber(), 10);
    assert.equal((await centralBankInstance.totalSupply()).toNumber(), 1000);
  });
});
