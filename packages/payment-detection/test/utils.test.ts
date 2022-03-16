import { CurrencyManager } from '@requestnetwork/currency';
import { PaymentTypes } from '@requestnetwork/types';
import { padAmountForChainlink, unpadAmountFromChainlink, calcEscrowState } from '../src';

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

describe('calcEscrowState', () => {
  it('returns null if empty escrow events array', () => {
    expect(calcEscrowState([])).toBeNull;
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
    expect(calcEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.IN_FROZEN);
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
    expect(calcEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.IN_EMERGENCY);
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
    expect(calcEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.PAID_ESCROW);
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
    expect(calcEscrowState(escrowEvents)).toEqual(PaymentTypes.ESCROW_STATE.PAID_ISSUER);
  });
});
