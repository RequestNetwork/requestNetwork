import { PaymentReferenceCalculator } from '@requestnetwork/payment-detection';
import * as yargs from 'yargs';
import { utils } from 'ethers';
interface IReqOptions {
  requestId: string;
  salt: string;
  address: string;
}

const calculateReferenceForRequest = (options: IReqOptions): void => {
  try {
    const paymentRef = PaymentReferenceCalculator.calculate(
      options.requestId,
      options.salt,
      options.address,
    );
    console.log('#####################################################################');
    console.log(`Payment reference: ${paymentRef}`);
    console.log('#####################################################################');
    const indexedRef = utils.keccak256(`0x${paymentRef}`);
    console.log(`Payment reference indexed: ${indexedRef}`);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error ! ${e.message}`);
    }
  }
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
