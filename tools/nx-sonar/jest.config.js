/*
 * The plugin's own Jest configuration.
 *
 * Unlike the application and the two libraries, this project has no
 * Angular or Ionic surface at all -- it is plain Node TypeScript that
 * infers Nx targets and spawns the Sonar scanner -- so it takes
 * `@nx/jest`'s own preset instead of `jest-preset-angular`, and runs
 * under `testEnvironment: 'node'` rather than the default `jsdom`.
 */
const { nxPreset } = require('@nx/jest/preset');

module.exports = {
  ...nxPreset,
  displayName: 'nx-sonar',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json'
      }
    ]
  },
  /*
   * Inside the project, like `libs/ui` and `libs/providers` already do,
   * so the plugin carries its own coverage report wherever it goes.
   */
  coverageDirectory: 'coverage',
  /*
   * `nxPreset` sets `coverageReporters` to `['html']` alone, which writes
   * no `lcov.info` at all, so SonarQube would read no coverage for the
   * plugin. `projectRoot` keeps the report's `SF:` paths relative to this
   * directory: the scanner resolves them against `sonar.projectBaseDir`,
   * and istanbul's default is `process.cwd()`, the workspace root.
   */
  coverageReporters: [['lcov', { projectRoot: __dirname }], 'text-summary']
};
