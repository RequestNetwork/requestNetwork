/* eslint-disable spellcheck/spell-checker */
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { RequestNetwork } from '@requestnetwork/request-client.js';
import {  PaymentTypes, SignatureTypes} from '@requestnetwork/types';
import * as chai from 'chai';
import { payee, requestData, testnetRequestData } from './btc-test-data';

const expect = chai.expect;

const signatureProvider = new EthereumPrivateKeySignatureProvider({
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
});
signatureProvider.addSignatureParameters({
  method: SignatureTypes.METHOD.ECDSA,
  privateKey: '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
});
describe('BTC detection test-suite', () => {

  it('Can create a BTC testnet payment provider request and detect the payment', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.TESTNET_BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: testnetRequestData,
      signer: payee.identity,
    });

    expect(request.getData().balance?.balance).to.be.equal('50500000');
  });

  it('Can create a BTC mainnet payment provider request and detect the payment', async () => {
    const requestNetwork = new RequestNetwork({ signatureProvider });

    const paymentNetwork: PaymentTypes.IPaymentNetworkCreateParameters = {
      id: PaymentTypes.PAYMENT_NETWORK_ID.BITCOIN_ADDRESS_BASED,
      parameters: {
        paymentAddress: '1FersucwSqufU26w9GrGz9M3KcwuNmy6a9',
      },
    };

    const request = await requestNetwork.createRequest({
      paymentNetwork,
      requestInfo: requestData,
      signer: payee.identity,
    });

    expect(request.getData().balance?.balance).to.be.equal('666743');
  });
});
