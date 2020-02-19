const parse = require('./parser');
const { findTitle, generateHeader } = require('./helpers.js');

/**
 * Converts the code string to a markdown string
 * @param {string} content
 */
function code2Md(content) {
  const parsedArray = parse(content);
  let output = parsedArray.join('\n');

  if (output) {
    const title = findTitle(output);
    if (title) {
      const header = generateHeader(title);
      output = header + output;
    }
  }

  return output;
}

module.exports = code2Md;

/**
 * If loaded from the command line.
 *
 * Options:
 * --out: the output path (default to 'docs')
 *
 * All arguments will be parsed as files.
 */
const fromCLI = !module.parent;
if (fromCLI) {
  const fs = require('fs');
  const mkdirp = require('mkdirp');
  const path = require('path');
  const argv = require('minimist')(process.argv.slice(2));

  const out = argv.out || 'docs';
  mkdirp.sync(out);

  argv._.forEach(filePath => {
    if (fs.lstatSync(filePath).isDirectory()) {
      return;
    }
    const fileContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const md = code2Md(fileContent);
    fs.writeFileSync(path.join(out, path.basename(filePath, '.ts') + '.md'), md);
  });

  console.log('Done');
}
