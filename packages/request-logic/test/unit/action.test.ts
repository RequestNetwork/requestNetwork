/* eslint-disable spellcheck/spell-checker */
import MultiFormat from '@requestnetwork/multi-format';
import {
  IdentityTypes,
  RequestLogicTypes,
  SignatureProviderTypes,
  SignatureTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Action from '../../src/action';
import CreateAction from '../../src/actions/create';
import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from './utils/test-data-generator';

const randomUnsignedAction = {
  name: RequestLogicTypes.ACTION_NAME.CREATE,
  parameters: {
    currency: {
      type: RequestLogicTypes.CURRENCY.ETH,
      value: 'ETH',
    },
    expectedAmount: '100000',
    payee: TestData.payeeRaw.identity,
    payer: TestData.payerRaw.identity,
  },
  version: CURRENT_VERSION,
};
const signedAction = {
  data: randomUnsignedAction,
  signature: {
    method: SignatureTypes.METHOD.ECDSA,
    value:
      '01bcf77e28b615620636cefbad5bc6abf8324aad610581d7cec0394da216da12f063332e0a03a337a6352665c421b11ab187e515bd3518eeb12f42f8c64eb44c6e1b',
  },
};

const fakeSignatureProvider: SignatureProviderTypes.ISignatureProvider = {
  sign: jest.fn((data: any) => Promise.resolve({ data, signature: TestData.fakeSignature })),
  supportedIdentityTypes: [IdentityTypes.TYPE.ETHEREUM_ADDRESS],
  supportedMethods: [SignatureTypes.METHOD.ECDSA],
};

/* tslint:disable:no-unused-expression */
describe('Action', () => {
  it('can getRequestId() of current version', () => {
    const reqId = Action.getRequestId(signedAction);
    expect(reqId).toBe(MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(signedAction)));
  });
  it('can getRequestId() of version before or equal 2.0.0', () => {
    const randomUnsignedAction200 = {
      name: RequestLogicTypes.ACTION_NAME.CREATE,
      parameters: {
        currency: {
          type: RequestLogicTypes.CURRENCY.ETH,
          value: 'ETH',
        },
        expectedAmount: '100000',
        payee: TestData.payeeRaw.identity,
        payer: TestData.payerRaw.identity,
      },
      version: '2.0.0',
    };
    const signedAction200 = {
      data: randomUnsignedAction200,
      signature: {
        method: SignatureTypes.METHOD.ECDSA,
        value:
          '01bcf77e28b615620636cefbad5bc6abf8324aad610581d7cec0394da216da12f063332e0a03a337a6352665c421b11ab187e515bd3518eeb12f42f8c64eb44c6e1b',
      },
    };

    const reqId = Action.getRequestId(signedAction200);
    expect(reqId).toBe(
      MultiFormat.serialize(Utils.crypto.normalizeKeccak256Hash(randomUnsignedAction200)),
    );
  });

  it('can getRoleInAction()', () => {
    expect(Action.getRoleInAction(TestData.payeeRaw.identity, signedAction)).toBe(
      RequestLogicTypes.ROLE.PAYEE,
    );
    expect(Action.getRoleInAction(TestData.payerRaw.identity, signedAction)).toBe(
      RequestLogicTypes.ROLE.PAYER,
    );
    expect(Action.getRoleInAction(TestData.otherIdRaw.identity, signedAction)).toBe(
      RequestLogicTypes.ROLE.THIRD_PARTY,
    );
  });

  it('can createAction()', async () => {
    const action = Action.createAction(
      randomUnsignedAction,
      TestData.payeeRaw.identity,
      fakeSignatureProvider,
    );

    expect(fakeSignatureProvider.sign).toHaveBeenCalledWith(
      randomUnsignedAction,
      TestData.payeeRaw.identity,
    );

    await expect(action).resolves.toMatchObject({
      data: randomUnsignedAction,
      signature: TestData.fakeSignature,
    });
  });

  it('can isActionVersionSupported()', () => {
    expect(Action.isActionVersionSupported(signedAction)).toBeTruthy();

    const wrongVersionAction = Utils.deepCopy(signedAction);
    wrongVersionAction.data.version = '10.0.0';

    expect(Action.isActionVersionSupported(wrongVersionAction)).toBeFalsy();
  });

  it('can getVersionFromAction()', () => {
    expect(Action.getVersionFromAction(signedAction)).toBe(CURRENT_VERSION);
  });
});

describe('actions retrocompatibility', () => {
  it('old format requestId match', async () => {
    const actionData = {
      name: RequestLogicTypes.ACTION_NAME.CREATE,
      parameters: {
        currency: 'ETH',
        expectedAmount: '123400000000000000',
        payee: TestData.payeeRaw.identity,
        timestamp: 1,
      },
      version: '2.0.1',
    };

    const action = await Action.createAction(
      actionData,
      TestData.payeeRaw.identity,
      TestData.fakeSignatureProvider,
    );

    const request = CreateAction.createRequest(action, 2);

    expect(Action.getRequestId(action)).toBe(request.requestId);
  });
});
