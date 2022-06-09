const path = require("path");

const OFF = 0;

module.exports = {
  extends: ["../../.eslintrc.js"],
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: path.join(__dirname, "tsconfig.json"),
      },
    },
  },
  rules: {
    "no-console": OFF,
  },
};
