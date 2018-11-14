const expectEvent = require('openzeppelin-solidity/test/helpers/expectEvent');
const shouldFail = require('openzeppelin-solidity/test/helpers/shouldFail');
const RequestHashStorage = artifacts.require('./RequestHashStorage.sol');

contract('RequestHashStorage', function(accounts) {
  const admin = accounts[0];
  const otherguy = accounts[1];
  const yetotherguy = accounts[2];
  const burner = accounts[3];
  const arbitraryAmount = 100;
  const hashExample = 'Qmaisz6NMhDB51cCvNWa1GMS7LU1pAxdF4Ld6Ft9kZEP2a';
  const hashExample2 = 'QmYA2fn8cMbVWo4v95RwcwJVyQsNtnEwHerfWR8UNtEwoE';
  const hashExample3 = 'QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4';
  let requestHashStorage;

  beforeEach(async () => {
    requestHashStorage = await RequestHashStorage.new(burner, {
      from: admin,
    });
    await requestHashStorage.setFeeParameters(100, 1, 1, { from: admin });
    await requestHashStorage.setMinimumFeeThreshold(100, { from: admin });
    await requestHashStorage.setRequestBurnerContract(burner, {
      from: admin,
    });
  });

  it('Allows fees values to be changed by the owner', async function() {
    let { logs } = await requestHashStorage.setFeeParameters(100, 2, 1, {
      from: admin,
    });
    expectEvent.inLogs(logs, 'UpdatedFeeParameters', {
      minimumFee: 100,
      rateFeesNumerator: 2,
      rateFeesDenominator: 1,
    });

    ({ logs } = await requestHashStorage.setMinimumFeeThreshold(100, {
      from: admin,
    }));
    expectEvent.inLogs(logs, 'UpdatedMinimumFeeThreshold', {
      threshold: 100,
    });

    ({ logs } = await requestHashStorage.setRequestBurnerContract(yetotherguy, {
      from: admin,
    }));
    expectEvent.inLogs(logs, 'UpdatedBurnerContract', {
      burnerAddress: yetotherguy,
    });
  });

  it('Non admin should not be able to change fees management values', async function() {
    await shouldFail.reverting(requestHashStorage.setFeeParameters(100, 2, 1, { from: otherguy }));
    await shouldFail.reverting(requestHashStorage.setMinimumFeeThreshold(100, { from: otherguy }));
    await shouldFail.reverting(
      requestHashStorage.setRequestBurnerContract(yetotherguy, {
        from: otherguy,
      }),
    );
  });

  it('getFeesAmount gives correct values', async function() {
    // Minimum fee is 100 and minimum fee threshold is 100 therefore we except 100
    let estimation = await requestHashStorage.getFeesAmount(10);
    assert.equal(estimation, 100);

    // Rate above minimum threshold are 1/1 therefore we except 150
    estimation = await requestHashStorage.getFeesAmount(150);
    assert.equal(estimation, 150);

    // 200 => 200 + 100*2 = 400
    await requestHashStorage.setFeeParameters(200, 2, 1, { from: admin });
    estimation = await requestHashStorage.getFeesAmount(200);
    assert.equal(estimation, 400);

    // 400 => 200 + 300/2 = 350
    await requestHashStorage.setFeeParameters(200, 1, 2, { from: admin });
    estimation = await requestHashStorage.getFeesAmount(400);
    assert.equal(estimation, 350);

    await requestHashStorage.setMinimumFeeThreshold(1000, { from: admin });
    estimation = await requestHashStorage.getFeesAmount(800);
    assert.equal(estimation, 200);
  });

  it('Hashes with size below threshold costs minimum fee', async function() {
    let { logs } = await requestHashStorage.submitHash(hashExample, 10, { value: 100 });
    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample,
      size: 10,
    });

    ({ logs } = await requestHashStorage.submitHash(hashExample2, 100, { value: 100 }));
    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample2,
      size: 100,
    });

    await requestHashStorage.setMinimumFeeThreshold(500, {
      from: admin,
    });
    ({ logs } = await requestHashStorage.submitHash(hashExample3, 500, { value: 100 }));
    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample3,
      size: 500,
    });

    await requestHashStorage.setFeeParameters(300, 1, 1, {
      from: admin,
    });
    ({ logs } = await requestHashStorage.submitHash(hashExample3, 500, { value: 300 }));
    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample3,
      size: 500,
    });
  });

  it('Hashes with size above threshold include variable fees', async function() {
    let { logs } = await requestHashStorage.submitHash(hashExample, 150, { value: 150 });
    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample,
      size: 150,
    });

    // 200 => 100 + 100*2 = 300
    await requestHashStorage.setFeeParameters(100, 2, 1, { from: admin });
    ({ logs } = await requestHashStorage.submitHash(hashExample2, 200, { value: 300 }));
    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample2,
      size: 200,
    });

    // 400 => 100 + 300/2 = 250
    await requestHashStorage.setFeeParameters(100, 1, 2, { from: admin });
    ({ logs } = await requestHashStorage.submitHash(hashExample3, 400, { value: 250 }));
    expectEvent.inLogs(logs, 'NewHash', {
      hash: hashExample3,
      size: 400,
    });
  });

  it('Burner contract receives funds', async function() {
    let oldBurnerBalance = web3.eth.getBalance(burner);
    let fee = await requestHashStorage.getFeesAmount(arbitraryAmount);
    await requestHashStorage.submitHash(hashExample, arbitraryAmount, {
      value: fee,
    });
    let newBurnerBalance = web3.eth.getBalance(burner);
    assert(newBurnerBalance.eq(oldBurnerBalance.add(fee)), 'Fee not collected by burner');

    // Test with another address for burner
    await requestHashStorage.setRequestBurnerContract(yetotherguy, {
      from: admin,
    });
    oldBurnerBalance = web3.eth.getBalance(yetotherguy);
    fee = await requestHashStorage.getFeesAmount(arbitraryAmount);
    await requestHashStorage.submitHash(hashExample, arbitraryAmount, {
      value: fee,
    });
    newBurnerBalance = web3.eth.getBalance(yetotherguy);
    assert(
      newBurnerBalance.eq(oldBurnerBalance.plus(fee)),
      'Fee not collected by burner after changing burner address',
    );
  });
});
