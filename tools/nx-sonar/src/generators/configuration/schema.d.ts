/**
 * Options accepted by the `configuration` generator. The `tsconfig`,
 * `lcovReportPath` and `extra*` options are the `sonar` executor's own,
 * under the same names and types, and are copied to the target as given.
 */
export interface ConfigurationGeneratorSchema {
  /** The Nx project that receives the `sonar` target. */
  project: string;
  /**
   * The SonarQube project key. Defaults to the plugin's
   * `projectKeyPrefix` followed by the project name.
   */
  projectKey?: string;
  /** The SonarQube project name; the executor defaults it to the key. */
  projectName?: string;
  /** The analysis tsconfig, relative to the project root. */
  tsconfig?: string;
  /** The lcov report, relative to the project root. */
  lcovReportPath?: string;
  /** Source folders appended to the default. */
  extraSources?: string[];
  /** Test folders appended to the default. */
  extraTests?: string[];
  /** Test inclusion globs appended to the default. */
  extraTestInclusions?: string[];
  /** Further tsconfig files appended after the chosen one. */
  extraTsconfigPaths?: string[];
  /** Exclusion globs appended to the default. */
  extraExclusions?: string[];
  /** Coverage exclusion globs appended to the default. */
  extraCoverageExclusions?: string[];
  /** Replaces a `sonar` target the project already declares. */
  overwrite?: boolean;
  /** Skips formatting the files the generator changed. */
  skipFormat?: boolean;
}
