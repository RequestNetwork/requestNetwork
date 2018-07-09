const BytesUtilsMock = artifacts.require('./test/BytesUtilsMock.sol');

// Does the same job as web3.utils.asciiToHex() 
const asciiToHex = ascii => '0x' + ascii.split('').map(letter => letter.charCodeAt().toString(16)).join('');

contract('Bytes Utils', function (accounts) {
  let bytesUtils;

  before(async function () {
    bytesUtils = await BytesUtilsMock.new();
  });

  it('extractAddress works correctly', async function () {
    const rawHexAddress = 'abc0000000000000000000000000000000000def';
    const expectedAddress = `0x${rawHexAddress}`;

    await bytesUtils.extractAddress(`0x${rawHexAddress}`, 0);
    let result = await bytesUtils.extractAddressResult();
    assert.equal(result, expectedAddress);

    await bytesUtils.extractAddress(`0x9999${rawHexAddress}BBBB`, 2);
    result = await bytesUtils.extractAddressResult();
    assert.equal(result, expectedAddress);
  });

  it('extractBytes32 works correctly', async function () {
    const rawHexBytes32 = 'abc0000000000000000000000000000000000000000000000000000000000def';
    const expectedBytes32 = `0x${rawHexBytes32}`;

    await bytesUtils.extractBytes32(`0x${rawHexBytes32}`, 0);
    let result = await bytesUtils.extractBytes32Result();
    assert.equal(result, expectedBytes32);

    await bytesUtils.extractBytes32(`0x9999${rawHexBytes32}BBBB`, 2);
    result = await bytesUtils.extractBytes32Result();
    assert.equal(result, expectedBytes32);
  });

  it('updateBytes20inBytesResult works correctly', async function () {
    const inputBytes = '0xabcdef0123456789000000000000000000000000000000000000000000000def';
    const inputBytes20 = '0x123aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa123';
    const expectedBytes = '0xabcdef123aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa123000000000000000def';

    await bytesUtils.updateBytes20inBytes(inputBytes, 3, inputBytes20);
    let result = await bytesUtils.updateBytes20inBytesResult();
    assert.equal(result, expectedBytes);
  });
  
  it('extractString works correctly', async function () {
    const expectedString = 'request4president';
    const hexString = asciiToHex(expectedString);    
    const rubishBytes = '3d6a7c';
    
    await bytesUtils.extractString(hexString + rubishBytes, expectedString.length, 0);
    let result = await bytesUtils.extractStringResult();
    assert.equal(result, expectedString);
  });
});
