import { Erc20PaymentNetwork } from '../../../payment-detection/dist';
import { AdvancedLogicTypes } from '@requestnetwork/types';
import { CurrencyManager } from '@requestnetwork/currency';
import { createMockErc20FeeRequest } from '../utils';

// Initiate mockedlogs.
// TODO: this is a quick-copy paste, no importance
export const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions: jest.fn(),
  extensions: {
    addressBasedErc20: {
      createAddPaymentAddressAction: jest.fn(),
      createAddRefundAddressAction: jest.fn(),
      createCreationAction: jest.fn(),
    },
  },
};
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
    });

    const balance = await customDetector.getBalance(mockRequest);
    const baseBalance = await feeProxyDetector.getBalance(mockRequest);

    expect(baseBalance.balance).toBe('1000000000000000000');
    expect(balance.balance).toBe('1000000000000000000');
  }, 15000);

  it('can getBalance on a rinkeby request', async () => {
    const mockRequest = createMockErc20FeeRequest({
      network: 'rinkeby',
      requestId: '016d4cf8006982f7d91a437f8c72700aa62767de00a605133ee5f84ad8d224ba04',
      paymentAddress: '0x4E64C2d06d19D13061e62E291b2C4e9fe5679b93',
      salt: '8097784e131ee627',
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
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
