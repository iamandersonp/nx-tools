import type { SonarExecutorSchema } from '../schema';
import { buildSonarProperties } from './build-sonar-properties';

const LIB_PROJECT = {
  workspaceRoot: '/workspace',
  root: 'libs/x',
  sourceRoot: 'libs/x/src'
};

/**
 * Builds the properties for `libs/x` with the given options, on a disk
 * that holds exactly the given files.
 *
 * @param options the executor options
 * @param files the workspace-relative files that exist
 * @return the effective scanner properties
 */
function build(options: Partial<SonarExecutorSchema>, files: string[] = []): Record<string, string> {
  const existing = new Set(files.map((file) => `/workspace/libs/x/${file}`));
  return buildSonarProperties(LIB_PROJECT, { projectKey: 'K', ...options }, (path) => existing.has(path));
}

describe('buildSonarProperties', () => {
  describe('defaults come from the graph', () => {
    it('derives every property of a project rooted at libs/x from its key alone', () => {
      expect(build({})).toEqual({
        'sonar.projectKey': 'K',
        'sonar.projectName': 'K',
        'sonar.projectVersion': '1.0',
        'sonar.sourceEncoding': 'UTF-8',
        'sonar.projectBaseDir': '/workspace/libs/x',
        'sonar.sources': 'src',
        'sonar.tests': 'src',
        'sonar.test.inclusions': 'src/**/*.spec.ts',
        'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
        'sonar.exclusions': '**/*.spec.ts',
        'sonar.coverage.exclusions': '**/*.d.ts',
        'sonar.cpd.exclusions': '**/*.html'
      });
    });

    it('triangulates: another root and sourceRoot give another base dir and source folder', () => {
      const properties = buildSonarProperties(
        {
          workspaceRoot: '/ws',
          root: 'apps/asb',
          sourceRoot: 'apps/asb/app'
        },
        { projectKey: 'A' },
        () => false
      );

      expect(properties['sonar.projectBaseDir']).toBe('/ws/apps/asb');
      expect(properties['sonar.sources']).toBe('app');
      expect(properties['sonar.tests']).toBe('app');
      expect(properties['sonar.test.inclusions']).toBe('app/**/*.spec.ts');
    });

    it('emits the properties in the fixed order, projectBaseDir absolute', () => {
      const properties = build({}, ['tsconfig.lib.json']);

      expect(Object.keys(properties)).toEqual([
        'sonar.projectKey',
        'sonar.projectName',
        'sonar.projectVersion',
        'sonar.sourceEncoding',
        'sonar.projectBaseDir',
        'sonar.sources',
        'sonar.tests',
        'sonar.test.inclusions',
        'sonar.typescript.tsconfigPaths',
        'sonar.javascript.lcov.reportPaths',
        'sonar.exclusions',
        'sonar.coverage.exclusions',
        'sonar.cpd.exclusions'
      ]);
      expect(properties['sonar.projectBaseDir']).toBe('/workspace/libs/x');
    });
  });

  describe('the tsconfig fallback chain', () => {
    it.each([
      [
        'tsconfig.sonar.json wins over the others',
        ['tsconfig.sonar.json', 'tsconfig.lib.json', 'tsconfig.app.json'],
        'tsconfig.sonar.json'
      ],
      [
        'tsconfig.lib.json wins over tsconfig.app.json',
        ['tsconfig.lib.json', 'tsconfig.app.json'],
        'tsconfig.lib.json'
      ],
      ['tsconfig.app.json is the last candidate', ['tsconfig.app.json'], 'tsconfig.app.json']
    ])('%s', (_label, files, expected) => {
      expect(build({}, files)['sonar.typescript.tsconfigPaths']).toBe(expected);
    });

    it('omits the property when no candidate exists', () => {
      const properties = build({}, ['tsconfig.json']);

      expect(properties).not.toHaveProperty('sonar.typescript.tsconfigPaths');
      expect(properties['sonar.projectKey']).toBe('K');
    });
  });

  describe('options', () => {
    it('defaults projectName to the key and honours an explicit name', () => {
      expect(build({ projectKey: 'Key' })['sonar.projectName']).toBe('Key');
      expect(
        build({
          projectKey: 'Key',
          projectName: 'Key Name'
        })['sonar.projectName']
      ).toBe('Key Name');
    });

    it('uses the tsconfig option verbatim, without checking that it exists', () => {
      const properties = build({ tsconfig: 'tsconfig.json' }, ['tsconfig.sonar.json']);

      expect(properties['sonar.typescript.tsconfigPaths']).toBe('tsconfig.json');
    });

    it('replaces the lcov default with lcovReportPath', () => {
      expect(build({ lcovReportPath: 'out/lcov.info' })['sonar.javascript.lcov.reportPaths']).toBe('out/lcov.info');
    });

    it('appends every extra list to its matching default', () => {
      const properties = build(
        {
          extraSources: ['e2e/support'],
          extraTests: ['e2e/tests'],
          extraTestInclusions: ['e2e/tests/**/*.ts'],
          extraTsconfigPaths: ['e2e/tsconfig.json'],
          extraExclusions: ['src/testing/**'],
          extraCoverageExclusions: ['e2e/**']
        },
        ['tsconfig.sonar.json']
      );

      expect(properties).toMatchObject({
        'sonar.sources': 'src,e2e/support',
        'sonar.tests': 'src,e2e/tests',
        'sonar.test.inclusions': 'src/**/*.spec.ts,e2e/tests/**/*.ts',
        'sonar.typescript.tsconfigPaths': 'tsconfig.sonar.json,e2e/tsconfig.json',
        'sonar.exclusions': '**/*.spec.ts,src/testing/**',
        'sonar.coverage.exclusions': '**/*.d.ts,e2e/**'
      });
    });

    it('keeps extraTsconfigPaths alone when no candidate tsconfig exists', () => {
      expect(
        build({
          extraTsconfigPaths: ['e2e/tsconfig.json']
        })['sonar.typescript.tsconfigPaths']
      ).toBe('e2e/tsconfig.json');
    });

    it('keeps only the first occurrence of an entry repeated across the defaults and the extras', () => {
      const properties = build({
        extraExclusions: ['a/**', '**/*.spec.ts', 'a/**', 'b/**']
      });

      expect(properties['sonar.exclusions']).toBe('**/*.spec.ts,a/**,b/**');
    });
  });

  describe('invalid input', () => {
    it.each([
      ['an empty projectKey', { projectKey: '' }],
      ['a missing projectKey', { projectKey: undefined }]
    ])('throws on %s', (_label, options) => {
      expect(() => build(options as unknown as Partial<SonarExecutorSchema>)).toThrow(/projectKey/);
    });

    it('throws when the project has no sourceRoot', () => {
      expect(() =>
        buildSonarProperties(
          {
            workspaceRoot: '/ws',
            root: 'libs/x',
            sourceRoot: undefined
          },
          { projectKey: 'K' },
          () => false
        )
      ).toThrow(/sourceRoot/);
    });

    it.each([
      ['an empty entry', 'extraExclusions', ['']],
      ['a comma inside an entry', 'extraSources', ['a,b']],
      ['a comma in a test inclusion', 'extraTestInclusions', ['x,y']],
      ['an empty tsconfig path', 'extraTsconfigPaths', ['']]
    ])('throws on %s', (_label, option, entries) => {
      expect(() => build({ [option]: entries })).toThrow(new RegExp(option));
    });
  });
});
