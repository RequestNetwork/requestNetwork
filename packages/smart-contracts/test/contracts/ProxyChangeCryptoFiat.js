const ethers = require('ethers');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TestERC20 = artifacts.require('./TestERC20.sol');
const ProxyChangeCryptoFiat = artifacts.require('./ProxyChangeCryptoFiat.sol');

contract.only('ProxyChangeCryptoFiat', function (accounts) {
  const from = accounts[0];
  const to = accounts[1];
  const otherGuy = accounts[2];
  const amountInUSD = '5678000000'; // 56,78 with 8 decimal
  const smallAmountInUSD = '100000000'; // 1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const FiatEnum = { USD: 0, AUD: 1, CHF: 2, EUR: 3, GBP: 4, JPY: 5 };
  const CryptoEnum = { ETH: 0, DAI: 1, USDT: 2, USDC: 3, SUSD: 4 };

  let testProxyChangeCryptoFiat;
  let testERC20;

  beforeEach(async () => {
    testProxyChangeCryptoFiat = await ProxyChangeCryptoFiat.new({
      from,
    });
    testERC20 = await TestERC20.at('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');
  });

  describe('computeConversion', () => {
    it('can compute conversion from USD to DAI', async function () {
      const conversion = await testProxyChangeCryptoFiat.computeConversion(
        amountInUSD,
        FiatEnum.USD,
        CryptoEnum.DAI,
      );
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('56184444884227191767');
    });

    it('can compute conversion from USD to USDT', async function () {
      const conversion = await testProxyChangeCryptoFiat.computeConversion(
        amountInUSD,
        FiatEnum.USD,
        CryptoEnum.USDT,
      );
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('56488011586837114437');
    });

    it('can compute conversion from EUR to DAI', async function () {
      const conversion = await testProxyChangeCryptoFiat.computeConversion(
        amountInUSD,
        FiatEnum.EUR,
        CryptoEnum.DAI,
      );
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('66149542766673263407');
    });

    it('can compute conversion from EUR to USDT', async function () {
      const conversion = await testProxyChangeCryptoFiat.computeConversion(
        amountInUSD,
        FiatEnum.EUR,
        CryptoEnum.USDT,
      );
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('66506951273924892762');
    });
  });

  describe('transferWithReference', () => {
    it('allows to transfer DAI tokens for USD payment', async function () {
      await testERC20.approve(testProxyChangeCryptoFiat.address, hundredWith18Decimal, { from });

      console.log('testERC20.getBalance');
      console.log((await testERC20.balanceOf(from)).toString(10));

      const conversion = await testProxyChangeCryptoFiat.computeConversion(
        smallAmountInUSD,
        FiatEnum.USD,
        CryptoEnum.DAI,
      );
      console.log(conversion.toString(10));

      let { logs } = await testProxyChangeCryptoFiat.transferWithReference(
        to,
        smallAmountInUSD,
        FiatEnum.USD,
        CryptoEnum.DAI,
        referenceExample,
        hundredWith18Decimal,
        { from },
      );

      console.log('-------- logs ---------------------');
      console.log(logs);
      console.log(JSON.stringify(logs));

      // transferReference indexes the event log, therefore the keccak256 is stored
      // expectEvent.inLogs(logs, 'TransferWithReference', {
      //   tokenAddress: testERC20.address,
      //   to,
      //   amount: '100',
      //   paymentReference: ethers.utils.keccak256(referenceExample),
      // });
    });
  });
});
