import { buildTheGraphSuperfluidUrl } from '../../src/thegraph/superfluid';

describe('buildTheGraphSuperfluidUrl', () => {
  it('should build the correct URL when baseUrl is defined', () => {
    const url = buildTheGraphSuperfluidUrl('https://example.com', 'sepolia');
    expect(url).toBe('https://example.com/eth-sepolia/protocol-v1');
  });
  it('should build the correct URL when network is private', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'private');
    expect(url).toBe('http://localhost:8000/subgraphs/name/superfluid-finance/protocol-v1-goerli');
  });
  it('should build the correct URL when baseUrl is undefined and network is private', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'private');
    expect(url).toBe('http://localhost:8000/subgraphs/name/superfluid-finance/protocol-v1-goerli');
  });
  it('should build the correct URL when baseUrl is undefined and network is arbitrum-one', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'arbitrum-one');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/arbitrum-one/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is avalanche', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'avalanche');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/avalanche-c/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is base', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'base');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/base-mainnet/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is bsc', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'bsc');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/bsc-mainnet/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is celo', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'celo');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/celo-mainnet/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is mainnet', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'mainnet');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/eth-mainnet/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is matic', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'matic');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/polygon-mainnet/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is optimism', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'optimism');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/optimism-mainnet/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is sepolia', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'sepolia');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/eth-sepolia/protocol-v1');
  });
  it('should build the correct URL when baseUrl is undefined and network is xdai', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'xdai');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/xdai-mainnet/protocol-v1');
  });
});
