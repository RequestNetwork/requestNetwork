import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { Wallet } from 'ethers';

import { ExtensionTypes, PaymentTypes } from '@requestnetwork/types';

import { payRequest } from '../../src/payment';

// tslint:disable: no-unused-expression
// tslint:disable: await-promise

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);

describe('payRequest', () => {
  it('paying a BTC request should fail', async () => {
    const wallet = Wallet.createRandom();
    const request: any = {
      extensions: {
        [PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED]: {
          events: [],
          id: ExtensionTypes.ID.PAYMENT_NETWORK_BITCOIN_ADDRESS_BASED,
          type: ExtensionTypes.TYPE.PAYMENT_NETWORK,
          values: {},
          version: '1.0',
        },
      },
    };
    await expect(payRequest(request, wallet)).to.be.rejectedWith(
      'Payment network pn-bitcoin-address-based is not supported',
    );
  });
});
