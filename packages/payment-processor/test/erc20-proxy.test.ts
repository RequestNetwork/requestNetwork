import 'mocha';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { Wallet } from 'ethers';

import { IdentityTypes } from '@requestnetwork/types';
import { CURRENCY, STATE } from '@requestnetwork/types/dist/request-logic-types';

import { payErc20ProxyRequest } from '../src/payment/erc20-proxy';

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(spies);

const baseRequest = {
  balance: {
    balance: '0',
    events: [],
  },
  contentData: {},
  events: [],
  extensions: {},
  extensionsData: [],
  meta: {
    transactionManagerMeta: {},
  },
  requestId: '',
  state: STATE.CREATED,
  timestamp: 0,
  version: '1.0',
};

describe('payErc20ProxyRequest', () => {
  it('should throw an error if the request is not erc20', async () => {
    const wallet = Wallet.createRandom();
    expect(
      payErc20ProxyRequest(
        {
          creator: {
            type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
            value: wallet.address,
          },
          currency: 'ETH',
          currencyInfo: {
            network: 'rinkeby',
            type: CURRENCY.ETH,
            value: '',
          },
          expectedAmount: '0',
          ...baseRequest,
        },
        wallet,
      ),
    ).to.eventually.be.rejectedWith(
      'request cannot be processed, or is not an ERC20 PROXY CONTRACT request',
    );
  });
});
