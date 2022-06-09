const path = require("path");

/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "simple-import-sort", "prettier"],
  extends: ["plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 12,
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
      },
      typescript: {
        project: path.join(__dirname, "tsconfig.json"),
      },
    },
  },
  rules: {
    camelcase: "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
};
