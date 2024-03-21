import EvmEcosystem from '../src/chains/evm/evm-ecosystem';
import { ChainManager } from '../src';
import { ChainTypes } from '@requestnetwork/types';
import NearEcosystem from '../src/chains/near/near-ecosystem';

describe('chain equality', () => {
  it('Should return true for 2 identical EVMs', () => {
    const chain1 = ChainManager.current().fromName('arbitrum-one', [ChainTypes.ECOSYSTEM.EVM]);
    const chain2 = ChainManager.current().fromName('arbitrum-one', [ChainTypes.ECOSYSTEM.EVM]);
    expect(chain1.eq(chain2)).toBe(true);
  });
  it('Should return false for 2 different EVMs', () => {
    const chain1 = ChainManager.current().fromName('mainnet', [ChainTypes.ECOSYSTEM.EVM]);
    const chain2 = ChainManager.current().fromName('arbitrum-one', [ChainTypes.ECOSYSTEM.EVM]);
    expect(chain1.eq(chain2)).toBe(false);
  });
  // FIXME: get rid of all aurora alias and mentions
  it('Should return true for 2 identical NEAR', () => {
    const chain1 = ChainManager.current().fromName('aurora-testnet', [ChainTypes.ECOSYSTEM.NEAR]);
    const chain2 = ChainManager.current().fromName('near-testnet', [ChainTypes.ECOSYSTEM.NEAR]);
    expect(chain1.eq(chain2)).toBe(true);
  });
  it('Should return false for 2 different chains on 2 different ecosystems', () => {
    const chain2 = ChainManager.current().fromName('arbitrum-one', [ChainTypes.ECOSYSTEM.EVM]);
    const chain1 = ChainManager.current().fromName('aurora-testnet', [ChainTypes.ECOSYSTEM.NEAR]);
    expect(chain1.eq(chain2)).toBe(false);
  });
});

describe('ecosystem isChainSupported', () => {
  describe('NearEcosystem', () => {
    it('returns true for near', () => {
      expect(NearEcosystem.isChainSupported('near')).toEqual(true);
    });
    it('returns true for aurora', () => {
      expect(NearEcosystem.isChainSupported('aurora')).toEqual(true);
    });
    it('returns false for mainnet', () => {
      expect(NearEcosystem.isChainSupported('mainnet')).toEqual(false);
    });
  });
  describe('EvmEcosystem', () => {
    it('returns true for mainnet', () => {
      expect(EvmEcosystem.isChainSupported('mainnet')).toEqual(true);
    });
    it('returns false for near', () => {
      expect(EvmEcosystem.isChainSupported('near')).toEqual(false);
    });
  });
});
