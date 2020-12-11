import { RequestLogicTypes, RequestLogicTypes as Types } from '@requestnetwork/types';
import Currency from '../src/currency';

const ethDefault: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.ETH, value:'eth'};
const ethMainnet: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.ETH, value:'eth', network:'mainnet'};
const ethRinkeby: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.ETH, value:'eth', network:'rinkeby'};

const btcDefault: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.BTC, value:'btc'};
const btcMainnet: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.BTC, value:'btc', network:'mainnet'};
const btcRinkeby: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.BTC, value:'btc', network:'testnet'};

const USD: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.ISO4217, value: 'USD' };
const EUR: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.ISO4217, value: 'EUR' };

const DAI: Types.ICurrency = {type: RequestLogicTypes.CURRENCY.ERC20, value:'0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35'};

/* tslint:disable:no-unused-expression */
describe('Currency', () => {
  describe('ETH currency hash', () => {
    it('can get currency hash of eth', () => {
      const ethAddressHash = '0xf5af88e117747e87fc5929f2ff87221b1447652e';

      expect(Currency.getCurrencyHash(ethDefault)).toBe(ethAddressHash);
      expect(Currency.getCurrencyHash(ethMainnet)).toBe(ethAddressHash);
      expect(Currency.getCurrencyHash(ethRinkeby)).toBe(ethAddressHash);
    });
  });

  describe('BTC currency hash', () => {
    it('can get currency hash of BTC', () => {
      const btcAddressHash = '0x03049758a18d1589388d7a74fb71c3fcce11d286';

      expect(Currency.getCurrencyHash(btcDefault)).toBe(btcAddressHash);
      expect(Currency.getCurrencyHash(btcMainnet)).toBe(btcAddressHash);
      expect(Currency.getCurrencyHash(btcRinkeby)).toBe(btcAddressHash);
    });
  });

  describe('FIAT currency hash', () => {
    it('can get currency hash of USD', () => {
      expect(Currency.getCurrencyHash(USD)).toBe('0x775eb53d00dd0acd3ec1696472105d579b9b386b');
    });
    it('can get currency hash of EUR', () => {
      expect(Currency.getCurrencyHash(EUR)).toBe('0x17b4158805772ced11225e77339f90beb5aae968');
    });
  });

  describe('ERC20 currency hash', () => {
    it('can get currency hash of ERC20', () => {
      expect(Currency.getCurrencyHash(DAI)).toBe('0x38cF23C52Bb4B13F051Aec09580a2dE845a7FA35');
    });
  });
});
