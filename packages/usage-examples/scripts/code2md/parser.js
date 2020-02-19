'use strict';

const MARKER_START = '/**';
const MARKER_START_SKIP = '/***';
const MARKER_END = '*/';

/**
 * Produces `extract` function with internal state initialized
 */
function makeExtract() {
  let chunk = null;
  let indent = 0;
  let number = 0;

  /**
   * Read lines until they make a block of comments
   * Return parsed block once fulfilled or null otherwise
   */
  return function extract(line) {
    let result = null;
    const start = line.indexOf(MARKER_START);
    const end = line.indexOf(MARKER_END);

    // if open marker detected and it's not, skip one
    if (start !== -1 && line.indexOf(MARKER_START_SKIP) !== start) {
      chunk = [];
      indent = start + MARKER_START.length;
    }

    // if we are on middle of comment block
    if (chunk) {
      let lineStart = indent;
      let startWithStar = false;

      // figure out if we slice from opening marker position
      // or line start is shifted to the left
      const nonSpaceChar = line.match(/\S/);

      // skip for the first line starting with /** (fresh chunk)
      // it always has the right indentation
      if (chunk.length > 0 && nonSpaceChar) {
        if (nonSpaceChar[0] === '*') {
          const afterNonSpaceCharIndex = nonSpaceChar.index + 1;
          const extraCharIsSpace = line.charAt(afterNonSpaceCharIndex) === ' ';
          lineStart = afterNonSpaceCharIndex + (extraCharIsSpace ? 1 : 0);
          startWithStar = true;
        } else if (nonSpaceChar.index < indent) {
          lineStart = nonSpaceChar.index;
        }
      }

      // slice the line until end or until closing marker start
      chunk.push(line.slice(lineStart, end === -1 ? line.length : end));

      // finalize block if end marker detected
      if (end !== -1) {
        result = { docs: parse_block(chunk) };
        chunk = null;
        indent = 0;
      }
    } else {
      result = { code: line };
    }

    return result;
  };
}

/**
 * Parses an array of strings into a string
 *
 * @param {string[]} source
 */
function parse_block(source) {
  const sourceString = source
    .map(line => {
      return line.trim();
    })
    .join('\n');

  return sourceString.trim();
}

/**
 * Parses a code string into blocks of code and markdown
 * @param {string} source
 */
function parse(source) {
  const blocks = [];
  const extract = makeExtract();
  const lines = source.split(/\n/);
  let codeBlocks = [];

  lines.forEach(line => {
    const block = extract(line);
    if (block && block.docs) {
      blocks.push(block.docs);
      if (codeBlocks.length) {
        blocks.push('\n```\n' + codeBlocks.join('\n') + '\n```\n');
        codeBlocks = [];
      }
    }
    if (block && block.code) {
      codeBlocks.push(block.code);
    }
  });
  if (codeBlocks.length) {
    blocks.push('\n```\n' + codeBlocks.join('\n') + '\n```\n');
  }

  return blocks;
}

module.exports = parse;
