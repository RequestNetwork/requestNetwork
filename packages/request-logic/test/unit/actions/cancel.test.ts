import { expect } from 'chai';
import 'mocha';

import * as RequestEnum from '../../../src/enum';
import RequestLogic from '../../../src/requestLogic';

// payee id
const payeeRaw = {
  address: '0xAf083f77F1fFd54218d91491AFD06c9296EaC3ce',
  privateKey: '0x04674d2e53e0e14653487d7323cc5f0a7959c83067f5654cafe4094bde90fa8a',
  publicKey:
    '299708c07399c9b28e9870c4e643742f65c94683f35d1b3fc05d0478344ee0cc5a6a5e23f78b5ff8c93a04254232b32350c8672d2873677060d5095184dad422',
};

// payer id
const payerRaw = {
  address: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  privateKey: '0x0906ff14227cead2b25811514302d57706e7d5013fcc40eca5985b216baeb998',
  publicKey:
    '9008306d319755055226827c22f4b95552c799bae7af0e99780cf1b5500d9d1ecbdbcf6f27cdecc72c97fef3703c54b717bca613894212e0b2525cbb2d1161b9',
};

// another id
const otherIdRaw = {
  address: '0x818B6337657A23F58581715Fc610577292e521D0',
  privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
  publicKey:
    'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

/* tslint:disable:no-unused-expression */
describe('actions/cancel', () => {
  it('can cancel without extensions', () => {
    const requestIdMock = '0x123456789123456789123456798132456789';
    const txCancel = RequestLogic.formatCancel(
      {
        requestId: requestIdMock,
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey },
    );

    expect(txCancel, 'txCancel.transaction is wrong').to.have.property('transaction');
    expect(txCancel.transaction.action, 'action is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
    );
    expect(
      txCancel.transaction,
      'txCancel.transaction must have the property parameters',
    ).to.have.property('parameters');

    expect(txCancel.transaction.parameters.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(txCancel.transaction.parameters.extensions, 'extensions is wrong').to.be.undefined;

    expect(txCancel, 'txCancel.signature is wrong').to.have.property('signature');
    expect(txCancel.signature.method, 'txCancel.signature.method is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
    );
    expect(txCancel.signature.value, 'txCancel.signature.value').to.equal(
      '0x0ed331f4b89d8e5bf8e92a373b62eb8a25a89a474fc2a393fdb7511d4549d64b40ef0f729ee211db4fd0b4fe9385234799a8f87fdbe2e2f1d267fc973ddb1f071b',
    );
  });

  it('can accept with extensions', () => {
    const extensions = [{ id: 'extension1', value: 'whatever' }];
    const requestIdMock = '0x123456789123456789123456798132456789';
    const txCancel = RequestLogic.formatCancel(
      {
        extensions,
        requestId: requestIdMock,
      },
      { method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payerRaw.privateKey },
    );

    expect(txCancel, 'txCancel.transaction is wrong').to.have.property('transaction');
    expect(txCancel.transaction.action, 'action is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_ACTION.CANCEL,
    );
    expect(
      txCancel.transaction,
      'txCancel.transaction must have the property parameters',
    ).to.have.property('parameters');

    expect(txCancel.transaction.parameters.requestId, 'requestId is wrong').to.equal(requestIdMock);
    expect(txCancel.transaction.parameters.extensions, 'extensions is wrong').to.deep.equal(
      extensions,
    );

    expect(txCancel, 'txCancel.signature is wrong').to.have.property('signature');
    expect(txCancel.signature.method, 'txCancel.signature.method is wrong').to.equal(
      RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
    );
    expect(txCancel.signature.value, 'txCancel.signature.value').to.equal(
      '0x2b2449df7ac5fabb10fd9c4e1c02492c04e5d0f4d14f5fa3fcd8f619bfa5a15c3769a1ca861f0ee46edbbdb5c402eb2cf0a5bc2f4717807fd3a52d7affb5c6561c',
    );
  });
});
