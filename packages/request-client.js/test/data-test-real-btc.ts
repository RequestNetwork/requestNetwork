import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';

export const parameters: RequestLogicTypes.ICreateParameters = {
  currency: RequestLogicTypes.CURRENCY.BTC,
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
  payee: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
  timestamp: 1549956270,
};

export const data = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters,
  version: '0.1.0',
};

export const signature: SignatureTypes.ISignature = {
  method: SignatureTypes.METHOD.ECDSA,
  value:
    '0x3f2b20a14eedd019ae4094793be5290c40125af372fc7e3939f0a8c146db32d570c5a304987f0db6e75eede6a65bb2522c39d7696b8013cb8b0f933870bd2a741c',
};
export const action: RequestLogicTypes.IAction = {
  data,
  signature,
};
