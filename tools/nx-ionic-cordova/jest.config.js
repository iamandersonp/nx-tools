/*
 * The plugin's own Jest configuration.
 *
 * Plain Node TypeScript with no Angular or Ionic surface, so it takes
 * `@nx/jest`'s own preset and runs under `testEnvironment: 'node'`.
 */
const { nxPreset } = require('@nx/jest/preset');

module.exports = {
  ...nxPreset,
  displayName: 'nx-ionic-cordova',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json'
      }
    ]
  },
  coverageDirectory: 'coverage',
  /* `projectRoot` keeps the report's `SF:` paths relative to this directory. */
  coverageReporters: [['lcov', { projectRoot: __dirname }], 'text-summary']
};
