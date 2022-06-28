const path = require("path");

const OFF = 0;

module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: ["../../.eslintrc.js"],
  rules: {
    "no-console": OFF,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: path.join(__dirname, "tsconfig.json"),
      },
    },
  },
};
