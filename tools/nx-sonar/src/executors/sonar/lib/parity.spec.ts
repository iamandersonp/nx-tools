import {
  FORMER_SONAR_PROPERTIES,
  type FormerSonarProject,
  parsePropertiesSet
} from '../../../testing/former-sonar-properties';
import type { SonarExecutorSchema } from '../schema';
import { buildSonarProperties } from './build-sonar-properties';

const PROVIDERS_AND_UI_EXCLUSIONS = ['src/testing/**', 'src/test-env.ts', 'src/test-setup.ts'];

const UI_ENTRY_ADDITIONS: Record<string, string[]> = {
  'sonar.sources': [
    'icon/src',
    'logo/src',
    'currency-input/src',
    'number-bounds/src',
    'button/src',
    'charts/src',
    'header/src',
    'menu/src'
  ],
  'sonar.tests': [
    'icon/src',
    'logo/src',
    'currency-input/src',
    'number-bounds/src',
    'button/src',
    'charts/src',
    'header/src',
    'menu/src'
  ],
  'sonar.test.inclusions': ['*/src/**/*.spec.ts'],
  'sonar.coverage.exclusions': ['src/index.ts', '*/src/index.ts']
};

/**
 * The options each project declares in its own `project.json`, and the
 * project paths and tsconfig files that exist beside them.
 */
const PROJECTS: Readonly<
  Record<
    FormerSonarProject,
    {
      root: string;
      options: SonarExecutorSchema;
      files: string[];
    }
  >
> = {
  asb: {
    root: 'apps/asb',
    files: ['tsconfig.sonar.json', 'tsconfig.app.json'],
    options: {
      projectKey: 'BDE-Simulators',
      extraSources: ['e2e/support'],
      extraTests: ['e2e/tests'],
      extraTestInclusions: ['e2e/tests/**/*.ts'],
      extraTsconfigPaths: ['e2e/tsconfig.json'],
      extraExclusions: [
        '**/node_modules/**',
        '**/assets/js/**',
        '**/*.data.ts',
        '**/*mock*.ts',
        '**/environments/**',
        '**/*-routing.*',
        '**/*.routes.ts'
      ],
      extraCoverageExclusions: [
        'e2e/**',
        'node_modules/**',
        '**/environments/**',
        '**/assets/**',
        '**/*.data.ts',
        '**/mocks/**',
        '**/models/**',
        '**/interfaces/**',
        '**/*.interface.ts',
        '**/dto/**',
        '**/*.module.ts',
        '**/i18n/**',
        '**/*mock.ts',
        '**/*.dto.ts',
        '**/hmr.ts',
        '**/*.model.ts',
        '**/*.types.ts',
        '**/*.actions.ts',
        '**/*-routing.*',
        '**/*.routes.ts',
        '**/*.providers.ts',
        'src/*.ts',
        'src/polyfills.ts'
      ]
    }
  },
  providers: {
    root: 'libs/providers',
    files: ['tsconfig.sonar.json', 'tsconfig.lib.json'],
    options: {
      projectKey: 'BDE-Simulators-Providers',
      projectName: 'BDE-Simulators Providers',
      extraSources: [
        'logger/src',
        'focus/src',
        'navigation/src',
        'stencil-guard/src',
        'config/src',
        'http/src',
        'idfa/src',
        'share-social/src',
        'back-button/src',
        'storage/src',
        'stadistics/src',
        'app-version/src',
        'internationalization/src',
        'stadistics-gtm/src',
        'dialogs/src',
        'stadistics-firebase/src',
        'setup/src'
      ],
      extraTests: [
        'logger/src',
        'focus/src',
        'navigation/src',
        'stencil-guard/src',
        'config/src',
        'http/src',
        'idfa/src',
        'share-social/src',
        'back-button/src',
        'storage/src',
        'stadistics/src',
        'app-version/src',
        'internationalization/src',
        'stadistics-gtm/src',
        'dialogs/src',
        'stadistics-firebase/src',
        'setup/src'
      ],
      extraTestInclusions: ['*/src/**/*.spec.ts'],
      extraExclusions: PROVIDERS_AND_UI_EXCLUSIONS,
      extraCoverageExclusions: [
        'src/index.ts',
        '*/src/index.ts',
        'src/test-env.ts',
        'src/test-setup.ts',
        'src/testing/**'
      ]
    }
  },
  ui: {
    root: 'libs/ui',
    files: ['tsconfig.sonar.json', 'tsconfig.lib.json'],
    options: {
      projectKey: 'BDE-Simulators-UI',
      projectName: 'BDE-Simulators UI',
      extraSources: [
        'icon/src',
        'logo/src',
        'currency-input/src',
        'number-bounds/src',
        'button/src',
        'charts/src',
        'header/src',
        'menu/src'
      ],
      extraTests: [
        'icon/src',
        'logo/src',
        'currency-input/src',
        'number-bounds/src',
        'button/src',
        'charts/src',
        'header/src',
        'menu/src'
      ],
      extraTestInclusions: ['*/src/**/*.spec.ts'],
      extraExclusions: PROVIDERS_AND_UI_EXCLUSIONS,
      extraCoverageExclusions: [
        'src/index.ts',
        '*/src/index.ts',
        'src/test-env.ts',
        'src/test-setup.ts',
        'src/testing/**'
      ]
    }
  },
  'nx-ionic-cordova': {
    root: 'tools/nx-ionic-cordova',
    files: ['tsconfig.json', 'tsconfig.lib.json'],
    options: {
      projectKey: 'nx-ionic-cordova',
      extraTestInclusions: ['src/**/__fixtures__/**'],
      extraExclusions: ['src/**/__fixtures__/**'],
      extraCoverageExclusions: ['src/**/__fixtures__/**']
    }
  }
};

