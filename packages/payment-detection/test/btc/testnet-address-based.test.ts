import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import { BtcTestnetAddressBasedDetector } from '../../src/btc/testnet-address-based';
import { mockAdvancedLogicBase } from '../utils';

let btcAddressedBased: BtcTestnetAddressBasedDetector;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  ...mockAdvancedLogicBase,
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
  } as any as AdvancedLogicTypes.IAdvancedLogicExtensions,
};

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/btc/testnet-address-based', () => {
  beforeEach(() => {
    btcAddressedBased = new BtcTestnetAddressBasedDetector({ advancedLogic: mockAdvancedLogic });
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
