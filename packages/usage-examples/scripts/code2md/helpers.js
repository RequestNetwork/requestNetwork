/**
 * Find title of md file in # or === format
 */
module.exports.findTitle = function findTitle(content) {
  const regex = /^#(.*)$|^(.*)\n[=]+/;
  const match = content.match(regex);

  if (match && (match[1] || match[2])) {
    return match[1] || match[2];
  }
};

/**
 * Generate a md file header
 */
module.exports.generateHeader = function generateHeader(title) {
  return `---
  title: ${title}
  sidebar_label: ${title}
---
  `;
};
