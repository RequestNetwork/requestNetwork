import { IdentityTypes, SignatureTypes } from '@requestnetwork/types';

import Web3SignatureProvider from '../src/web3-signature-provider';

import Utils from '@requestnetwork/utils';

import { providers } from 'ethers';

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
const hashData = Utils.crypto.normalizeKeccak256Hash(data).value;
const signatureValueExpected = Utils.crypto.EcUtils.sign(id1Raw.signatureParams.privateKey, hashData);

const mockWeb3: any = {
  getSigner: jest.fn().mockImplementation(() => ({signMessage: () => {return signatureValueExpected;} }))
}

// use of infura only to initialize Web3SignatureProvider - but web3 is mockup afterward
const signProvider = new Web3SignatureProvider(new providers.InfuraProvider());

/* tslint:disable:no-unused-expression */
describe('web3-signature-provider', () => {
  describe('sign', () => {
    it('can sign', async () => {
      // we mock eth as ganache don't support personal.sign anymore
      signProvider.web3Provider = mockWeb3;

      await signProvider.sign(data, id1Raw.identity);

      expect(mockWeb3.getSigner).toHaveBeenCalledTimes(1);
      expect(mockWeb3.getSigner).toHaveBeenCalledWith(id1Raw.identity.value);
    });

    it('cannot sign if web3 throw', async () => {
      const mockWeb3Throw: any = {
        getSigner: () => ({signMessage: () => {throw {code: -32602};} })
      }

      // we mock eth as ganache don't support personal.sign anymore
      signProvider.web3Provider = mockWeb3Throw;

      await expect(
        signProvider.sign(data, id1Raw.identity),
      ).rejects.toThrowError(`Impossible to sign for the identity: ${id1Raw.identity.value}`);
    });

    it('cannot sign with different identity than ethereum address', async () => {
      await expect(
        signProvider.sign(data, { type: 'otherType', value: '0x' } as any),
      ).rejects.toThrowError('Identity type not supported otherType');
    });
  });
});
