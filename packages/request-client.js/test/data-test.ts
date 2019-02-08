import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';

export const parameters: RequestLogicTypes.IRequestLogicCreateParameters = {
  currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.BTC,
  expectedAmount: '100000000000',
  extensionsData: [
    {
      action: 'create',
      id: 'pn-bitcoin-address-based',
      parameters: {
        paymentAddress: 'mgPKDuVmuS9oeE2D9VPiCQriyU14wxWS1v',
      },
      version: '0.1.0',
    },
  ],
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

export const data = {
  name: RequestLogicTypes.REQUEST_LOGIC_ACTION_NAME.CREATE,
  parameters,
  version: '0.1.0',
};

export const signature: SignatureTypes.ISignature = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  value:
    '0x238d62053182751d91e5eaf970bc57d396b5b3ce666abccaed6224e3d62f4b2f57b56cf1c83d35024076df85574d27b028be633725bebba250dae1bad4a504be1b',
};
export const action: RequestLogicTypes.IRequestLogicAction = {
  data,
  signature,
};
