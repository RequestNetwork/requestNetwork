import { buildTheGraphSuperfluidUrl } from '../../src/thegraph/superfluid';

describe('buildTheGraphSuperfluidUrl', () => {
  it('should build the correct URL when baseUrl is undefined', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'sepolia');
    expect(url).toBe('https://subgraph-endpoints.superfluid.dev/eth-sepolia/protocol-v1');
  });
  it('should build the correct URL when baseUrl is defined', () => {
    const url = buildTheGraphSuperfluidUrl('https://example.com', 'sepolia');
    expect(url).toBe('https://example.com/eth-sepolia/protocol-v1');
  });
  it('should build the correct URL when network is private', () => {
    const url = buildTheGraphSuperfluidUrl(undefined, 'private');
    expect(url).toBe('http://localhost:8000/subgraphs/name/superfluid-finance/protocol-v1-goerli');
  });
});
