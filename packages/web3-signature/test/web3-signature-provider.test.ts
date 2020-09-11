import { IdentityTypes, SignatureTypes } from '@requestnetwork/types';

import Web3SignatureProvider from '../src/web3-signature-provider';

import Utils from '@requestnetwork/utils';

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
      const spy = jest.spyOn(mockEth.personal, 'sign');
      const signProvider = new Web3SignatureProvider('http://localhost:8545');

      // we mock eth as ganache don't support personal.sign anymore
      signProvider.eth = mockEth;

      await signProvider.sign(data, id1Raw.identity);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(normalizedData, id1Raw.identity.value);
    });

    it('cannot sign with different identity than ethereum address', async () => {
      const signProvider = new Web3SignatureProvider('http://localhost:8545');

      await expect(
        signProvider.sign(data, { type: 'otherType', value: '0x' } as any),
      ).rejects.toThrowError('Identity type not supported otherType');
    });
  });
});
