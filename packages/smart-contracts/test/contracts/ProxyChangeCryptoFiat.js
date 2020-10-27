const ethers = require('ethers');

const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { bigNumberify } = require('ethers/utils');

const TestERC20 = artifacts.require('./TestERC20.sol');
const ERC20FeeProxy = artifacts.require('./ERC20FeeProxy.sol');
const ProxyChangeCryptoFiat = artifacts.require('./ProxyChangeCryptoFiat.sol');

contract('ProxyChangeCryptoFiat', function (accounts) {
  const from = accounts[0];
  const to = accounts[1];
  const feeAddress = accounts[2];
  const amountInUSD = '5678000000'; // 56.78 with 8 decimal
  const smallAmountInFIAT = '100000000'; // 1 with 8 decimal
  const smallerAmountInFIAT = '10000000'; // 0.1 with 8 decimal
  const thousandWith18Decimal = '1000000000000000000000';
  const hundredWith18Decimal = '100000000000000000000';
  const referenceExample = '0xaaaa';

  const FiatEnum = { USD: 0, AUD: 1, CHF: 2, EUR: 3, GBP: 4, JPY: 5 };
  const CryptoEnum = { ETH: 0, DAI: 1, USDT: 2, USDC: 3, SUSD: 4 };

  let testProxyChangeCryptoFiat;
  let testERC20;
  let erc20FeeProxy;

  async function testTransferWithReference(fiatCurrency, cryptoCurrency) {
    await testERC20.approve(testProxyChangeCryptoFiat.address, hundredWith18Decimal, { from });
  
    const fromOldBalance = await testERC20.balanceOf(from);
    const toOldBalance = await testERC20.balanceOf(to);
    const feeOldBalance = await testERC20.balanceOf(feeAddress);
  
    const conversionToPay = await testProxyChangeCryptoFiat.computeConversion(
      smallAmountInFIAT,
      fiatCurrency,
      cryptoCurrency
    );
  
    const conversionFees = await testProxyChangeCryptoFiat.computeConversion(
      smallerAmountInFIAT,
      fiatCurrency,
      cryptoCurrency
    );
  
    const { logs } = await testProxyChangeCryptoFiat.transferFromWithReferenceAndFee(
      to,
      smallAmountInFIAT,
      fiatCurrency,
      cryptoCurrency,
      referenceExample,
      smallerAmountInFIAT,
      feeAddress,
      hundredWith18Decimal,
      { from },
    );
  
    expectEvent.inLogs(logs, 'TransferWithReferenceAndFeeFromFiat', {
      tokenAddress: testERC20.address,
      to,
      amountFiat: smallAmountInFIAT,
      paymentReference: ethers.utils.keccak256(referenceExample),
      feesAmountFiat: smallerAmountInFIAT,
      feeAddress    
    });
  
    const fromNewBalance = await testERC20.balanceOf(from);
    const toNewBalance = await testERC20.balanceOf(to);
    const feeNewBalance = await testERC20.balanceOf(feeAddress);
  
    const fromDiffBalance = bigNumberify(fromNewBalance.toString()).sub(fromOldBalance.toString()).toString();
    const toDiffBalance = bigNumberify(toNewBalance.toString()).sub(toOldBalance.toString()).toString();
    const feeDiffBalance = bigNumberify(feeNewBalance.toString()).sub(feeOldBalance.toString()).toString();
  
    // Check balance changes
    expect(fromDiffBalance.toString()).to.equals('-' + bigNumberify(conversionToPay.toString()).add(conversionFees.toString()));
    expect(toDiffBalance).to.equals(conversionToPay.toString());
    expect(feeDiffBalance).to.equals(conversionFees.toString());
  }

  beforeEach(async () => {
    testERC20 = await TestERC20.at('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');

    erc20FeeProxy = await ERC20FeeProxy.new({
      from,
    });

    testProxyChangeCryptoFiat = await ProxyChangeCryptoFiat.new(erc20FeeProxy.address, {
      from,
    });
  });

  describe('computeConversion', () => {
    it('can compute conversion from USD to DAI', async function () {
      const conversion = await testProxyChangeCryptoFiat.computeConversion(
        amountInUSD,
        FiatEnum.USD,
        CryptoEnum.DAI,
      );
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('56184444879892000000');
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
      expect(conversion, 'conversion wrong').to.be.a.bignumber.that.equals('66149542762828000000');
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

  describe('transferFromWithReferenceAndFee', () => {
    describe('transferFromWithReferenceAndFee with USD', () => {
      it('allows to transfer DAI tokens for USD payment', async function () {
        await testTransferWithReference(FiatEnum.USD, CryptoEnum.DAI);
      });

      it('allows to transfer USDT tokens for USD payment', async function () {
        await testTransferWithReference(FiatEnum.USD, CryptoEnum.USDT);
      });
    });

    describe('transferFromWithReferenceAndFee with EUR', () => {
      it('allows to transfer DAI tokens for EUR payment', async function () {
        await testTransferWithReference(FiatEnum.EUR, CryptoEnum.DAI);
      });

      it('allows to transfer USDT tokens for EUR payment', async function () {
        await testTransferWithReference(FiatEnum.EUR, CryptoEnum.USDT);
      });
    });
  });
});
