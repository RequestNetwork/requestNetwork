import PaymentReferenceCalculator from '../../../src/api/payment-network/payment-reference-calculator';

import 'chai';
import { expect } from 'chai';
import 'mocha';

/* tslint:disable:no-unused-expression */
describe('api/eth/payment-reference-calculator', () => {
  it('can calculate the payment reference', async () => {
    const expected = 'a0098add01acc736';
    const actual = PaymentReferenceCalculator.calculate('01847474747474', '8d03ea7', '0x000001');

    expect(actual).to.equal(expected);
  });

  it('should throw if a parameter is missing', async () => {
    const expectedErrorMessage =
      'RequestId, salt and address are mandatory to calculate the payment reference';
    expect(() => PaymentReferenceCalculator.calculate('', '8d03ea7', '0x000001')).to.throw(
      expectedErrorMessage,
    );

    expect(() => PaymentReferenceCalculator.calculate('01847474747474', '', '0x000001')).to.throw(
      expectedErrorMessage,
    );

    expect(() => PaymentReferenceCalculator.calculate('01847474747474', '8d03ea7', '')).to.throw(
      expectedErrorMessage,
    );
  });
});
