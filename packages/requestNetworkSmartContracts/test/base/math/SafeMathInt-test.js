// Inspired from https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/math/SafeMath.test.js

var config = require("../../config.js"); var utils = require("../../utils.js");
if(!config['all'] && !config[__filename.split('\\').slice(-1)[0]]) {
  return;
}

const BigNumber = require("bignumber.js");
const SafeMathIntMock = artifacts.require('./test/SafeMathIntMock.sol');

const MIN_INT256 = new BigNumber(2).pow(255).times(-1);

contract('SafeMathInt', function (accounts) {
  let safeMath;

  before(async function () {
    safeMath = await SafeMathIntMock.new();
  });

  it('multiplies correctly', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.multiply(a, b);
    let result = await safeMath.result();
    assert.equal(result, a * b);
  });

  it('adds correctly', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.add(a, b);
    let result = await safeMath.result();

    assert.equal(result, a + b);
  });

  it('subtracts correctly', async function () {
    let a = 5678;
    let b = 1234;
    await safeMath.subtract(a, b);
    let result = await safeMath.result();

    assert.equal(result, a - b);
  });

  it('should throw an error if subtraction result would be negative', async function () {
    let a = 1234;
    let b = 5678;
    try {
      await safeMath.subtract(a, b);
      assert.fail('should have thrown before');
    } catch (error) {
      utils.expectThrow(error);
    }
  });

  it('should throw an error on addition overflow', async function () {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
    let b = 1;
    await utils.expectThrow(safeMath.add(a, b));
  });

  it('should throw an error on multiplication overflow', async function () {
    let a = 115792089237316195423570985008687907853269984665640564039457584007913129639933;
    let b = 2;
    await utils.expectThrow(safeMath.multiply(a, b));
  });

  it('should throw an error on division MAX_INT256/-1', async function () {
    let a = MIN_INT256;
    let b = -1;
    await utils.expectThrow(safeMath.divide(a, b));
  });

  it('should throw an error on multiplication MAX_INT256 * -1', async function () {
    let a = MIN_INT256;
    let b = -1;
    await utils.expectThrow(safeMath.multiply(a, b));
  });

  it('should throw an error on multiplication -1 * MAX_INT256', async function () {
    let a = -1;
    let b = MIN_INT256;
    await utils.expectThrow(safeMath.multiply(a, b));
  });
});