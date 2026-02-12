import { PaymentTypes } from '@requestnetwork/types';
import { TronInfoRetriever } from '../../src/tron/retrievers/tron-info-retriever';
import { HasuraPayment } from '../../src/tron/retrievers/hasura-client';

describe('TronInfoRetriever', () => {
  const mockPayment: HasuraPayment = {
    id: 'payment-1',
    chain: 'tron',
    tx_hash: 'abc123def456',
    block_number: 63208800,
    timestamp: 1700000000,
    contract_address: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
    token_address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    from_address: 'TFromAddress1234567890123456789012',
    to_address: 'TToAddress12345678901234567890123',
    amount: '1000000',
    fee_amount: '10000',
    fee_address: 'TFeeAddress1234567890123456789012',
    payment_reference: '0xhashedref',
    energy_used: '65000',
    energy_fee: '26.3',
    net_fee: '0',
  };

  const createMockClient = (payments: HasuraPayment[]) => ({
    getPaymentsByReference: jest.fn().mockResolvedValue(payments),
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

      expect(mockClient.getPaymentsByReference).toHaveBeenCalledWith(
        expect.objectContaining({
          toAddress: 'TToAddress12345678901234567890123',
          chain: 'tron',
          tokenAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        }),
      );
      expect(result.paymentEvents).toHaveLength(1);
      expect(result.paymentEvents[0].amount).toBe('1000000');
      expect(result.paymentEvents[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
      expect(result.paymentEvents[0].parameters?.feeAmount).toBe('10000');
      expect(result.paymentEvents[0].parameters?.txHash).toBe('abc123def456');
      expect(result.paymentEvents[0].parameters?.from).toBe('TFromAddress1234567890123456789012');
      expect(result.paymentEvents[0].parameters?.to).toBe('TToAddress12345678901234567890123');
      expect(result.paymentEvents[0].parameters?.tokenAddress).toBe(
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      );
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

      expect(mockClient.getPaymentsByReference).toHaveBeenCalledWith(
        expect.objectContaining({
          toAddress: 'TToAddress12345678901234567890123',
          chain: 'tron',
          tokenAddress: undefined,
          contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        }),
      );
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

    it('should map nile chain name to tron-nile identifier', async () => {
      const mockClient = createMockClient([]);
      const retriever = new TronInfoRetriever(mockClient as any);

      await retriever.getTransferEvents({
        paymentReference: 'abc123',
        toAddress: 'TToAddress12345678901234567890123',
        contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        paymentChain: 'nile' as any,
        eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
      });

      expect(mockClient.getPaymentsByReference).toHaveBeenCalledWith(
        expect.objectContaining({
          chain: 'tron-nile',
        }),
      );
    });

    it('should include TRON-specific resource fields in event parameters', async () => {
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

      const params = result.paymentEvents[0].parameters as any;
      expect(params.energyUsed).toBe('65000');
      expect(params.energyFee).toBe('26.3');
      expect(params.netFee).toBe('0');
    });

    it('should coerce numeric amount and feeAmount to strings', async () => {
      const paymentWithNumericAmount: HasuraPayment = {
        ...mockPayment,
        amount: 2000000,
        fee_amount: 20000,
      };
      const mockClient = createMockClient([paymentWithNumericAmount]);
      const retriever = new TronInfoRetriever(mockClient as any);

      const result = await retriever.getTransferEvents({
        paymentReference: 'abc123',
        toAddress: 'TToAddress12345678901234567890123',
        contractAddress: 'TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd',
        paymentChain: 'tron',
        eventName: PaymentTypes.EVENTS_NAMES.PAYMENT,
      });

      expect(result.paymentEvents[0].amount).toBe('2000000');
      expect(result.paymentEvents[0].parameters?.feeAmount).toBe('20000');
    });
  });
});
