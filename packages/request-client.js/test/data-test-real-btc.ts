import {
  IdentityTypes,
  RequestLogicTypes,
  SignatureTypes,
  TransactionTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

const payee = {
  identity: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  signatureParams: {
    method: SignatureTypes.METHOD.ECDSA,
    privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  },
};

export const arbitraryTimestamp = 1549953337;

export const parameters: RequestLogicTypes.ICreateParameters = {
  currency: {
    network: 'mainnet',
    type: RequestLogicTypes.CURRENCY.BTC,
    value: 'BTC',
  },
  expectedAmount: '100000000000',
  extensionsData: [
    {
      action: 'create',
      id: 'pn-bitcoin-address-based',
      parameters: {
        paymentAddress: '1FersucwSqufU26w9GrGz9M3KcwuNmy6a9',
      },
      version: '0.1.0',
    },
  ],
  payee: payee.identity,
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0xf17f52151ebef6c7334fad080c5704d77216b732',
  },
  timestamp: 1549956270,
};

export const data = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters,
  version: '2.0.3',
};

export const action: RequestLogicTypes.IAction = Utils.signature.sign(data, payee.signatureParams);

export const timestampedTransaction: TransactionTypes.ITimestampedTransaction = {
  state: TransactionTypes.TransactionState.PENDING,
  timestamp: arbitraryTimestamp,
  transaction: { data: JSON.stringify(action) },
};
