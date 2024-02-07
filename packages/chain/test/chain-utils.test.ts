import { EvmChains, NearChains, isSameChain } from '../src/index';

describe('isSameChain', () => {
  it('Should return true for 2 identical EVMs', () => {
    expect(isSameChain('arbitrum-one', 'arbitrum-one')).toBe(true);
  });
  it('Should return false for 2 different EVMs', () => {
    expect(isSameChain('mainnet', 'arbitrum-one')).toBe(false);
  });
  // FIXME: get rid of all aurora alias and mentions
  it('Should return true for 2 identical NEAR', () => {
    expect(isSameChain('aurora-testnet', 'near-testnet')).toBe(true);
  });
  it('Should return false for 2 different chains on 2 different ecosystems', () => {
    expect(isSameChain('aurora-testnet', 'arbitrum-one')).toBe(false);
  });
});

describe('isChainSupported', () => {
  describe('NearChains', () => {
    it('returns true for near', () => {
      expect(NearChains.isChainSupported('near')).toEqual(true);
    });
    it('returns true for aurora', () => {
      expect(NearChains.isChainSupported('aurora')).toEqual(true);
    });
    it('returns false for mainnet', () => {
      expect(NearChains.isChainSupported('mainnet')).toEqual(false);
    });
  });
  describe('EvmChains', () => {
    it('returns true for mainnet', () => {
      expect(EvmChains.isChainSupported('mainnet')).toEqual(true);
    });
    it('returns false for near', () => {
      expect(EvmChains.isChainSupported('near')).toEqual(false);
    });
  });
});
