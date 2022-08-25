import { CurrencyManager } from '@requestnetwork/currency';
import { ExtensionTypes, PaymentTypes } from '@requestnetwork/types';
import {
  padAmountForChainlink,
  unpadAmountFromChainlink,
  calculateEscrowState,
  getPaymentReference,
} from '../src';

describe('conversion: padding amounts for Chainlink', () => {
  const currencyManager = CurrencyManager.getDefault();
  it('should throw on currencies not implemented in the library', () => {
    const requestCurrency = currencyManager.fromSymbol('BTC')!;
    const twentyBtc = '2000000000';
    expect(() => padAmountForChainlink(twentyBtc, requestCurrency)).toThrowError(
      'Unsupported request currency for conversion with Chainlink. The request currency has to be fiat, ETH or ERC20.',
    );
  });
  it('should pad fiat amounts', () => {
    const requestCurrency = currencyManager.fromSymbol('EUR')!;
    const twentyEur = '2000';
    expect(padAmountForChainlink(twentyEur, requestCurrency).toString()).toBe('2000000000');
  });
  it('should unpad fiat amounts', () => {
    const requestCurrency = currencyManager.fromSymbol('EUR')!;
    expect(unpadAmountFromChainlink('2000000000', requestCurrency).toString()).toBe('2000');
  });
  it('should not pad crypto amounts (ETH)', () => {
    const requestCurrency = currencyManager.fromSymbol('ETH')!;
    const twentyEth = '20000000000000000000';
    expect(padAmountForChainlink(twentyEth, requestCurrency).toString()).toBe(twentyEth);
  });
  it('should not unpad fiat amounts (ETH)', () => {
    const requestCurrency = currencyManager.fromSymbol('ETH')!;
    const twentyEth = '20000000000000000000';
    expect(unpadAmountFromChainlink(twentyEth, requestCurrency).toString()).toBe(twentyEth);
  });
  it('should not pad crypto amounts (DAI)', () => {
    const requestCurrency = currencyManager.fromSymbol('DAI')!;
    const twentyDai = '20000000000000000000';
    expect(padAmountForChainlink(twentyDai, requestCurrency).toString()).toBe(twentyDai);
  });
  it('should not unpad crypto amounts (DAI)', () => {
    const requestCurrency = currencyManager.fromSymbol('DAI')!;
    const twentyDai = '20000000000000000000';
    expect(unpadAmountFromChainlink(twentyDai, requestCurrency).toString()).toBe(twentyDai);
  });
  it('should not pad crypto amounts (USDC)', () => {
    const requestCurrency = currencyManager.fromSymbol('USDC')!;
    const twentyUsdc = '20000000';
    expect(padAmountForChainlink(twentyUsdc, requestCurrency).toString()).toBe(twentyUsdc);
  });
});

describe('calculateEscrowState', () => {
  it('returns null if empty escrow events array', () => {
    expect(calculateEscrowState([])).toBeNull;
  });
  it('detects frozen escrow', () => {
    const escrowEvents = [
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ESCROW,
          block: 123,
          txHash: '0xabc',
        },
      },
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.FREEZE_ESCROW,
          block: 123,
          txHash: '0xabc',
        },
      },
    ];
    expect(calculateEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.IN_FROZEN);
  });
  it('detects in emergency escrow', () => {
    const escrowEvents = [
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ESCROW,
          block: 123,
          txHash: '0xabc',
        },
      },
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.INITIATE_EMERGENCY_CLAIM,
          block: 123,
          txHash: '0xabc',
        },
      },
    ];
    expect(calculateEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.IN_EMERGENCY);
  });
  it('detects in emergency then reverted to paidEscrow', () => {
    const escrowEvents = [
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ESCROW,
          block: 123,
          txHash: '0xabc',
        },
      },
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.INITIATE_EMERGENCY_CLAIM,
          block: 123,
          txHash: '0xabc',
        },
      },
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.REVERT_EMERGENCY_CLAIM,
          block: 123,
          txHash: '0xabc',
        },
      },
    ];
    expect(calculateEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.PAID_ESCROW);
  });
  it('detects paid to issuer escrow', () => {
    const escrowEvents = [
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ESCROW,
          block: 123,
          txHash: '0xabc',
        },
      },
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.INITIATE_EMERGENCY_CLAIM,
          block: 123,
          txHash: '0xabc',
        },
      },
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.REVERT_EMERGENCY_CLAIM,
          block: 123,
          txHash: '0xabc',
        },
      },
      {
        name: PaymentTypes.EVENTS_NAMES.ESCROW,
        parameters: {
          eventName: PaymentTypes.ESCROW_EVENTS_NAMES.PAID_ISSUER,
          block: 123,
          txHash: '0xabc',
        },
      },
    ];
    expect(calculateEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.PAID_ISSUER);
  });
});

