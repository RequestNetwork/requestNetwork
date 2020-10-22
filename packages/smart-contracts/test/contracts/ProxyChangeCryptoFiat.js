const ethers = require('ethers');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TestERC20 = artifacts.require('./TestERC20.sol');
const ProxyChangeCryptoFiat = artifacts.require('./ProxyChangeCryptoFiat.sol');

contract('ProxyChangeCryptoFiat', function (accounts) {
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
    testERC20 = await TestERC20.at('0x9FBDa871d559710256a2502A2517b794B482Db40');
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
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('56488011');
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
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('66506951');
    });
  });

  describe('transferWithReference', () => {
    describe('transferWithReference with USD', () => {
      it('allows to transfer DAI tokens for USD payment', async function () {
        await testERC20.approve(testProxyChangeCryptoFiat.address, hundredWith18Decimal, { from });

        const conversion = await testProxyChangeCryptoFiat.computeConversion(
          smallAmountInUSD,
          FiatEnum.USD,
          CryptoEnum.DAI,
        );

        let { logs } = await testProxyChangeCryptoFiat.transferWithReference(
          to,
          smallAmountInUSD,
          FiatEnum.USD,
          CryptoEnum.DAI,
          referenceExample,
          hundredWith18Decimal,
          { from },
        );

        expectEvent.inLogs(logs, 'TransferWithReference', {
          tokenAddress: testERC20.address,
          to,
          amount: smallAmountInUSD,
          paymentReference: ethers.utils.keccak256(referenceExample),
          amountinCrypto: conversion
        });
      });

      it('allows to transfer USDT tokens for USD payment', async function () {
        await testERC20.approve(testProxyChangeCryptoFiat.address, hundredWith18Decimal, { from });

        const conversion = await testProxyChangeCryptoFiat.computeConversion(
          smallAmountInUSD,
          FiatEnum.USD,
          CryptoEnum.USDT,
        );

        let { logs } = await testProxyChangeCryptoFiat.transferWithReference(
          to,
          smallAmountInUSD,
          FiatEnum.USD,
          CryptoEnum.USDT,
          referenceExample,
          hundredWith18Decimal,
          { from },
        );

        expectEvent.inLogs(logs, 'TransferWithReference', {
          tokenAddress: testERC20.address,
          to,
          amount: smallAmountInUSD,
          paymentReference: ethers.utils.keccak256(referenceExample),
          amountinCrypto: conversion
        });
    });
    });
    describe('transferWithReference with EUR', () => {
      it('allows to transfer DAI tokens for EUR payment', async function () {
        await testERC20.approve(testProxyChangeCryptoFiat.address, hundredWith18Decimal, { from });

        const conversion = await testProxyChangeCryptoFiat.computeConversion(
          smallAmountInUSD,
          FiatEnum.EUR,
          CryptoEnum.DAI,
        );

        let { logs } = await testProxyChangeCryptoFiat.transferWithReference(
          to,
          smallAmountInUSD,
          FiatEnum.EUR,
          CryptoEnum.DAI,
          referenceExample,
          hundredWith18Decimal,
          { from },
        );

        expectEvent.inLogs(logs, 'TransferWithReference', {
          tokenAddress: testERC20.address,
          to,
          amount: smallAmountInUSD,
          paymentReference: ethers.utils.keccak256(referenceExample),
          amountinCrypto: conversion
        });
      });

      it('allows to transfer USDT tokens for EUR payment', async function () {
        await testERC20.approve(testProxyChangeCryptoFiat.address, hundredWith18Decimal, { from });

        const conversion = await testProxyChangeCryptoFiat.computeConversion(
          smallAmountInUSD,
          FiatEnum.EUR,
          CryptoEnum.USDT,
        );

        let { logs } = await testProxyChangeCryptoFiat.transferWithReference(
          to,
          smallAmountInUSD,
          FiatEnum.EUR,
          CryptoEnum.USDT,
          referenceExample,
          hundredWith18Decimal,
          { from },
        );

        expectEvent.inLogs(logs, 'TransferWithReference', {
          tokenAddress: testERC20.address,
          to,
          amount: smallAmountInUSD,
          paymentReference: ethers.utils.keccak256(referenceExample),
          amountinCrypto: conversion
        });
      });
    });
  });


});
