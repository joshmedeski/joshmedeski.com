module.exports = {
  extends: ["plugin:astro/recommended"],
  overrides: [
    {
      files: ["*.astro"],
      plugins: ["astro"],
      env: { node: true, "astro/astro": true, es2020: true },
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
    {
      files: ["**/*.astro/*.js", "*.astro/*.js"],
      env: { browser: true, es2020: true },
      parserOptions: { sourceType: "module" },
      rules: { "prettier/prettier": "off" },
    },
  ],
};
