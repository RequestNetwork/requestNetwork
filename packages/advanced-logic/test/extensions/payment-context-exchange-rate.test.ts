//import { ExtensionTypes, RequestLogicTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import 'mocha';

//import erc20ProxyContract from '../../src/extensions/payment-network/erc20/proxy-contract';
import exchangeRate from '../../src/extensions/payment-context-exchange-rate';

import { expect, assert } from 'chai';

//import * as DataERC20AddPaymentAddress from '../utils/payment-network/erc20/proxy-contract-add-payment-address-data-generator';
//import * as DataERC20Create from '../utils/payment-network/erc20/proxy-contract-create-data-generator';
import * as TestData from '../utils/pc-exchange-rate-data-generator';

/* tslint:disable:no-unused-expression */
describe('extensions/payment-context-exchange-rate', () => {
  describe('createCreationAction', () => {
    it('can create a create action', () => {
      const requestCreatedNoExtensionBefore = Utils.deepCopy(TestData.requestCreatedNoExtension);
      const previousState = {};
      const newExtensionState = exchangeRate.applyActionToExtension(
        previousState,
        TestData.createPcExchangeRateUSDC,
        requestCreatedNoExtensionBefore,
        TestData.otherIdRaw.identity,
        TestData.arbitraryTimestamp,
      );

      expect(newExtensionState, 'newExtensionState wrong').to.deep.equal(
        TestData.exchangeRateUsdcState,
      );
    });
        
    it('cannot createCreationAction for an currency already described', () => {
      // Actually the transaction should just be ignored
      const newExtensionState = exchangeRate.applyActionToExtension(
        // There already is a USDC-EUR payment context with the same oracle-currency duet
        TestData.pnpcUsdcState,
        TestData.createPcExchangeRateUSDC,
        TestData.requestUsdcEur,
        TestData.otherIdRaw.identity,
        TestData.arbitraryTimestamp,
      );
      assert.fail(() => {
        exchangeRate.applyActionToExtension(
          newExtensionState,
          TestData.createPcExchangeRateUSDC,
          TestData.requestUsdcEur,
          TestData.otherIdRaw.identity,
          TestData.arbitraryTimestamp,
        )
      });
    });

    it('cannot createCreationAction for the same currency as the request', () => {
      assert.fail("TODO");
    });

    it('cannot createCreationAction by the payer', () => {
      assert.fail("TODO");
    });
    
    it('cannot createCreationAction for an accepted request', () => {
      assert.fail("TODO");
    });

  });
});
