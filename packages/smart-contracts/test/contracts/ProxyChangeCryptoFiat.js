const ethers = require('ethers');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const ProxyChangeCryptoFiat = artifacts.require('./ProxyChangeCryptoFiat.sol');

contract('ProxyChangeCryptoFiat', function (accounts) {
  const admin = accounts[0];
  const amountInUSD = 5678000000; // 56,78 with 8 decimal

  const FiatEnum = { USD: 0, AUD: 1, CHF: 2, EUR: 3, GBP: 4, JPY: 5 };
  const CryptoEnum = { ETH: 0, DAI: 1, USDT: 2, USDC: 3, SUSD: 4 };

  let testProxyChangeCryptoFiat;

  beforeEach(async () => {
    testProxyChangeCryptoFiat = await ProxyChangeCryptoFiat.new({
      from: admin,
    });
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
});
