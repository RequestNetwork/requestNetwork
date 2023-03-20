import { Utils } from '../src/index';

describe('Utils.isSameNetwork', () => {
  it('Should return true for 2 identical EVMs', () => {
    expect(Utils.isSameNetwork('arbitrum-one', 'arbitrum-one')).toBe(true);
  });
  it('Should return false for 2 different EVMs', () => {
    expect(Utils.isSameNetwork('mainnet', 'arbitrum-one')).toBe(false);
  });
  // FIXME: get rid of all aurora alias and mentions
  it('Should return true for 2 identical NEAR', () => {
    expect(Utils.isSameNetwork('aurora-testnet', 'near-testnet')).toBe(true);
  });
  it('Should return false for 2 different chains on 2 different ecosystems', () => {
    expect(Utils.isSameNetwork('aurora-testnet', 'arbitrum-one')).toBe(false);
  });
});
