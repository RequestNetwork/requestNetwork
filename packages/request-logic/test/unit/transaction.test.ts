import {expect} from 'chai';
import 'mocha';
const bigNumber: any = require('bn.js');

import * as RequestEnum from '../../src/enum';
import Transaction from '../../src/transaction';

const payeeRaw =  {
    address: '0x818B6337657A23F58581715Fc610577292e521D0',
    privateKey: '0x4025da5692759add08f98f4b056c41c71916a671cedc7584a80d73adc7fb43c0',
    publicKey: 'cf4a1d0bbef8bf0e3fa479a9def565af1b22ea6266294061bfb430701b54a83699e3d47bf52e9f0224dcc29a02721810f1f624f1f70ea3cc5f1fb752cfed379d',
};

const payee = {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x818B6337657A23F58581715Fc610577292e521D0',
};

const payer = {
    type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x8f7E6D3AA090D5Ed7eF4882B4E59F724377f6bFF',
};

const otherId = {
        type: RequestEnum.REQUEST_LOGIC_IDENTITY_TYPE.ETHEREUM_ADDRESS,
        value: '0x212D95FcCdF0366343350f486bda1ceAfC0C2d63',
    };

const randomTx = {
    action: RequestEnum.REQUEST_LOGIC_ACTION.CREATE,
    parameters: {
        currency: RequestEnum.REQUEST_LOGIC_CURRENCY.ETH,
        expectedAmount: '100000',
        payee,
        payer,
    },
};

/* tslint:disable:no-unused-expression */
describe('Transaction', () => {
    it('can getRequestId()', () => {
        const reqId = Transaction.getRequestId(randomTx);
        expect(reqId, 'getRequestId() error').to.be.equal('0x449b29d31c10529f16831aa11b62e2297e8cadbfe45b334ffc9b098d65c5ffb7');
    });

    it('can getRoleInTransaction()', () => {
        expect(Transaction.getRoleInTransaction(payee, randomTx), 'getRoleInTransaction() error').to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYEE);
        expect(Transaction.getRoleInTransaction(payer, randomTx), 'getRoleInTransaction() error').to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.PAYER);
        expect(Transaction.getRoleInTransaction(otherId, randomTx), 'getRoleInTransaction() error').to.be.deep.equal(RequestEnum.REQUEST_LOGIC_ROLE.THIRD_PARTY);
    });

    it('can createSignedTransaction()', () => {
        const signedTx = Transaction.createSignedTransaction(randomTx, {method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA, privateKey: payeeRaw.privateKey});

        expect(signedTx.signature, 'createSignedTransaction() signature error').to.be.deep.equal({
            method: 'ecdsa',
            value: '0x7aec6042e43003dc6e080e31d6a7631f7733f7fb00c2be61e04678aa729c59932865a5c2122a0051de8c4891e87f834c6642d813a44acaeb33264228b05c1cf61c',
        });

        expect(signedTx.transaction, 'createSignedTransaction() transaction error').to.be.deep.equal(randomTx);
    });

    it('can getSignerIdentityFromSignedTransaction()', () => {
        const id = Transaction.getSignerIdentityFromSignedTransaction({
            signature: {
                method: RequestEnum.REQUEST_LOGIC_SIGNATURE_METHOD.ECDSA,
                value: '0x7aec6042e43003dc6e080e31d6a7631f7733f7fb00c2be61e04678aa729c59932865a5c2122a0051de8c4891e87f834c6642d813a44acaeb33264228b05c1cf61c',
            },
            transaction: randomTx});
        expect(id, 'recover() error').to.be.deep.equal(payee);
    });
});
