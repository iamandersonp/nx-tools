import { join, posix } from 'node:path';

import type { SonarExecutorSchema } from '../schema';
import type { SonarProject } from './resolve-sonar-project';

/**
 * The tsconfig files the analysis falls back to, in priority order: the
 * dedicated analysis config, then the library build config, then the
 * application build config.
 */
const TSCONFIG_CANDIDATES = ['tsconfig.sonar.json', 'tsconfig.lib.json', 'tsconfig.app.json'] as const;

/**
 * Joins a derived default with the project's extra entries into one
 * comma-separated scanner value, keeping the first occurrence of each
 * entry.
 *
 * @param option the name of the option the extras come from, for errors
 * @param derived the entries derived from the graph and conventions
 * @param extras the project's own entries, appended after the derived ones
 * @return the de-duplicated entries joined with commas
 * @throws Error when an extra entry is empty or contains a comma, which
 *   the scanner would read as two entries
 */
function mergeList(option: string, derived: readonly string[], extras: readonly string[] = []): string {
  for (const entry of extras) {
    if (entry === '' || entry.includes(',')) {
      throw new Error(
        `The sonar option "${option}" holds the entry "${entry}"; entries must be non-empty and must not contain a comma.`
      );
    }
  }

  return [...new Set([...derived, ...extras])].join(',');
}

/**
 * Chooses the tsconfig the analysis reads: the `tsconfig` option as given,
 * or else the first candidate that exists in the project root.
 *
 * @param project the invoking project
 * @param options the executor options
 * @param fileExists whether an absolute path exists on disk
 * @return the chosen tsconfig, or an empty list when there is none
 */
function chooseTsconfig(
  project: SonarProject,
  options: SonarExecutorSchema,
  fileExists: (absolutePath: string) => boolean
): string[] {
  if (options.tsconfig !== undefined) {
    return [options.tsconfig];
  }

  const candidate = TSCONFIG_CANDIDATES.find((file) => fileExists(join(project.workspaceRoot, project.root, file)));
  return candidate === undefined ? [] : [candidate];
}

/**
 * Builds the effective scanner properties of a project: defaults derived
 * from the project graph and conventions, overridden or extended by the
 * project's own options.
 *
 * `tsconfig` and `lcovReportPath` replace their defaults; each `extra*`
 * list is appended to its default and never replaces it. The properties
 * come back in a fixed order, every key carrying the `sonar.` prefix and
 * `sonar.projectBaseDir` absolute, so the same inputs always produce the
 * same arguments.
 *
 * @param project the invoking project's paths
 * @param options the executor options
 * @param fileExists whether an absolute path exists on disk
 * @return the effective scanner properties
 * @throws Error when `projectKey` is empty, when the project declares no
 *   `sourceRoot`, or when an extra entry is empty or contains a comma
 */
export function buildSonarProperties(
  project: SonarProject,
  options: SonarExecutorSchema,
  fileExists: (absolutePath: string) => boolean
): Record<string, string> {
  const { projectKey } = options;
  if (typeof projectKey !== 'string' || projectKey === '') {
    throw new Error('The sonar target requires a non-empty "projectKey" option.');
  }
  if (!project.sourceRoot) {
    throw new Error(`The sonar target requires the project at "${project.root}" to declare a sourceRoot.`);
  }

  const source = posix.relative(project.root, project.sourceRoot);
  const tsconfigPaths = mergeList(
    'extraTsconfigPaths',
    chooseTsconfig(project, options, fileExists),
    options.extraTsconfigPaths
  );

  return {
    'sonar.projectKey': projectKey,
    'sonar.projectName': options.projectName ?? projectKey,
    'sonar.projectVersion': '1.0',
    'sonar.sourceEncoding': 'UTF-8',
    'sonar.projectBaseDir': join(project.workspaceRoot, project.root),
    'sonar.sources': mergeList('extraSources', [source], options.extraSources),
    'sonar.tests': mergeList('extraTests', [source], options.extraTests),
    'sonar.test.inclusions': mergeList('extraTestInclusions', [`${source}/**/*.spec.ts`], options.extraTestInclusions),
    ...(tsconfigPaths === ''
      ? {}
      : {
          'sonar.typescript.tsconfigPaths': tsconfigPaths
        }),
    'sonar.javascript.lcov.reportPaths': options.lcovReportPath ?? 'coverage/lcov.info',
    'sonar.exclusions': mergeList('extraExclusions', ['**/*.spec.ts'], options.extraExclusions),
    'sonar.coverage.exclusions': mergeList('extraCoverageExclusions', ['**/*.d.ts'], options.extraCoverageExclusions),
    'sonar.cpd.exclusions': '**/*.html'
  };
}
