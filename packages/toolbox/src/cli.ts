#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-expressions */

require('yargs')
  .scriptName('request-toolbox')
  .commandDir('./commands', {
    extensions: process.env.NODE_ENV === 'development' ? ['ts'] : ['js'],
    recurse: true,
  })
  .demandCommand()
  .help()
  .version(false).argv;
