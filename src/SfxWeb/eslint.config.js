// @ts-check
const angular = require('angular-eslint');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  {
    ignores: [
      'projects/**',
      'dist/**',
      'coverage/**',
      'cypress-coverage/**',
      '.angular/**',
    ],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { prefix: 'app', style: 'kebab-case', type: 'element' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { prefix: 'app', style: 'camelCase', type: 'attribute' },
      ],
      '@angular-eslint/prefer-standalone': 'off',
      // Keep Eager change detection (behavior-preserving after the v22 migration);
      // OnPush adoption is a separate, tested effort for this mutation-based app.
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
);
