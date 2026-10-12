/**
 * The options of the `sonar` executor, as declared on a project's `sonar`
 * target in `project.json`.
 */
export interface SonarExecutorSchema {
  /** The SonarQube project key; also what opts the project in. */
  projectKey: string;
  /** The SonarQube project name; defaults to `projectKey`. */
  projectName?: string;
  /** The analysis tsconfig, relative to the project root, used as given. */
  tsconfig?: string;
  /** The lcov report, relative to the project root. */
  lcovReportPath?: string;
  /** Prints the effective properties and skips the scanner. */
  dryRun?: boolean;
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
}
