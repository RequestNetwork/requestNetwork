#!/usr/bin/env node
import * as yargs from 'yargs';
import {
  chainlinkAggregatorsCommandModule,
  currencyHashCommandModule,
} from './chainlinkConversionPathTools';

yargs
  .env('RN')
  .scriptName('request-toolbox')
  .commandDir('./commands', {
    extensions: process.env.NODE_ENV === 'development' ? ['ts'] : ['js'],
    recurse: true,
  })
  .command(chainlinkAggregatorsCommandModule)
  .command(currencyHashCommandModule)
  .demandCommand()
  .help()
  .version(false).argv;
