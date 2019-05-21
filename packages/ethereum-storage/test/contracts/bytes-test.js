const BytesUtilsMock = artifacts.require('./test/BytesUtilsMock.sol');

contract('Bytes Utils', function(accounts) {
  let bytesUtils;

  before(async function() {
    bytesUtils = await BytesUtilsMock.new();
  });

  it('extractBytes32 works correctly', async function() {
    const rawHexBytes32 = 'abc0000000000000000000000000000000000000000000000000000000000def';
    const expectedBytes32 = `0x${rawHexBytes32}`;

    await bytesUtils.extractBytes32(`0x${rawHexBytes32}`, 0);
    let result = await bytesUtils.extractBytes32Result();
    assert.equal(result, expectedBytes32);

    await bytesUtils.extractBytes32(`0x9999${rawHexBytes32}BBBB`, 2);
    result = await bytesUtils.extractBytes32Result();
    assert.equal(result, expectedBytes32);
  });
});