/** The property the defaults add and the former file lacked. */
const PERMITTED_EXTRA = {
  'sonar.cpd.exclusions': ['**/*.html']
};

/**
 * The property whose former value is deliberately replaced: the former file
 * pointed the analysis at the solution-style `tsconfig.json`, which holds no
 * files, so the analysis now uses the file-bearing `tsconfig.lib.json`.
 */
const PERMITTED_CHANGE = {
  'sonar.typescript.tsconfigPaths': ['tsconfig.lib.json']
};

/**
 * Builds the effective properties of a project from its options, on a disk
 * that holds exactly the files it holds today.
 *
 * @param name the project to build
 * @return the effective scanner properties
 */
function buildFor(name: FormerSonarProject): Record<string, string> {
  const { root, options, files } = PROJECTS[name];
  const existing = new Set(files.map((file) => `/workspace/${root}/${file}`));
  return buildSonarProperties(
    {
      workspaceRoot: '/workspace',
      root,
      sourceRoot: `${root}/src`
    },
    options,
    (path) => existing.has(path)
  );
}

/**
 * Sorts every list so that two parsed property sets compare as sets.
 *
 * @param parsed a `parsePropertiesSet` result
 * @return the same properties with each list sorted
 */
function asSets(parsed: Record<string, string | string[]>): Record<string, string | string[]> {
  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value])
  );
}

/** Entry paths added to the former providers Sonar property set. */
const PROVIDERS_ENTRY_ADDITIONS: Record<string, string[]> = {
  'sonar.sources': [
    'logger/src',
    'focus/src',
    'navigation/src',
    'stencil-guard/src',
    'config/src',
    'http/src',
    'idfa/src',
    'share-social/src',
    'back-button/src',
    'storage/src',
    'stadistics/src',
    'app-version/src',
    'internationalization/src',
    'stadistics-gtm/src',
    'dialogs/src',
    'stadistics-firebase/src',
    'setup/src'
  ],
  'sonar.tests': [
    'logger/src',
    'focus/src',
    'navigation/src',
    'stencil-guard/src',
    'config/src',
    'http/src',
    'idfa/src',
    'share-social/src',
    'back-button/src',
    'storage/src',
    'stadistics/src',
    'app-version/src',
    'internationalization/src',
    'stadistics-gtm/src',
    'dialogs/src',
    'stadistics-firebase/src',
    'setup/src'
  ],
  'sonar.test.inclusions': ['*/src/**/*.spec.ts'],
  'sonar.coverage.exclusions': ['*/src/index.ts']
};

describe('parsePropertiesSet', () => {
  it('splits set-valued properties into members and keeps every other value exact, ignoring comments and blank lines', () => {
    expect(
      parsePropertiesSet(
        '# a comment\n\nsonar.sources=src,e2e/support\nsonar.projectKey=K\nsonar.javascript.lcov.reportPaths=a,b'
      )
    ).toEqual({
      'sonar.sources': ['src', 'e2e/support'],
      'sonar.projectKey': 'K',
      'sonar.javascript.lcov.reportPaths': 'a,b'
    });
  });

  it('parses an already-built record the same way', () => {
    expect(
      parsePropertiesSet({
        'sonar.exclusions': '**/*.spec.ts,a/**',
        'sonar.projectName': 'A=B'
      })
    ).toEqual({
      'sonar.exclusions': ['**/*.spec.ts', 'a/**'],
      'sonar.projectName': 'A=B'
    });
  });
});

describe('parity with the former committed sonar-project.properties', () => {
  describe.each(Object.keys(PROJECTS) as FormerSonarProject[])('%s', (name) => {
    const { 'sonar.projectBaseDir': baseDir, ...effective } = buildFor(name);
    const actual = parsePropertiesSet(effective);
    const expected = parsePropertiesSet(FORMER_SONAR_PROPERTIES[name]);
    const expectedWithEntries = Object.fromEntries(
      Object.entries(expected).map(([key, value]) => [
        key,
        Array.isArray(value) &&
        (name === 'providers' || name === 'ui') &&
        (name === 'providers' ? PROVIDERS_ENTRY_ADDITIONS[key] : UI_ENTRY_ADDITIONS[key]) !== undefined
          ? [...value, ...(name === 'providers' ? PROVIDERS_ENTRY_ADDITIONS[key] : UI_ENTRY_ADDITIONS[key])]
          : value
      ])
    );
    const permittedExtra = name === 'nx-ionic-cordova' ? PERMITTED_EXTRA : {};
    const permittedChange = name === 'nx-ionic-cordova' ? PERMITTED_CHANGE : {};

    it('equals the former properties, lists as sets and scalars exactly', () => {
      expect(asSets(actual)).toEqual(
        asSets({
          ...expectedWithEntries,
          ...permittedExtra,
          ...permittedChange
        })
      );
    });

    it('analyses through a tsconfig that holds files, never a solution-style tsconfig.json', () => {
      expect(actual['sonar.typescript.tsconfigPaths']).not.toContain('tsconfig.json');
    });

    it('adds nothing beyond the permitted difference', () => {
      const extraKeys = Object.keys(actual).filter((key) => !(key in expected));

      expect(extraKeys).toEqual(Object.keys(permittedExtra));
    });

    it('lists no entry twice', () => {
      const lists = Object.values(actual).filter(Array.isArray);

      expect(lists.length).toBeGreaterThan(0);
      for (const list of lists) {
        expect(new Set(list).size).toBe(list.length);
      }
    });

    it('points projectBaseDir at the project root, which no former file declared', () => {
      expect(baseDir).toBe(`/workspace/${PROJECTS[name].root}`);
      expect(expected).not.toHaveProperty('sonar.projectBaseDir');
    });
  });
});
