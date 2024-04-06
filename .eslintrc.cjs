module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: [
    "solid",
    "import",
    "import-essentials",
    "simple-import-sort",
    "jsdoc",
    "react-prefer-function-component",
    "@typescript-eslint",
  ],
  extends: [
    "eslint:recommended",
    "plugin:solid/typescript",
    "@unocss",
    "prettier",
  ],
  rules: {
    "no-restricted-syntax": [
      "error",
      "ForInStatement",
      "LabeledStatement",
      "WithStatement",
      {
        selector: "TSEnumDeclaration",
        message: "Don't declare enums",
      },
    ],
    "@typescript-eslint/consistent-type-exports": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "import-essentials/restrict-import-depth": "error",
    "import-essentials/check-path-alias": "error",
  },
};
