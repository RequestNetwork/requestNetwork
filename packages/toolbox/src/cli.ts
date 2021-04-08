#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-expressions */

import yargs = require('yargs');
import {
  chainlinkAggregatorsCommandModule,
  currencyHashCommandModule,
} from './chainlinkConversionPathTools';

yargs
  .scriptName('request-toolbox')
  .commandDir('./commands', {
    extensions: process.env.NODE_ENV === 'development' ? ['ts'] : ['js'],
    recurse: true,
  })
  .env('RN')
  .command(chainlinkAggregatorsCommandModule)
  .command(currencyHashCommandModule)
  .demandCommand()
  .help()
  .version(false).argv;
