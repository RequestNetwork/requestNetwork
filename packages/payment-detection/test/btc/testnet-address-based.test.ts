import { AdvancedLogicTypes, PaymentTypes, RequestLogicTypes } from '@requestnetwork/types';

import AddressBasedTestnetBtc from '../../src/btc/testnet-address-based';

let btcAddressedBased: AddressBasedTestnetBtc;

const mockAdvancedLogic: AdvancedLogicTypes.IAdvancedLogic = {
  applyActionToExtensions(): any {
    return;
  },
  extensions: {}
};

// Most of the tests are done as integration tests in ../index.test.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('api/btc/testnet-address-based', () => {
  beforeEach(() => {
    btcAddressedBased = new AddressBasedTestnetBtc({ advancedLogic: mockAdvancedLogic });
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
