const path = require("path");

const OFF = 0;

/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  // Define the environment
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  // Use recommended Prettier configuration
  extends: ["plugin:prettier/recommended"],
  // Use TypeScript parser
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
  },
  // Define ESLint plugins.
  plugins: ["@typescript-eslint", "prettier", "simple-import-sort", "sort-keys-fix", "typescript-sort-keys"],
  // Define ESLint rules
  rules: {
    // Enable sorting of type union/intersection members
    "@typescript-eslint/sort-type-union-intersection-members": "error",
    // Disable camelcase rule
    camelcase: "off",
    // Disable no-console rule
    "no-console": OFF,
    // Enable sorting of exports
    "simple-import-sort/exports": "error",
    // Enable sorting of imports
    "simple-import-sort/imports": "error",
    // Enable sorting of object keys
    "sort-keys-fix/sort-keys-fix": "error",
    // Enable sorting of interface keys
    "typescript-sort-keys/interface": "error",
    // Enable sorting of string enum keys
    "typescript-sort-keys/string-enum": "error",
  },
  // Define ESLint settings
  settings: {
    // Configure import parser for TypeScript
    "import/parsers": {
      "@typescript-eslint/parser": [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
    },
    // Configure import resolver for TypeScript
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
      },
      // Specify the TypeScript project path
      typescript: {
        project: path.join(__dirname, "tsconfig.json"),
      },
    },
  },
};
