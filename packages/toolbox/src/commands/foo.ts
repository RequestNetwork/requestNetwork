import { RequestNetwork } from '@requestnetwork/request-client.js';
import { Wallet } from 'ethers';

import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { EthereumPrivateKeyDecryptionProvider } from '@requestnetwork/epk-decryption';
import {
  SignatureTypes,
  EncryptionTypes,
  IdentityTypes,
  PaymentTypes,
} from '@requestnetwork/types';
import { ICreateRequestParameters } from 'types/dist/client-types';

export const command = 'foo';
export const describe = '';

export const handler = async (): Promise<void> => {
  const wallet = Wallet.createRandom();
  const rn = new RequestNetwork({
    nodeConnectionConfig: {
      baseURL: 'http://localhost:3200',
    },
    decryptionProvider: new EthereumPrivateKeyDecryptionProvider({
      method: EncryptionTypes.METHOD.ECIES,
      key: wallet.privateKey,
    }),
    signatureProvider: new EthereumPrivateKeySignatureProvider({
      method: SignatureTypes.METHOD.ECDSA,
      privateKey: wallet.privateKey,
    }),
  });
  const params: ICreateRequestParameters = {
    requestInfo: {
      currency: 'EUR',
      expectedAmount: '3000',
      payee: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: wallet.address,
      },
      payer: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0xFc2899f92F493291585E53FfDC29204bC4D29e78',
      },
      timestamp: 1650280613,
      nonce: '395cf9a49275ebc6cb6e' as any,
    },
    contentData: {
      //      id: 625d48a4b8401e6a5fd17dc3,
      creationDate: new Date('2022-04-18T11:16:52.881Z').toISOString(),
      currency: 'EUR',
      employeeInfo: {
        email: 'employee@request.network',
        firstName: 'The',
        lastName: 'Employee',
      },
      employerInfo: {
        email: 'employer@request.network',
        firstName: 'Joe',
        lastName: 'Bloggs',
        businessName: null,
      },
      // expenseItems: [ [Object], [Object] ],
      meta: { format: 'rnf_expense', version: '0.1.0' },
      paymentCurrency: 'USDT-mainnet',
      periodStartDate: new Date('2022-04-18T11:16:51.894Z').toISOString(),
      periodEndDate: new Date('2022-04-18T11:16:51.894Z').toISOString(),
      status: 'created',
      type: 'test',
      paymentAddress: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
    },
    paymentNetwork: {
      id: PaymentTypes.PAYMENT_NETWORK_ID.ANY_TO_ERC20_PROXY,
      parameters: {
        feeAddress: '0x35d0e078755Cd84D3E0656cAaB417Dee1d7939c7',
        feeAmount: '3',
        acceptedTokens: ['0xdac17f958d2ee523a2206206994597c13d831ec7'],
        network: 'mainnet',
        paymentAddress: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
        salt: 'cdd72187ce9d56d1',
      },
    },
    signer: {
      type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
      value: wallet.address,
    },
    disablePaymentDetection: true,
  };
  const requestId = await rn.computeRequestId(params);
  console.log(requestId);
  const request = await rn._createEncryptedRequest(params, [
    { method: EncryptionTypes.METHOD.ECIES, key: wallet.publicKey },
  ]);
  console.log(requestId, request);
};
