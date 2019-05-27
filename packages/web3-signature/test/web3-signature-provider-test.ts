import 'mocha';

import { Identity as IdentityTypes, Signature as SignatureTypes } from '@requestnetwork/types';

import Web3SignatureProvider from '../src/web3-signature-provider';

import Utils from '@requestnetwork/utils';

const chaiAsPromised = require('chai-as-promised');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
chai.use(chaiAsPromised);
const expect = chai.expect;
const sandbox = chai.spy.sandbox();

const id1Raw = {
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA_ETHEREUM,
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  },
};

const data = { What: 'ever', the: 'data', are: true };
const normalizedData = Utils.crypto.normalize(data);

const mockEth: any = {
  personal: {
    async sign(): Promise<any> {
      return;
    },
  },
};

/* tslint:disable:no-unused-expression */
describe('web3-signature-provider', () => {
  describe('sign', () => {
    it('can sign', async () => {
      const spy = sandbox.on(mockEth.personal, 'sign');
      const signProvider = new Web3SignatureProvider('http://localhost:8545');

      // we mock eth as ganache don't support personal.sign anymore
      signProvider.eth = mockEth;

      await signProvider.sign(data, id1Raw.identity);

      expect(spy).to.have.been.called.once;
      expect(spy).to.have.been.called.with(normalizedData, id1Raw.identity.value);
    });

    it('cannot sign with different identity than ethereum address', async () => {
      const signProvider = new Web3SignatureProvider('http://localhost:8545');

      await expect(
        signProvider.sign(data, { type: 'otherType', value: '0x' } as any),
        'should throw',
      ).to.eventually.rejectedWith('Identity type not supported otherType');
    });
  });
});
