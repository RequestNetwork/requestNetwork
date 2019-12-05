import EthInfoRetriever from '../../../../src/api/payment-network/eth/info-retriever';
import PaymentReferenceCalculator from '../../../../src/api/payment-network/eth/payment-reference-calculator';
import * as Types from '../../../../src/types';

import { expect } from 'chai';
import 'mocha';

describe('api/eth/info-retriever', () => {
  // In this test, we're looking this transaction:
  //  https://etherscan.io/tx/0x0de1759d8b246939e370e1d0509e3ed6f1d5f4f5b79735636c0283b64ff6f5ed
  it('can get the balance of an address', async () => {
    const paymentAddress = '0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB';
    const paymentReference = PaymentReferenceCalculator.calculate(
      '01000',
      '1234567890123456',
      paymentAddress,
    ); // 21de5f63f12efd71

    const infoRetriever = new EthInfoRetriever(
      paymentAddress,
      Types.EVENTS_NAMES.PAYMENT,
      'mainnet',
      paymentReference,
    );
    const events = await infoRetriever.getTransferEvents();

    // If this assertion fails, another transaction with the data `21de5f63f12efd71`
    //  has been set to the address `0xc12F17Da12cd01a9CDBB216949BA0b41A6Ffc4EB`
    expect(events).to.have.lengthOf(1);

    expect(events[0].name).to.equal('payment');
    expect(events[0].amount).to.equal('33');
    expect(events[0].txHash).to.equal(
      '0x0de1759d8b246939e370e1d0509e3ed6f1d5f4f5b79735636c0283b64ff6f5ed',
    );
    expect(events[0].timestamp).to.be.a('number');
    expect(events[0].parameters!.confirmations).to.be.a('number');
  });

  it('throws when trying to use it in local', async () => {
    const infoRetreiver = new EthInfoRetriever(
      '0x01',
      Types.EVENTS_NAMES.PAYMENT,
      'private',
      '12345',
    );
    expect(infoRetreiver.getTransferEvents()).to.be.rejectedWith(Error);
  });
});
