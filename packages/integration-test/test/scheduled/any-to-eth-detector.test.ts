import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { CurrencyTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';

import { mockAdvancedLogic } from './mocks.js';
import { createMockConversionEthTokenRequest } from '../utils.js';

const pnFactory = new PaymentNetworkFactory(mockAdvancedLogic, CurrencyManager.getDefault());

const paidEURRequest = {
  network: 'matic' as CurrencyTypes.EvmChainName,
  requestId: '01814304b39265cbf0c2abb4f3c7e8432d1e2c8779be6022e545d25f95144360e0',
  paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
  salt: 'b3f2e478374bff64',
  feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
  feeAmount: '0',
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
};

describe('Any to ETH Fee Proxy detection test-suite (with a TheGraph Retriever)', () => {
  it('can getBalance on a matic request', async () => {
    const mockRequest = createMockConversionEthTokenRequest(paidEURRequest);

    const detector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
    expect(detector).not.toBeNull();
    const balance = await detector!.getBalance(mockRequest);

    expect(balance.balance).toBe('500'); // 5 EUR
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    const params = balance.events[0].parameters as PaymentTypes.ETHPaymentNetworkEventParameters;
    expect(params?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('500');
    expect(balance.events[0].timestamp).toBe(1679673909);
  });

  it('cannot trick getBalance with a payment denominated in the wrong currency', async () => {
    const mockRequest = createMockConversionEthTokenRequest({
      ...paidEURRequest,
      currency: {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'USD',
      },
    });

    const detector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
    expect(detector).not.toBeNull();
    const balance = await detector!.getBalance(mockRequest);

    expect(balance.balance).toBe('0');
    expect(balance.events).toHaveLength(0);
  });
});
