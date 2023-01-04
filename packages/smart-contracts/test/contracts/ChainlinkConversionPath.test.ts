import { expect } from 'chai';
import { CurrencyManager } from '@requestnetwork/currency';
import { ethers, network } from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import { chainlinkConversionPath as chainlinkConvArtifact } from '../../src/lib';
import { ChainlinkConversionPath } from '../../src/types';
import { localERC20AlphaArtifact, localUSDTArtifact } from './localArtifacts';

const address0 = '0x0000000000000000000000000000000000000000';
const address1 = '0x1111111111111111111111111111111111111111';
const address2 = '0x2222222222222222222222222222222222222222';
const address3 = '0x3333333333333333333333333333333333333333';
const address4 = '0x4444444444444444444444444444444444444444';
const address5 = '0x5555555555555555555555555555555555555555';
const address6 = '0x6666666666666666666666666666666666666666';

const currencyManager = CurrencyManager.getDefault();
const ETH_hash = currencyManager.fromSymbol('ETH')!.hash;
const USD_hash = currencyManager.fromSymbol('USD')!.hash;
const EUR_hash = currencyManager.fromSymbol('EUR')!.hash;
let DAI_address: string;
let USDT_address: string;
let conversionPathInstance: ChainlinkConversionPath;

describe('contract: ChainlinkConversionPath', () => {
  before(async () => {
    const [signer] = await ethers.getSigners();
    conversionPathInstance = chainlinkConvArtifact.connect(network.name, signer);
    USDT_address = localUSDTArtifact.getAddress(network.name);
    DAI_address = localERC20AlphaArtifact.getAddress(network.name);
  });

  describe('admin tasks', async () => {
    // Reset all aggregators to 0x000...
    before(async () => {
      await conversionPathInstance.updateAggregatorsList(
        [address1, address4],
        [address2, address5],
        [address0, address0],
      );
    });

    it('can updateAggregator and updateAggregatorsList', async () => {
      let addressAggregator = await conversionPathInstance.allAggregators(address1, address2);
      expect(addressAggregator).equal(address0);

      await conversionPathInstance.updateAggregator(address1, address2, address3);

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2);
      expect(addressAggregator).equal(address3);

      addressAggregator = await conversionPathInstance.allAggregators(address4, address5);
      expect(addressAggregator, 'addressAggregator must be 0x').equal(address0);

      await conversionPathInstance.updateAggregatorsList(
        [address1, address4],
        [address2, address5],
        [address3, address6],
      );

      addressAggregator = await conversionPathInstance.allAggregators(address1, address2);
      expect(addressAggregator, 'addressAggregator must be 0x333..').equal(address3);
      addressAggregator = await conversionPathInstance.allAggregators(address4, address5);
      expect(addressAggregator, 'addressAggregator must be 0x666..').equal(address6);
    });
  });

  describe('getRate', async () => {
    describe('only fiat rates', async () => {
      it('can get rate from EUR to USD', async () => {
        const conversion = await conversionPathInstance.getRate([EUR_hash, USD_hash]);
        expect(conversion.rate.toString(), '1200000000000000000');
      });

      it('can get rate from USD to EUR', async () => {
        const conversion = await conversionPathInstance.getRate([USD_hash, EUR_hash]);
        expect(conversion.rate.toString(), '833333333333333333');
      });

      it('can get rate from USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getRate([USD_hash, EUR_hash, USD_hash]);
        expect(conversion.rate.toString(), '999999999999999999');
      });

      it('can get rate from ETH to USD to EUR', async () => {
        const conversion = await conversionPathInstance.getRate([ETH_hash, USD_hash, EUR_hash]);
        expect(conversion.rate.toString(), '41666666666');
      });
    });
  });

  describe('Ethereum rates', async () => {
    it('can get rate from USD to ETH', async () => {
      const conversion = await conversionPathInstance.getRate([USD_hash, ETH_hash]);
      expect(conversion.rate.toString(), '20000000000000000000000000');
    });

    it('can get rate from ETH to USD', async () => {
      const conversion = await conversionPathInstance.getRate([ETH_hash, USD_hash]);
      expect(conversion.rate.toString(), '50000000000');
    });

    it('can get rate from EUR to USD to ETH', async () => {
      const conversion = await conversionPathInstance.getRate([EUR_hash, USD_hash, ETH_hash]);
      expect(conversion.rate.toString(), '24000000000000000000000000');
    });

    it('can get rate from USD to ERC20', async () => {
      const conversion = await conversionPathInstance.getRate([USD_hash, DAI_address]);
      expect(conversion.rate.toString(), '9900990099009900990099009900');
    });

    it('can get rate from ETH to USD to ERC20', async () => {
      const conversion = await conversionPathInstance.getRate([ETH_hash, USD_hash, DAI_address]);
      expect(conversion.rate.toString(), '495049504950495049504');
    });
  });

  describe('USDT rates', async () => {
    it('can get rate from USD to ETH to USDT', async () => {
      const conversion = await conversionPathInstance.getRate([USD_hash, ETH_hash, USDT_address]);
      expect(conversion.rate.toString(), '10000000000000000');
    });

    it('can get rate from USDT to ETH to USD', async () => {
      const conversion = await conversionPathInstance.getRate([USDT_address, ETH_hash, USD_hash]);
      expect(conversion.rate.toString(), '100000000000000000000');
    });
  });

  describe('getConversion', async () => {
    describe('only fiat conversion', async () => {
      it('can convert EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          EUR_hash,
          USD_hash,
        ]);
        expect(conversion.result.toString(), '12000000000');
      });

      it('can convert USD to EUR', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          USD_hash,
          EUR_hash,
        ]);
        expect(conversion.result.toString(), '8333333333');
      });

      it('can convert USD to EUR to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          USD_hash,
          EUR_hash,
          USD_hash,
        ]);
        expect(conversion.result.toString(), '9999999999');
      });
    });

    describe('Ethereum conversion', async () => {
      it('can convert USD to ETH', async () => {
        const conversion = await conversionPathInstance.getConversion('100000000000', [
          USD_hash,
          ETH_hash,
        ]);
        expect(conversion.result.toString(), '2000000000000000000');
      });

      it('can convert ETH to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('2000000000000000000', [
          ETH_hash,
          USD_hash,
        ]);
        expect(conversion.result.toString(), '100000000000');
      });

      it('can convert EUR to USD to ETH', async () => {
        const conversion = await conversionPathInstance.getConversion('100000000000', [
          EUR_hash,
          USD_hash,
          ETH_hash,
        ]);
        expect(conversion.result.toString(), '2400000000000000000');
      });

      it('can convert ETH to USD to EUR', async () => {
        const conversion = await conversionPathInstance.getConversion('2000000000000000000', [
          ETH_hash,
          USD_hash,
          EUR_hash,
        ]);
        expect(conversion.result.toString(), '83333333332');
      });
    });

    describe('USDT conversion', async () => {
      it('can convert USD to ETH to USDT', async () => {
        const conversion = await conversionPathInstance.getConversion('10000000000', [
          USD_hash,
          ETH_hash,
          USDT_address,
        ]);
        expect(conversion.result.toString(), '100000000');
      });

      it('can convert USDT to ETH to USD', async () => {
        const conversion = await conversionPathInstance.getConversion('100000000', [
          USDT_address,
          ETH_hash,
          USD_hash,
        ]);
        expect(conversion.result.toString(), '10000000000');
      });
    });
  });
});
