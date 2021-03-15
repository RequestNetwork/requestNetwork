const Currency = require('@requestnetwork/currency').default;

const ChainlinkConversionPath = artifacts.require("ChainlinkConversionPath");

const USDT_fake = artifacts.require("UsdtFake");

const address1 = "0x1111111111111111111111111111111111111111";
const address2 = "0x2222222222222222222222222222222222222222";
const address3 = "0x3333333333333333333333333333333333333333";
const address4 = "0x4444444444444444444444444444444444444444";
const address5 = "0x5555555555555555555555555555555555555555";
const address6 = "0x6666666666666666666666666666666666666666";

const ETH_address = Currency.getCurrencyHash({ type: 'ETH', value: 'ETH' });
const USD_address = Currency.getCurrencyHash({ type: 'ISO4217', value: 'USD' });
const EUR_address = Currency.getCurrencyHash({ type: 'ISO4217', value: 'EUR' });
const DAI_address = Currency.getCurrencyHash({ type: 'ERC20', value: '0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35' });
let USDT_address;

let conversionPathInstance;
let USDT_Instance;

contract('ChainlinkConversionPath', (accounts) => {
  describe('updateAggregator', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.new();
    });

    it('can updateAggregator', async () => {
      let addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator, '0x0000000000000000000000000000000000000000', "addressAggregator must be 0x");

      await conversionPathInstance.updateAggregator(address1, address2, address3);

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator, address3, "addressAggregator must be 0x333..");
    });
  });

  describe('updateAggregatorsList', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.new();
    });

    it('can updateAggregatorsList', async () => {
      let addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator, '0x0000000000000000000000000000000000000000', "addressAggregator must be 0x");

      addressAggregator = await conversionPathInstance.allAggregators(address4, address5)
      assert.equal(addressAggregator, '0x0000000000000000000000000000000000000000', "addressAggregator must be 0x");

      await conversionPathInstance.updateAggregatorsList([address1, address4],
        [address2, address5],
        [address3, address6]);

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2)
      assert.equal(addressAggregator, address3, "addressAggregator must be 0x333..");
      addressAggregator = await conversionPathInstance.allAggregators(address4, address5)
      assert.equal(addressAggregator, address6, "addressAggregator must be 0x666..");
    });
  });

  describe('getRate', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.deployed();
      USDT_Instance = await USDT_fake.deployed();
      USDT_address = USDT_Instance.address;
    });

    describe('only fiat rates', async () => {
      it('can get rate from EUR to USD', async () => {
        const conversion = await conversionPathInstance.getRate.call([EUR_address, USD_address]);
        assert.equal(conversion.rate.toString(10), '1200000000000000000');
      });

      it('can get rate from USD to EUR', async () => {
        const conversion = await conversionPathInstance.getRate.call([USD_address, EUR_address]);
        assert.equal(conversion.rate.toString(10), '833333333333333333');
      });

      it('can get rate from USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getRate.call([USD_address, EUR_address, USD_address]);
        assert.equal(conversion.rate.toString(10), '999999999999999999');
      });

      it('can get rate from ETH to USD to EUR', async () => {
        conversion = await conversionPathInstance.getRate.call([ETH_address, USD_address, EUR_address]);
        assert.equal(conversion.rate.toString(10), '41666666666');
      });
    });

    describe('Ethereum rates', async () => {
      it('can get rate from USD to ETH', async () => {
        conversion = await conversionPathInstance.getRate.call([USD_address, ETH_address]);
        assert.equal(conversion.rate.toString(10), '20000000000000000000000000');
      });

      it('can get rate from ETH to USD', async () => {
        conversion = await conversionPathInstance.getRate.call([ETH_address, USD_address]);
        assert.equal(conversion.rate.toString(10), '50000000000');
      });

      it('can get rate from EUR to USD to ETH', async () => {
        conversion = await conversionPathInstance.getRate.call([EUR_address, USD_address, ETH_address]);
        assert.equal(conversion.rate.toString(10), '24000000000000000000000000');
      });

      it('can get rate from USD to ERC20', async () => {
        const conversion = await conversionPathInstance.getRate.call([USD_address, DAI_address]);
        assert.equal(conversion.rate.toString(10), '9900990099009900990099009900');
      });

      it('can get rate from ETH to USD to ERC20', async () => {
        conversion = await conversionPathInstance.getRate.call([ETH_address, USD_address, DAI_address]);
        assert.equal(conversion.rate.toString(10), '495049504950495049504');
      });
    });

    describe('USD rates', async () => {
      it('can get rate from USD to ETH to USDT', async () => {
        const conversion = await conversionPathInstance.getRate.call([USD_address, ETH_address, USDT_address]);
        assert.equal(conversion.rate.toString(10), '10000000000000000');
      });

      it('can get rate from USDT to ETH to USD', async () => {
        const conversion = await conversionPathInstance.getRate.call([USDT_address, ETH_address, USD_address]);
        assert.equal(conversion.rate.toString(10), '100000000000000000000');
      });
    });
  });

  describe('getConversion', async () => {
    beforeEach(async () => {
      conversionPathInstance = await ChainlinkConversionPath.deployed();
      USDT_Instance = await USDT_fake.deployed();
      USDT_address = USDT_Instance.address;
    });

    describe('only fiat conversion', async () => {
      it('can convert EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversion.call("10000000000", [EUR_address, USD_address]);
        assert.equal(conversion.result.toString(10), '12000000000');
      });

      it('can convert USD to EUR', async () => {
        const conversion = await conversionPathInstance.getConversion.call("10000000000", [USD_address, EUR_address]);
        assert.equal(conversion.result.toString(10), '8333333333');
      });

      it('can convert USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversion.call("10000000000", [USD_address, EUR_address, USD_address]);
        assert.equal(conversion.result.toString(10), '9999999999');
      });
    });

    describe('Ethereum conversion', async () => {
      it('can convert USD to ETH', async () => {
        conversion = await conversionPathInstance.getConversion.call("100000000000", [USD_address, ETH_address]);
        assert.equal(conversion.result.toString(10), '2000000000000000000');
      });

      it('can convert ETH to USD', async () => {
        conversion = await conversionPathInstance.getConversion.call("2000000000000000000", [ETH_address, USD_address]);
        assert.equal(conversion.result.toString(10), '100000000000');
      });

      it('can convert EUR to USD to ETH', async () => {
        conversion = await conversionPathInstance.getConversion.call("100000000000", [EUR_address, USD_address, ETH_address]);
        assert.equal(conversion.result.toString(10), '2400000000000000000');
      });

      it('can convert ETH to USD to EUR', async () => {
        conversion = await conversionPathInstance.getConversion.call("2000000000000000000", [ETH_address, USD_address, EUR_address]);
        assert.equal(conversion.result.toString(10), '83333333332');
      });
    });

    describe('USDT conversion', async () => {
      it('can convert USD to ETH to USDT', async () => {
        const conversion = await conversionPathInstance.getConversion.call("10000000000", [USD_address, ETH_address, USDT_address]);
        assert.equal(conversion.result.toString(10), '100000000');
      });

      it('can convert USDT to ETH to USD', async () => {
        const conversion = await conversionPathInstance.getConversion.call("100000000", [USDT_address, ETH_address, USD_address]);
        assert.equal(conversion.result.toString(10), '10000000000');
      });
    });
  });
});
