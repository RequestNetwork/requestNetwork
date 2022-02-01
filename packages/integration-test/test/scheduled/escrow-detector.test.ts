import { Erc20PaymentNetwork } from '../../../payment-detection/dist';
import { CurrencyManager } from '@requestnetwork/currency';
import { createMockErc20FeeRequest } from '../utils';
import { mockAdvancedLogic } from './mocks';

const customDetector = new Erc20PaymentNetwork.CustomProxyDetector({
  advancedLogic: mockAdvancedLogic,
  currencyManager: CurrencyManager.getDefault(),
});
const feeProxyDetector = new Erc20PaymentNetwork.ERC20FeeProxyPaymentDetector({
  advancedLogic: mockAdvancedLogic,
  currencyManager: CurrencyManager.getDefault(),
});

describe('ERC20 Escrow detection test-suite', () => {
  it('can getBalance on a matic request, with TheGraph', async () => {
    const mockRequest = createMockErc20FeeRequest({
      network: 'matic',
      requestId: '014bcd076791fb915af457df1d3f26c81ff66f7e278e4a18f0e48a1705572a6306',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '8c5ea6f8b4a14fe0',
      tokenAddress: '0x282d8efce846a88b159800bd4130ad77443fa1a1', // FAU
      feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
      feeAmount: '1000000000000000',
    });

    const balance = await customDetector.getBalance(mockRequest);
    const baseBalance = await feeProxyDetector.getBalance(mockRequest);

    expect(baseBalance.balance).toBe('1000000000000000000');
    expect(balance.balance).toBe('1000000000000000000');
  }, 15000);

  it('can getBalance on a rinkeby request', async () => {
    const mockRequest = createMockErc20FeeRequest({
      network: 'rinkeby',
      requestId: '0188791633ff0ec72a7dbdefb886d2db6cccfa98287320839c2f173c7a4e3ce7e1',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '0ee84db293a752c6',
      tokenAddress: '0xFab46E002BbF0b4509813474841E0716E6730136', // FAU
      feeAddress: '0x35d0e078755cd84d3e0656caab417dee1d7939c7',
      feeAmount: '1000000000000000',
    });

    const balance = await customDetector.getBalance(mockRequest);
    const baseBalance = await feeProxyDetector.getBalance(mockRequest);

    // Sanity check
    expect(baseBalance.balance).toBe('1000000000000000000');
    expect(balance.balance).toBe('1000000000000000000');
    const events = await customDetector.getAllEvents(mockRequest);
    expect(events).toHaveLength(3);
  });
});
