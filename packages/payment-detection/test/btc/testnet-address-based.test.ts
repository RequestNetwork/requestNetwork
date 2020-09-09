import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import AddressBasedTestnetBtc from '../../src/btc/testnet-address-based';

let btcAddressedBased: AddressBasedTestnetBtc;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {
    addressBasedTestnetBtc: {
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
describe('api/btc/testnet-address-based', () => {
  beforeEach(() => {
    btcAddressedBased = new AddressBasedTestnetBtc({ advancedLogic: mockAdvancedLogic });
  });

  it('can createExtensionsDataForCreation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.addressBasedTestnetBtc,
      'createCreationAction',
    );

    await btcAddressedBased.createExtensionsDataForCreation({ paymentAddress: 'address bitcoin' });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddPaymentInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.addressBasedTestnetBtc,
      'createAddPaymentAddressAction',
    );

    btcAddressedBased.createExtensionsDataForAddPaymentInformation({
      paymentAddress: 'address bitcoin',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('can createExtensionsDataForAddRefundInformation', async () => {
    const spy = jest.spyOn(
      mockAdvancedLogic.extensions.addressBasedTestnetBtc,
      'createAddRefundAddressAction',
    );

    btcAddressedBased.createExtensionsDataForAddRefundInformation({
      refundAddress: 'address bitcoin',
    });

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not throw when getBalance fail', async () => {
    expect(
      await btcAddressedBased.getBalance({ extensions: {} } as RequestLogicTypes.IRequest),
    ).toMatchObject({
      balance: null,
      error: {
        code: PaymentTypes.BALANCE_ERROR_CODE.WRONG_EXTENSION,
        message: 'The request does not have the extension: pn-testnet-bitcoin-address-based',
      },
      events: [],
    });
  });
});
