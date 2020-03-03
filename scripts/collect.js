// From https://github.com/cryptoeconomicslab/plasma-chamber/pull/314/files#diff-0ec4dd5168ed5ffce09d1e759e322df0
/*
 * collect coverage report files
 */
const fs = require('fs');
const path = require('path');

function getSrc(module) {
  return path.join(__dirname, `../packages/${module}/coverage/coverage-final.json`);
}

function getDest(module) {
  return path.join(__dirname, `../coverage/${module}.json`);
}

[
  'advanced-logic',
  'data-access',
  'data-format',
  'epk-signature',
  'ethereum-storage',
  'payment-processor',
  'request-client.js',
  'request-logic',
  'request-node',
  'transaction-manager',
  'utils',
  'web3-signature',
].map(m => {
  fs.copyFileSync(getSrc(m), getDest(m));
});
