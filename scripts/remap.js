// From https://github.com/cryptoeconomicslab/plasma-chamber/pull/314/files#diff-0ec4dd5168ed5ffce09d1e759e322df0
/*
 * collect coverage report json to lcov
 */
const remapIstanbul = require('remap-istanbul');
const path = require('path');

const input = path.join(__dirname, '../coverage/coverage.json');
const output = path.join(__dirname, '../coverage/lcov.info');
const collector = remapIstanbul.remap(remapIstanbul.loadCoverage(input), {
  warnMissingSourceMaps: false,
});
remapIstanbul.writeReport(collector, 'lcovonly', {}, output).then(report => {
  console.log('remapping finished.');
});
