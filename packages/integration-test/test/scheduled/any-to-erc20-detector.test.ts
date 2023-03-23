import { PaymentNetworkFactory } from '@requestnetwork/payment-detection';
import { PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';

import { mockAdvancedLogic } from './mocks';
import { createMockConversionErc20Request } from '../utils';

const pnFactory = new PaymentNetworkFactory(mockAdvancedLogic, CurrencyManager.getDefault());

describe('Any to ERC20 Fee Proxy detection test-suite', () => {
  it('can getBalance on a matic request with TheGraph', async () => {
    const mockRequest = createMockConversionErc20Request({
      network: 'matic',
      requestId: '0157d00fdd5d87ce4d634a1bb58b9c593733232bcd1547281adbc71a14e38bbbb9',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '3417d48a52160815',
      tokenAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI on matic
      feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
      feeAmount: '0',
      currency: {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        value: 'EUR',
      },
    });
    const paymentDetector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
    expect(paymentDetector).toBeDefined();

    const balance = await paymentDetector!.getBalance(mockRequest);

    expect(balance.balance).toBe('21');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe('payment');
    const params = balance.events[0].parameters as PaymentTypes.IERC20FeePaymentEventParameters;
    console.log(balance.events[0]);
    console.log(params);
    expect(params?.to).toBe('0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93');
    expect(balance.events[0].amount).toBe('21');
    expect(balance.events[0].timestamp).toBe(1678895377);
  }, 10000);

  it('cannot trick getBalance with a payment denominated in the wrong currency', async () => {
    const mockRequest = createMockConversionErc20Request({
      network: 'matic',
      requestId: '0157d00fdd5d87ce4d634a1bb58b9c593733232bcd1547281adbc71a14e38bbbb9',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '3417d48a52160815',
      tokenAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', // DAI on matic
      feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
      feeAmount: '0',
      currency: {
        type: RequestLogicTypes.CURRENCY.ISO4217,
        // One payment matches everything else but the currency on Matic (cf. test above)
        value: 'JPY',
      },
    });
    const paymentDetector = pnFactory.getPaymentNetworkFromRequest(mockRequest);
    expect(paymentDetector).toBeDefined();

    const balance = await paymentDetector!.getBalance(mockRequest);

    expect(balance.balance).toBe(0);
    expect(balance.events).toHaveLength(0);
  }, 10000);
});
