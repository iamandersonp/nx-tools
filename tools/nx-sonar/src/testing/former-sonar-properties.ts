/**
 * The projects whose former committed `sonar-project.properties` are frozen
 * here.
 */
export type FormerSonarProject = 'asb' | 'providers' | 'ui' | 'nx-ionic-cordova';

/**
 * The `sonar.*` lines of each project's former committed
 * `sonar-project.properties`, verbatim and without comments.
 *
 * They are literals on purpose: a project's test boundary forbids reading
 * another project's files, and the parity they guard has to outlive the
 * deletion of the files they were copied from.
 */
export const FORMER_SONAR_PROPERTIES: Readonly<Record<FormerSonarProject, string>> = {
  asb: `sonar.projectKey=BDE-Simulators
sonar.projectName=BDE-Simulators
sonar.projectVersion=1.0
sonar.sourceEncoding=UTF-8
sonar.sources=src,e2e/support
sonar.tests=src,e2e/tests
sonar.test.inclusions=src/**/*.spec.ts,e2e/tests/**/*.ts
sonar.typescript.tsconfigPaths=tsconfig.sonar.json,e2e/tsconfig.json
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/assets/js/**,**/*.data.ts,**/*mock*.ts,**/environments/**,**/*.spec.ts,**/*-routing.*,**/*.routes.ts
sonar.coverage.exclusions=e2e/**,**/*.d.ts,node_modules/**,**/environments/**,**/assets/**,**/*.data.ts,**/mocks/**,**/models/**,**/interfaces/**,**/*.interface.ts,**/dto/**,**/*.module.ts,**/i18n/**,**/*mock.ts,**/*.dto.ts,**/hmr.ts,**/*.model.ts,**/*.types.ts,**/*.actions.ts,**/*-routing.*,**/*.routes.ts,**/*.providers.ts,src/*.ts,src/polyfills.ts
sonar.cpd.exclusions=**/*.html`,
  providers: `sonar.projectKey=BDE-Simulators-Providers
sonar.projectName=BDE-Simulators Providers
sonar.projectVersion=1.0
sonar.sourceEncoding=UTF-8
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=src/**/*.spec.ts
sonar.typescript.tsconfigPaths=tsconfig.sonar.json
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/*.spec.ts,src/testing/**,src/test-env.ts,src/test-setup.ts
sonar.coverage.exclusions=**/*.d.ts,src/index.ts,src/test-env.ts,src/test-setup.ts,src/testing/**
sonar.cpd.exclusions=**/*.html`,
  ui: `sonar.projectKey=BDE-Simulators-UI
sonar.projectName=BDE-Simulators UI
sonar.projectVersion=1.0
sonar.sourceEncoding=UTF-8
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=src/**/*.spec.ts
sonar.typescript.tsconfigPaths=tsconfig.sonar.json
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/*.spec.ts,src/testing/**,src/test-env.ts,src/test-setup.ts
sonar.coverage.exclusions=**/*.d.ts,src/test-env.ts,src/test-setup.ts,src/testing/**
sonar.cpd.exclusions=**/*.html`,
  'nx-ionic-cordova': `sonar.projectKey=nx-ionic-cordova
sonar.projectName=nx-ionic-cordova
sonar.projectVersion=1.0
sonar.sourceEncoding=UTF-8
sonar.sources=src
sonar.tests=src
sonar.test.inclusions=src/**/*.spec.ts,src/**/__fixtures__/**
sonar.typescript.tsconfigPaths=tsconfig.json
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/*.spec.ts,src/**/__fixtures__/**
sonar.coverage.exclusions=**/*.d.ts,src/**/__fixtures__/**`
};

/**
 * The properties whose value is a comma-separated list that the scanner
 * reads as a set, so only their members and not their order matter.
 */
export const SET_VALUED_PROPERTIES: readonly string[] = [
  'sonar.sources',
  'sonar.tests',
  'sonar.test.inclusions',
  'sonar.typescript.tsconfigPaths',
  'sonar.exclusions',
  'sonar.coverage.exclusions',
  'sonar.cpd.exclusions'
];

/**
 * Parses a set of scanner properties into a comparable shape: a
 * set-valued property becomes its list of members in source order, and
 * every other property stays its exact string.
 *
 * @param properties `key=value` lines, with blank and `#` lines ignored,
 *   or an already-built record of property values
 * @return each property name mapped to its string, or to its list of
 *   members when the property is set-valued
 */
export function parsePropertiesSet(
  properties: string | Readonly<Record<string, string>>
): Record<string, string | string[]> {
  const entries: [string, string][] =
    typeof properties === 'string'
      ? properties
          .split('\n')
          .filter((line) => line.trim() !== '' && !line.startsWith('#'))
          .map((line) => {
            const separator = line.indexOf('=');
            return [line.slice(0, separator), line.slice(separator + 1)];
          })
      : Object.entries(properties);

  return Object.fromEntries(
    entries.map(([key, value]) => [key, SET_VALUED_PROPERTIES.includes(key) ? value.split(',') : value])
  );
}
