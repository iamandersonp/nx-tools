import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: ['**/coverage/**', '**/out-tsc/**'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['tools/nx-sonar/src/**/*.ts', 'tools/nx-ionic-cordova/src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      jsdoc,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    settings: {
      jsdoc: {
        tagNamePreference: {
          returns: 'return',
          augments: 'extends',
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'no-duplicate-imports': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-property-names': 'error',
      'jsdoc/check-tag-names': [
        'error',
        { definedTags: ['export'] },
      ],
      'jsdoc/check-types': 'error',
      'jsdoc/empty-tags': 'error',
      'jsdoc/no-bad-blocks': 'error',
      'jsdoc/no-multi-asterisks': [
        'error',
        { preventAtMiddleLines: false },
      ],
      'jsdoc/require-returns-check': 'error',
      'jsdoc/valid-types': 'error',
    },
  },
  prettier,
];
