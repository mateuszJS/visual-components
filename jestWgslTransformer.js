/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

module.exports = {
  process(sourceText, sourcePath, options) {
    return {
      code: `module.exports = \`${sourceText}\`;`,
    };
  },
};
