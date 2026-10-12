import { join } from 'node:path';

/**
 * Finds the coverage report the analysis reads when it is not on disk.
 *
 * The report path is relative to `sonar.projectBaseDir`, which is how the
 * scanner resolves it.
 *
 * @param properties the effective scanner properties
 * @param fileExists whether an absolute path exists on disk
 * @return the absolute path of the report when it is absent, or
 *   `undefined` when it exists
 */
export function findMissingLcov(
  properties: Readonly<Record<string, string>>,
  fileExists: (absolutePath: string) => boolean
): string | undefined {
  const report = join(properties['sonar.projectBaseDir'], properties['sonar.javascript.lcov.reportPaths']);
  return fileExists(report) ? undefined : report;
}
