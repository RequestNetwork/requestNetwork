import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import * as yargs from 'yargs';

interface IReqOptions {
  requestId: string;
  salt: string;
  address: string;
}

const calculateReferenceForRequest = (options: IReqOptions): string => {
  const paymentRef = PaymentReferenceCalculator.calculate(
    options.requestId,
    options.salt,
    options.address,
  );
  return paymentRef;
};

export const command = 'calculateReference <requestId> <salt> <address>';
export const describe = 'Calculates the payment reference from requestId, salt and address';
export const builder = (): yargs.Argv<IReqOptions> =>
  yargs.options({
    requestId: {
      demand: true,
      type: 'string',
      desc: 'Request ID',
    },
    salt: {
      demand: true,
      type: 'string',
      desc: 'Salt used for request creation',
    },
    address: {
      demand: true,
      type: 'string',
      desc: 'Address used for request creation',
    },
  });
export const handler = calculateReferenceForRequest;
