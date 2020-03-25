/* eslint-disable spellcheck/spell-checker */
/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');

const docsPath = 'docs';

module.exports = {
  introSideBar: makeSidebar('guides'),
  clientAPI: makeSidebar('client'),
};

function makeSidebar(dir) {
  const files = fs.readdirSync(path.join(docsPath, dir), { withFileTypes: true });

  return files.reduce((sidebar, file) => {
    if (file.isDirectory()) {
      sidebar.push({
        type: 'category',
        label: toTitleCase(file.name),
        items: makeSidebar(path.join(dir, file.name)),
      });
    } else if (file.name.endsWith('.js') || file.name.endsWith('.md')) {
      sidebar.push(path.join(dir, file.name.slice(0, -3)));
    }
    return sidebar;
  }, []);
}

function toTitleCase(string) {
  if (string.match(/^[0-9]+-/)) {
    string = string.slice(string.match(/^[0-9]+-/)[0].length);
  }
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/-/g, ' ');
}
