#!/usr/bin/env node
import * as yargs from 'yargs';

yargs
  .env('RN')
  .scriptName('request-toolbox')
  .commandDir('./commands', {
    extensions: process.env.NODE_ENV === 'development' ? ['ts'] : ['js'],
    recurse: true,
  })
  .demandCommand()
  .help()
  .version(false).argv;
