import { HasuraClient, getHasuraClient } from '../../src/tron/retrievers/hasura-client';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('HasuraClient', () => {
  const defaultUrl = 'https://graphql.request.network/v1/graphql';
  let client: HasuraClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new HasuraClient({ url: defaultUrl });
  });

  describe('constructor', () => {
    it('should create a client with the provided URL', () => {
      const client = new HasuraClient({ url: 'https://custom.url/graphql' });
      expect(client).toBeDefined();
    });

    it('should include admin secret in headers when provided', async () => {
      const clientWithSecret = new HasuraClient({
        url: defaultUrl,
        adminSecret: 'test-secret',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { payments: [] } }),
      });

      await clientWithSecret.getPaymentsByReference({
        paymentReference: '0xtest',
        toAddress: 'TAddress123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        defaultUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-hasura-admin-secret': 'test-secret',
          }),
        }),
      );
    });

    it('should merge custom headers', async () => {
      const clientWithHeaders = new HasuraClient({
        url: defaultUrl,
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { payments: [] } }),
      });

      await clientWithHeaders.getPaymentsByReference({
        paymentReference: '0xtest',
        toAddress: 'TAddress123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        defaultUrl,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        }),
      );
    });
  });

  describe('getPaymentsByReference', () => {
    const mockPayments = [
      {
        id: 'tron-0x123-0',
        chain: 'tron',
        tx_hash: '0x123abc',
        block_number: 79238121,
        timestamp: 1738742584,
        contract_address: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        token_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        from_address: 'TFromAddress123',
        to_address: 'TToAddress456',
        amount: '100000000',
        fee_amount: '1000000',
        fee_address: 'TFeeAddress789',
        payment_reference: '0xabc123',
      },
    ];

    it('should query payments by reference and toAddress', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { payments: mockPayments } }),
      });

      const result = await client.getPaymentsByReference({
        paymentReference: '0xabc123',
        toAddress: 'TToAddress456',
      });

      expect(result).toEqual(mockPayments);
      expect(mockFetch).toHaveBeenCalledWith(
        defaultUrl,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('payment_reference'),
        }),
      );
    });

    it('should include chain filter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { payments: mockPayments } }),
      });

      await client.getPaymentsByReference({
        paymentReference: '0xabc123',
        toAddress: 'TToAddress456',
        chain: 'tron',
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toContain('chain');
      expect(callBody).toContain('tron');
    });

    it('should include tokenAddress filter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { payments: mockPayments } }),
      });

      await client.getPaymentsByReference({
        paymentReference: '0xabc123',
        toAddress: 'TToAddress456',
        tokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toContain('token_address: { _ilike:');
    });

    it('should include contractAddress filter when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { payments: mockPayments } }),
      });

      await client.getPaymentsByReference({
        paymentReference: '0xabc123',
        toAddress: 'TToAddress456',
        contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
      });

      const callBody = mockFetch.mock.calls[0][1].body;
      expect(callBody).toContain('contract_address: { _ilike:');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        client.getPaymentsByReference({
          paymentReference: '0xabc123',
          toAddress: 'TToAddress456',
        }),
      ).rejects.toThrow('Hasura request failed: Internal Server Error');
    });

    it('should throw error when GraphQL returns errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            errors: [{ message: 'Field not found' }],
          }),
      });

      await expect(
        client.getPaymentsByReference({
          paymentReference: '0xabc123',
          toAddress: 'TToAddress456',
        }),
      ).rejects.toThrow('Hasura query error:');
    });

    it('should return empty array when no payments found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { payments: [] } }),
      });

      const result = await client.getPaymentsByReference({
        paymentReference: '0xnonexistent',
        toAddress: 'TToAddress456',
      });

      expect(result).toEqual([]);
    });
  });
});

describe('getHasuraClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return a client for tron network', () => {
    const client = getHasuraClient('tron');
    expect(client).toBeInstanceOf(HasuraClient);
  });

  it('should return a client for nile (tron testnet) network', () => {
    const client = getHasuraClient('nile' as any);
    expect(client).toBeUndefined(); // 'nile' doesn't contain 'tron'
  });

  it('should return undefined for non-TRON networks', () => {
    const client = getHasuraClient('mainnet');
    expect(client).toBeUndefined();
  });

  it('should return undefined for ethereum network', () => {
    const client = getHasuraClient('sepolia');
    expect(client).toBeUndefined();
  });

  it('should use environment variable for URL when not provided', () => {
    process.env.HASURA_GRAPHQL_URL = 'https://env.graphql.url/v1/graphql';
    const client = getHasuraClient('tron');
    expect(client).toBeInstanceOf(HasuraClient);
  });

  it('should use provided options over environment variables', () => {
    process.env.HASURA_GRAPHQL_URL = 'https://env.graphql.url/v1/graphql';
    const client = getHasuraClient('tron', {
      url: 'https://custom.graphql.url/v1/graphql',
    });
    expect(client).toBeInstanceOf(HasuraClient);
  });
});
