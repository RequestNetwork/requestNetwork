import CreateRequest from '../../create-request';

export const command = 'request create [amount]';
export const describe = 'Create a test request';
export const builder = {
  amount: {
    default: '1000',
  },
};
// tslint:disable:no-console
export const handler = (argv: any): void => {
  console.log(`Create request with amount ${argv.amount}`);
  CreateRequest.createTestRequest(argv.amount)
    .then(request => console.log(`Request created with requestId ${request.requestId}`))
    .catch(x => console.error(x.message));
};
