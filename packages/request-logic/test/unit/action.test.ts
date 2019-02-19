import { expect } from 'chai';
import 'mocha';

import {
  Identity as IdentityTypes,
  RequestLogic as Types,
  Signature as SignatureTypes,
  SignatureProvider as SignatureProviderTypes,
} from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import Action from '../../src/action';

import Version from '../../src/version';
const CURRENT_VERSION = Version.currentVersion;

import * as TestData from './utils/test-data-generator';

const chai = require('chai');
const spies = require('chai-spies');

chai.use(spies);

const randomUnsignedAction = {
  name: Types.REQUEST_LOGIC_ACTION_NAME.CREATE,
  parameters: {
    currency: Types.REQUEST_LOGIC_CURRENCY.ETH,
    expectedAmount: '100000',
    payee: TestData.payeeRaw.identity,
    payer: TestData.payerRaw.identity,
  },
  version: CURRENT_VERSION,
};
const signedAction = {
  data: randomUnsignedAction,
  signature: {
    method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
    value:
      '0xbcf77e28b615620636cefbad5bc6abf8324aad610581d7cec0394da216da12f063332e0a03a337a6352665c421b11ab187e515bd3518eeb12f42f8c64eb44c6e1b',
  },
};

const fakeSignatureProvider: SignatureProviderTypes.ISignatureProvider = {
  sign: chai.spy((data: any) => ({ data, signature: TestData.fakeSignature })),
  supportedIdentityTypes: chai.spy.returns([IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS]),
  supportedMethods: chai.spy.returns([SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA]),
};

/* tslint:disable:no-unused-expression */
describe('Action', () => {
  it('can getRequestId()', () => {
    const reqId = Action.getRequestId(signedAction);
    expect(reqId, 'getRequestId() error').to.be.equal(
      Utils.crypto.normalizeKeccak256Hash(randomUnsignedAction),
    );
  });

  it('can getRoleInAction()', () => {
    expect(
      Action.getRoleInAction(TestData.payeeRaw.identity, signedAction),
      'getRoleInAction() error',
    ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.PAYEE);
    expect(
      Action.getRoleInAction(TestData.payerRaw.identity, signedAction),
      'getRoleInAction() error',
    ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.PAYER);
    expect(
      Action.getRoleInAction(TestData.otherIdRaw.identity, signedAction),
      'getRoleInAction() error',
    ).to.be.deep.equal(Types.REQUEST_LOGIC_ROLE.THIRD_PARTY);
  });

  it('can createAction()', () => {
    const action = Action.createAction(
      randomUnsignedAction,
      TestData.payeeRaw.identity,
      fakeSignatureProvider,
    );

    expect(fakeSignatureProvider.sign).to.have.been.called.with(
      randomUnsignedAction,
      TestData.payeeRaw.identity,
    );

    expect(action, 'createAction() action error').to.be.deep.equal({
      data: randomUnsignedAction,
      signature: TestData.fakeSignature,
    });
  });

  it('can isActionVersionSupported()', () => {
    expect(
      Action.isActionVersionSupported(signedAction),
      'isActionVersionSupported() must returns true',
    ).to.be.true;

    const wrongVersionAction = Utils.deepCopy(signedAction);
    wrongVersionAction.data.version = '10.0.0';

    expect(
      Action.isActionVersionSupported(wrongVersionAction),
      'isActionVersionSupported() must returns false',
    ).to.be.false;
  });

  it('can getVersionFromAction()', () => {
    expect(Action.getVersionFromAction(signedAction), 'getVersionFromAction() error').to.be.equal(
      CURRENT_VERSION,
    );
  });
});
