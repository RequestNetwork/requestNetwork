#!/usr/bin/env node

// tslint:disable:no-unused-expression
/* eslint-disable spellcheck/spell-checker */
require('yargs')
  .scriptName('request-toolbox')
  .commandDir('./commands', {
    extensions: process.env.NODE_ENV === 'development' ? ['ts'] : ['js'],
    recurse: true,
  })
  .demandCommand()
  .help()
  .version(false).argv;
