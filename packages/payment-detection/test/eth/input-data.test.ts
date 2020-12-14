/* eslint-disable spellcheck/spell-checker */
import {
  AdvancedLogicTypes,
  ExtensionTypes,
  PaymentTypes,
  RequestLogicTypes,
} from '@requestnetwork/types';
import EthInputData from '../../src/eth/input-data';

let ethInputData: EthInputData;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    ethereumInputData: {
      createAddPaymentAddressAction(): any {
        return;
      },
      createAddRefundAddressAction(): any {
        return;
      },
      createCreationAction(): any {
        return;
      },
    },
  },
};

// Most of the tests are done as integration tests in ../index.test.ts
/* tslint:disable:no-unused-expression */
describe('api/eth/input-data', () => {
  beforeEach(() => {
    ethInputData = new EthInputData({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(mockAdvancedLogic.extensions.ethereumInputData, 'createCreationAction');

    await ethInputData.createExtensionsDataForCreation({ paymentAddress: 'ethereum address' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.ethereumInputData,
      'createAddPaymentAddressAction',
    );

    ethInputData.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.ethereumInputData,
      'createAddRefundAddressAction',
    );

    ethInputData.createExtensionsDataForAddRefundInformation({
      refundAddress: 'ethereum address',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Skip because input-data cannot be used without etherscan
  it.skip('can getBalance on a localhost request', async () => {
    const mockRequest = {
      creator: { type: '', value: '0x2' },
      currency: {
        network: 'private',
        type: RequestLogicTypes.CURRENCY.ETH,
        value: 'ETH',
      },
      events: [],
      expectedAmount: '0',
      extensions: {
        [ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA]: {
          events: [],
          id: '0',
          type: 'none',
          values: {
            paymentAddress: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
            salt: 'ea3bc7caf64110ca',
          },
          version: '0',
        },
      },
      extensionsData: [],
      requestId: '0x1',
      state: 'Good',
      timestamp: 0,
      version: '0.2',
    };

    const balance = await ethInputData.getBalance(mockRequest as RequestLogicTypes.IRequest);

    expect(balance.balance).toBe('10');
    expect(balance.events).toHaveLength(1);
    expect(balance.events[0].name).toBe(PaymentTypes.EVENTS_NAMES.PAYMENT);
    expect(balance.events[0].amount).toBe('10');
    expect(typeof balance.events[0].timestamp).toBe('number');
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await ethInputData.getBalance({
        currency: { network: 'wrong' },
      } as RequestLogicTypes.IRequest),
    ).toMatchObject({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.NETWORK_NOT_SUPPORTED,
        message:
          'Payment network wrong not supported by ETH payment detection. Supported networks: mainnet, rinkeby, private',
      },
      events: [],
    });
  });
});
