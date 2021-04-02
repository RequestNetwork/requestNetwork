import yargs = require('yargs');
import CreateRequest from './create-request';

// Exports the functions so that can be imported from other packages
export default {
  CreateRequest,
};

// With yargs, options can be passed as command line options (--my-option),
//  or environment variables (RN_MY_OPTION)
yargs
  .env('RN')
  .command(chainlinkAggregatorsCommandModule)
  .command(paymentCommandModule)
  .command(invoiceTrackingModule)
  .command(oneShotExportModule)
  .demandCommand().argv;
