import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
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
  payee: payee.identity,
  payer: {
    type: IdentityTypes.TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
  timestamp: 1549956270,
};

export const data = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters,
  version: '2.0.0',
};

export const action: RequestLogicTypes.IAction = Utils.signature.sign(data, payee.signatureParams);
