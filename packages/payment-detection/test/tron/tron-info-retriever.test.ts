import { PaymentTypes } from '@requestnetwork/types';
import { TronInfoRetriever } from '../../src/tron/tron-info-retriever';

describe('TronInfoRetriever', () => {
  const mockPayment = {
    amount: '1000000',
    block: 63208800,
    txHash: 'abc123def456',
    feeAmount: '10000',
    feeAddress: 'TFeeAddress1234567890123456789012',
    from: 'TFromAddress1234567890123456789012',
    timestamp: 1700000000,
    tokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  };

  const createMockClient = (payments: (typeof mockPayment)[]) => ({
    GetTronPayments: jest.fn().mockResolvedValue({ payments }),
    GetTronPaymentsAnyToken: jest.fn().mockResolvedValue({ payments }),
    options: {},
  });

  describe('getTransferEvents', () => {
    it('should retrieve payment events with token filter', async () => {
      const mockClient = createMockClient([mockPayment]);
      const retriever = new TronInfoRetriever(mockClient as any);

      const result = await retriever.getTransferEvents({
        paymentReference: 'abc123',
        toAddress: 'TToAddress12345678901234567890123',
        contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        paymentChain: 'tron',
        eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
        acceptedTokens: ['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'],
      });

      expect(mockClient.GetTronPayments).toHaveBeenCalled();
      expect(result.paymentEvents).toHaveLength(1);
      expect(result.paymentEvents[0].amount).toBe('1000000');
      expect(result.paymentEvents[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(result.paymentEvents[0].parameters?.feeAmount).toBe('10000');
      expect(result.paymentEvents[0].parameters?.txHash).toBe('abc123def456');
    });

    it('should retrieve payment events without token filter', async () => {
      const mockClient = createMockClient([mockPayment]);
      const retriever = new TronInfoRetriever(mockClient as any);

      const result = await retriever.getTransferEvents({
        paymentReference: 'abc123',
        toAddress: 'TToAddress12345678901234567890123',
        contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        paymentChain: 'tron',
        eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
      });

      expect(mockClient.GetTronPaymentsAnyToken).toHaveBeenCalled();
      expect(result.paymentEvents).toHaveLength(1);
    });

    it('should return empty array when no payments found', async () => {
      const mockClient = createMockClient([]);
      const retriever = new TronInfoRetriever(mockClient as any);

      const result = await retriever.getTransferEvents({
        paymentReference: 'abc123',
        toAddress: 'TToAddress12345678901234567890123',
        contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        paymentChain: 'tron',
        eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
        acceptedTokens: ['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'],
      });

      expect(result.paymentEvents).toHaveLength(0);
    });

    it('should throw error for multiple accepted tokens', async () => {
      const mockClient = createMockClient([]);
      const retriever = new TronInfoRetriever(mockClient as any);

      await expect(
        retriever.getTransferEvents({
          paymentReference: 'abc123',
          toAddress: 'TToAddress12345678901234567890123',
          contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
          paymentChain: 'tron',
          eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
          acceptedTokens: [
            'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
          ],
        }),
      ).rejects.toThrow('TronInfoRetriever does not support multiple accepted tokens');
    });

    it('should handle refund events correctly', async () => {
      const mockClient = createMockClient([mockPayment]);
      const retriever = new TronInfoRetriever(mockClient as any);

      const result = await retriever.getTransferEvents({
        paymentReference: 'abc123',
        toAddress: 'TToAddress12345678901234567890123',
        contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        paymentChain: 'tron',
        eventName: PaymentTypes.EVENTS_NAMES.REFUND,
        acceptedTokens: ['TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'],
      });

      expect(result.paymentEvents[0].name).toBe(PaymentTypes.EVENTS_NAMES.REFUND);
    });
  });
});
