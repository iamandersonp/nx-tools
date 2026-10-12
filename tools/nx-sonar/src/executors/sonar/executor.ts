import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { logger, type PromiseExecutor } from '@nx/devkit';

import { buildSonarProperties } from './lib/build-sonar-properties';
import { findMissingLcov } from './lib/find-missing-lcov';
import { resolveSonarProject } from './lib/resolve-sonar-project';
import { toScannerArgs } from './lib/to-scanner-args';
import type { SonarExecutorSchema } from './schema';

/**
 * Runs the Sonar scanner for the invoking project.
 *
 * The scanner properties are derived from the project graph and the
 * target's options, and `sonar.projectBaseDir` is the invoking project's
 * own root, resolved from the Nx execution context. The scanner binary is
 * the workspace-local `node_modules/.bin/sonar`, never `npx`, spawned
 * from the workspace root with inherited stdio and without a shell, one
 * `-D` argument per property.
 *
 * A coverage report that is not on disk logs a warning naming its path
 * and the analysis continues. With `dryRun`, the effective `key=value`
 * lines are logged and the scanner is not spawned.
 *
 * The executor never reads `process.env`: the scanner's credentials and
 * server address reach it only through the environment it inherits, so a
 * bare `nx run <project>:sonar` without them fails with the scanner's own
 * authentication error.
 *
 * @param options the executor's options; `projectKey` is required
 * @param context the Nx execution context
 * @return `{ success: true }` for a dry run or when the scanner exits
 *   zero, `{ success: false }` otherwise
 * @throws Error when `projectKey` is empty, when the project cannot be
 *   resolved or declares no `sourceRoot`, or when an extra entry is
 *   invalid
 */
const runExecutor: PromiseExecutor<SonarExecutorSchema> = async (options, context) => {
  const properties = buildSonarProperties(resolveSonarProject(context), options, existsSync);

  const missingLcov = findMissingLcov(properties, existsSync);
  if (missingLcov !== undefined) {
    logger.warn(`The coverage report ${missingLcov} does not exist; the analysis continues without coverage.`);
  }

  if (options.dryRun) {
    for (const [key, value] of Object.entries(properties)) {
      logger.info(`${key}=${value}`);
    }
    return { success: true };
  }

  const result = spawnSync(join(context.root, 'node_modules', '.bin', 'sonar'), toScannerArgs(properties), {
    cwd: context.root,
    stdio: 'inherit'
  });

  return { success: result.status === 0 };
};

export default runExecutor;
