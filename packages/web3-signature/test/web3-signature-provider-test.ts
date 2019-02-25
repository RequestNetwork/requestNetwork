import 'mocha';

import { Identity as IdentityTypes, Signature as SignatureTypes } from '@requestnetwork/types';

import Web3SignatureProvider from '../src/web3-signature-provider';

import Utils from '@requestnetwork/utils';

import { expect } from 'chai';

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

const nativeSignature = Utils.signature.sign(data, id1Raw.signatureParams);

/* tslint:disable:no-unused-expression */
describe('web3-signature-provider', () => {
  describe('sign', () => {
    it('can sign', async () => {
      const signProvider = new Web3SignatureProvider('http://localhost:8545');

      const signedData: SignatureTypes.ISignedData = await signProvider.sign(data, id1Raw.identity);

      expect(Utils.signature.recover(nativeSignature), 'signedData is wrong').to.be.deep.equal(
        id1Raw.identity,
      );
      expect(Utils.signature.recover(signedData), 'signedData is wrong').to.be.deep.equal(
        id1Raw.identity,
      );
    });
  });
});
