//import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
//import Utils from '@requestnetwork/utils';
import 'mocha';

//import erc20ProxyContract from '../../src/extensions/payment-network/erc20/proxy-contract';
//import exchangeRate from '../../src/extensions/payment-context-exchange-rate';

import { assert } from 'chai';

//import * as DataERC20AddPaymentAddress from '../utils/payment-network/erc20/proxy-contract-add-payment-address-data-generator';
//import * as DataERC20Create from '../utils/payment-network/erc20/proxy-contract-create-data-generator';
//import * as TestData from '../utils/test-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-context-exchange-rate', () => {
  describe('createCreationAction', () => {
    it('can create a create action', () => {
      assert.fail("TODO");
    });
    
    it('cannot createCreationAction with unsupported oracle-pair', () => {
      assert.fail("TODO");
    });
    
    it('cannot createCreationAction for an oracle-pair already described', () => {
      assert.fail("TODO");
    });

    it('cannot createCreationAction for the same currency as the request', () => {
      assert.fail("TODO");
    });

    it('cannot createCreationAction for an accepted request', () => {
      assert.fail("TODO");
    });
  });
});
