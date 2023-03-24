import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { CurrencyTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';

import { mockAdvancedLogic } from './mocks';
import { createMockConversionErc20Request } from '../utils';

const pnFactory = new PaymentNetworkFactory(mockAdvancedLogic, CurrencyManager.getDefault());

const paidEURRequest = {
  network: 'matic' as CurrencyTypes.EvmChainName,
  requestId: '0117d7a59a48e5031b3c56c92621453149e4a4462dba6eaeb3271a995c4201448b',
  paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
  salt: '5ddb1c1645ac2daf',
  tokenAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI on matic
  feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
  feeAmount: '0',
  currency: {
    type: RequestLogicTypes.CURRENCY.ISO4217,
    value: 'EUR',
  },
};

describe('Any to ERC20 Fee Proxy detection test-suite', () => {
  it('can getBalance on a matic request with TheGraph', async () => {
    const mockRequest = createMockConversionErc20Request(paidEURRequest);
    const paymentDetector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
    expect(paymentDetector).toBeDefined();

    const balance = await paymentDetector!.getBalance(mockRequest);

    expect(balance.balance).toBe('10');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    const params = balance.events[0].parameters as PaymentTypes.IERC20FeePaymentEventParameters;
    expect(params?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('10');
    expect(balance.events[0].timestamp).toBe(1679579206);
  });

  it('cannot trick getBalance with a payment denominated in the wrong currency', async () => {
    const mockRequest = createMockConversionErc20Request({
      ...paidEURRequest,
      currency: {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'JPY',
      },
    });
    const paymentDetector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
    expect(paymentDetector).toBeDefined();

    const balance = await paymentDetector!.getBalance(mockRequest);

    expect(balance.balance).toBe('0');
    expect(balance.events).toHaveLength(0);
  });
});
