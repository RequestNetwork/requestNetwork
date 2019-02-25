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
      id: 'pn-testnet-bitcoin-address-based',
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
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
  timestamp: 1549953337,
};

export const data = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters,
  version: '0.1.0',
};

export const signature: SignatureTypes.ISignature = {
  method: SignatureTypes.METHOD.ECDSA,
  value:
    '0x5bf14cb6c310a48b268c42c9c67deda6edbe57c5eb0a0e1d7fbed1faef8a3b082a3e064efb3f8097fa292e6554b71e811e0df49c70434959c60a36173dd795841b',
};
export const action: RequestLogicTypes.IAction = {
  data,
  signature,
};

export const anotherSignature: SignatureTypes.ISignature = {
  method: SignatureTypes.METHOD.ECDSA,
  value:
    '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
};
export const anotherCreationAction: RequestLogicTypes.IAction = {
  data,
  signature: anotherSignature,
};

export const actionCreationSecondRequest: RequestLogicTypes.IAction = {
  data: {
    name: RequestLogicTypes.ACTION_NAME.CREATE,
    parameters: {
      currency: 'ETH',
      expectedAmount: '123400000000000000',
      payee: {
        type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
        value: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
      },
      timestamp: 1544426030,
    },
    version: '0.1.0',
  },
  signature: {
    method: SignatureTypes.METHOD.ECDSA,
    value:
      '0x2a9209322d8e5d6e0759c03e9274b1626a1a75151d4c75399cb947282c07085c77c81503054f5a2e52eb62069ac05399c19944d602b4693165f8bb2b058d20b41b',
  },
};
