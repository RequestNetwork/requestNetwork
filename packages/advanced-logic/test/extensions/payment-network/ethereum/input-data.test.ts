import { ExtensionTypes } from '@requestnetwork/types';
import 'mocha';

import ethereumInputData from '../../../../src/extensions/payment-network/ethereum/input-data';

import { expect } from 'chai';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-network/ethereum/input-data', () => {
  describe('createCreationAction', () => {
    it('can create a create action', () => {
      expect(
        ethereumInputData.createCreationAction({
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        }),
        'extensionsdata is wrong',
      ).to.deep.equal({
        action: 'create',
        id: ExtensionTypes.ID.PAYMENT_NETWORK_ETH_INPUT_DATA,
        parameters: {
          paymentAddress: '0x0000000000000000000000000000000000000001',
          refundAddress: '0x0000000000000000000000000000000000000002',
          salt: 'ea3bc7caf64110ca',
        },
        version: '0.1.0',
      });
    });
  });
});