describe('getPaymentReference', () => {
  const salt = 'a1a2a3a4a5a6a7a8';
  const paymentAddress = '0x0000000000000000000000000000000000000001';
  const refundAddress = '0x0000000000000000000000000000000000000002';

  const paymentInfo = { IBAN: 'FR123456789123456789', BIC: 'CE123456789' };
  const refundInfo = { IBAN: 'FR987654321987654321', BIC: 'CE987654321' };

  it('is undefined on missing salt', () => {
    expect(
      getPaymentReference({
        requestId: '01abyz',
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
            values: {
              paymentAddress,
              refundAddress,
            },
            version: '0.1.0',
            events: [],
          },
        },
      }),
    ).toBe(undefined);
  });

  it('is undefined on missing info', () => {
    expect(
      getPaymentReference({
        requestId: '01abyz',
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
            values: {},
            version: '0.1.0',
            events: [],
          },
        },
      }),
    ).toBe(undefined);
  });

  it('crypto request payment', () => {
    expect(
      getPaymentReference({
        requestId: '01abyz',
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
            values: {
              paymentAddress,
              refundAddress,
              salt,
            },
            version: '0.1.0',
            events: [],
          },
        },
      }),
    ).toBe('6edd2877758e7e69');
  });

  it('crypto request refund', () => {
    expect(
      getPaymentReference(
        {
          requestId: '01abyz',
          extensions: {
            [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
              id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
              type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
              values: {
                paymentAddress,
                refundAddress,
                salt,
              },
              version: '0.1.0',
              events: [],
            },
          },
        },
        PaymentTypes.EVENTS_NAMES.REFUND,
      ),
    ).toBe('10f62d12e4d6be3f');
  });

  it('declarative request payment', () => {
    expect(
      getPaymentReference({
        requestId: '01abyz',
        extensions: {
          [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE]: {
            id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
            type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
            values: {
              paymentInfo,
              refundInfo,
              salt,
            },
            version: '0.1.0',
            events: [],
          },
        },
      }),
    ).toBe('87a333df2660c8a9');
  });

  it('declarative request refund', () => {
    expect(
      getPaymentReference(
        {
          requestId: '01abyz',
          extensions: {
            [ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE]: {
              id: ExtensionTypes.ID.PAYMENT_NETWORK_ANY_DECLARATIVE,
              type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
              values: {
                paymentInfo,
                refundInfo,
                salt,
              },
              version: '0.1.0',
              events: [],
            },
          },
        },
        PaymentTypes.EVENTS_NAMES.REFUND,
      ),
    ).toBe('c204ba7a643ddf31');
  });

  it('Escrow acts as a payment', () => {
    expect(
      getPaymentReference(
        {
          requestId: '01abyz',
          extensions: {
            [ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT]: {
              id: ExtensionTypes.ID.PAYMENT_NETWORK_ERC20_PROXY_CONTRACT,
              type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
              values: {
                paymentAddress,
                refundAddress,
                salt,
              },
              version: '0.1.0',
              events: [],
            },
          },
        },
        PaymentTypes.EVENTS_NAMES.ESCROW,
      ),
    ).toBe('6edd2877758e7e69');
  });
});
