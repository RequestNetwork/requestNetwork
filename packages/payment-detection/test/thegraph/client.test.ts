import { getTheGraphClientUrl } from '../../src/thegraph';

describe('getTheGraphClientUrl', () => {
  it('should use the URL passed as option if any', () => {
    const url = getTheGraphClientUrl('base', { url: 'test' });
    expect(url).toBe('test');
  });
  it('should build the correct URL for network supported by Alchemy', () => {
    const url = getTheGraphClientUrl('base');
    expect(url).toBe(
      'https://subgraph.satsuma-prod.com/e2e4905ab7c8/request-network--434873/request-payments-base/api',
    );
  });
  it('should build the correct URL when using TheGraph Explorer API key', () => {
    const url = getTheGraphClientUrl('base', { theGraphExplorerApiKey: 'test' });
    expect(url).toBe(
      'https://gateway.thegraph.com/api/test/subgraphs/id/CcTtKy6BustyyVZ5XvFD4nLnbkgMBT1vcAEJ3sAx6bRe',
    );
  });
  it('should build the correct URL for Mantle', () => {
    const url = getTheGraphClientUrl('mantle');
    expect(url).toBe(
      'https://subgraph-api.mantle.xyz/api/public/555176e7-c1f4-49f9-9180-f2f03538b039/subgraphs/requestnetwork/request-payments-mantle/v0.1.0/gn',
    );
  });
  it('should build the correct URL for Near', () => {
    const urlNear = getTheGraphClientUrl('near');
    expect(urlNear).toBe(
      'https://api.studio.thegraph.com/query/67444/request-payments-near/version/latest',
    );
    const urlNearTestnet = getTheGraphClientUrl('near-testnet');
    expect(urlNearTestnet).toBe(
      'https://api.studio.thegraph.com/query/67444/request-payments-near-testnet/version/latest',
    );
    const urlAurora = getTheGraphClientUrl('aurora');
    expect(urlAurora).toBe(
      'https://api.studio.thegraph.com/query/67444/request-payments-near/version/latest',
    );
    const urlAuroraTestnet = getTheGraphClientUrl('aurora-testnet');
    expect(urlAuroraTestnet).toBe(
      'https://api.studio.thegraph.com/query/67444/request-payments-near-testnet/version/latest',
    );
  });
  it('should build the correct URL for Near with TheGraph Explorer API key', () => {
    const url = getTheGraphClientUrl('near', { theGraphExplorerApiKey: 'test' });
    expect(url).toBe(
      'https://gateway.thegraph.com/api/test/subgraphs/id/9yEg3h46CZiv4VuSqo1erMMBx5sHxRuW5Ai2V8goSpQL',
    );
  });
});
