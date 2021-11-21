import { RequestLogicTypes } from '@requestnetwork/types';
import { currenciesWithConversionOracles } from '../../../src/extensions/payment-network/conversion-supported-currencies';

describe('supported currencies with oracles from chainlink', () => {
  it('should contain mainnet currencies', () => {
    expect(currenciesWithConversionOracles['mainnet'][RequestLogicTypes.CURRENCY.ISO4217])
      .toEqual(expect.arrayContaining(['AUD', 'CAD', 'CHF', 'EUR', 'GBP', 'SGD', 'USD']));
    expect(currenciesWithConversionOracles['mainnet'][RequestLogicTypes.CURRENCY.ERC20])
      .toEqual(expect.arrayContaining(
        [
          '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
          '0x3845badade8e6dff049820680d1f14bd3903a5d0',
          '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
          '0x6b175474e89094c44da98b954eedeac495271d0f',
          '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
          '0x8290333cef9e6d528dd5618fb97a76f268f3edd4',
          '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7',
          '0x967da4048cd07ab37855c090aaf366e4ce1b9f48',
          '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
          '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          '0xa117000000f279d81a1d3cc75430faa017fa5a2e',
          '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
          '0xdac17f958d2ee523a2206206994597c13d831ec7',
        ],
      ));
    expect(currenciesWithConversionOracles['mainnet'][RequestLogicTypes.CURRENCY.ETH])
      .toEqual(expect.arrayContaining(['ETH']));
    expect(currenciesWithConversionOracles['mainnet'][RequestLogicTypes.CURRENCY.BTC])
      .toEqual([]);
  });

  it('should contain matic currencies', () => {
    expect(currenciesWithConversionOracles['matic'][RequestLogicTypes.CURRENCY.ISO4217]).toEqual(expect.arrayContaining(['AUD', 'CAD', 'CHF', 'EUR', 'GBP', 'SGD', 'USD']));
    expect(currenciesWithConversionOracles['matic'][RequestLogicTypes.CURRENCY.ERC20])
      .toEqual(expect.arrayContaining(
        [
          '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
          '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
          '0x831753dd7087cac61ab5644b308642cc1c33dc13',
        ],
      ));
    expect(currenciesWithConversionOracles['matic'][RequestLogicTypes.CURRENCY.ETH])
      .toEqual(expect.arrayContaining(['ETH']));
    expect(currenciesWithConversionOracles['matic'][RequestLogicTypes.CURRENCY.BTC])
      .toEqual([]);
  });

  it('should contain private network currencies', () => {
    expect(currenciesWithConversionOracles['private'][RequestLogicTypes.CURRENCY.ISO4217])
      .toEqual(expect.arrayContaining(['USD', 'EUR']));
    expect(currenciesWithConversionOracles['private'][RequestLogicTypes.CURRENCY.ERC20])
      .toEqual(expect.arrayContaining(['0x38cf23c52bb4b13f051aec09580a2de845a7fa35']));
    expect(currenciesWithConversionOracles['private'][RequestLogicTypes.CURRENCY.ETH])
      .toEqual(expect.arrayContaining(['ETH']));
    expect(currenciesWithConversionOracles['private'][RequestLogicTypes.CURRENCY.BTC])
      .toEqual([]);
  });

  it('should contain fantom network currencies', () => {
    expect(currenciesWithConversionOracles['fantom'][RequestLogicTypes.CURRENCY.ISO4217])
      .toEqual(expect.arrayContaining(['USD', 'CHF']));
    expect(currenciesWithConversionOracles['fantom'][RequestLogicTypes.CURRENCY.ERC20])
      .toEqual(expect.arrayContaining([
        '0x10bf4137b0558c33c2dc9f71c3bb81c2865fa2fb',
        '0x6a07a792ab2965c72a5b8088d3a069a7ac3a993b',
        '0xe1146b9ac456fcbb60644c36fd3f868a9072fc6e',
        '0x657a1861c15a3ded9af0b6799a195a249ebdcbc6',
        '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e',
        '0x658b0c7613e890ee50b8c4bc6a3f41ef411208ad',
        '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8',
        '0x56ee926bd8c72b2d5fa1af4d9e4cbb515a1e3adc',
        '0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc',
        '0x940f41f0ec9ba1a34cf001cc03347ac092f5f6b5',
        '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
      ]));
    expect(currenciesWithConversionOracles['fantom'][RequestLogicTypes.CURRENCY.ETH])
      .toEqual(expect.arrayContaining([]));
    expect(currenciesWithConversionOracles['fantom'][RequestLogicTypes.CURRENCY.BTC])
      .toEqual([]);
  });
});
