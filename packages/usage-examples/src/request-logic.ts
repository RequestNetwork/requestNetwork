import { DataAccess } from '@requestnetwork/data-access';
import { EthereumPrivateKeySignatureProvider } from '@requestnetwork/epk-signature';
import { RequestLogic } from '@requestnetwork/request-logic';
import { TransactionManager } from '@requestnetwork/transaction-manager';
import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
  SignatureProvider as SignatureProviderTypes,
  Transaction as TransactionTypes,
} from '@requestnetwork/types';

import MockStorage from './mock/mock-storage';

const createParams = {
  currency: RequestLogicTypes.CURRENCY.ETH,
  expectedAmount: '170000000000',
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  timestamp: 1544426030,
};

// A signature provider, for example @requestnetwork/epk-signature
const signatureProvider: SignatureProviderTypes.ISignatureProvider = new EthereumPrivateKeySignatureProvider(
  {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  },
);

/* tslint:disable:no-console */
(async (): Promise<any> => {
  // Data access setup
  const dataAccess = new DataAccess(new MockStorage());
  await dataAccess.initialize();

  // A transaction manager, for example @requestnetwork/transaction-manager
  const transactionManager: TransactionTypes.ITransactionManager = new TransactionManager(
    dataAccess,
  );

  const requestLogic = new RequestLogic(transactionManager, signatureProvider);

  const { result } = await requestLogic.createRequest(createParams, {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  });

  return result;
})()
  .then(request => {
    console.log(request.requestId);
  })
  .catch(error => {
    console.error(error.message || error);
    process.exit(1);
  });
