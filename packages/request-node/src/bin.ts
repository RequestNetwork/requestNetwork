#!/usr/bin/env node
/* eslint-disable no-console */

import * as config from './config';
import { startNode } from './server';

// If -h option is used, commands are printed
// Otherwise the node is started
if (config.isHelp()) {
  console.log(config.getHelpMessage());
} else {
  console.log(config.getConfigDisplay());
  startNode().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
