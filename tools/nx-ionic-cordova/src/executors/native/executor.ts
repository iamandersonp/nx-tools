import { logger, type PromiseExecutor } from '@nx/devkit';

import { spawnCli } from '../../shared/resolve-cli';
import { buildArgv } from './lib/build-argv';
import { resolveCwd } from './lib/resolve-cwd';
import type { NativeExecutorSchema } from './schema';

/** The npm package and bin name each supported CLI is resolved from. */
const CLI_PACKAGES: Readonly<Record<NonNullable<NativeExecutorSchema['cli']>, { pkg: string; bin: string }>> = {
  cordova: { pkg: 'cordova', bin: 'cordova' },
  ionic: { pkg: '@ionic/cli', bin: 'ionic' },
  'cordova-res': { pkg: 'cordova-res', bin: 'cordova-res' }
};

/**
 * Runs an Ionic/Cordova CLI command scoped to the invoking project's
 * root. The CLI entry is resolved from the workspace root and spawned
 * through `process.execPath` with inherited stdio; nothing under
 * `node_modules/.bin`, no shell, no `npx`.
 *
 * `{ success: true }` only reports that the child exited zero; it is not
 * evidence that the native build produced its artefacts.
 *
 * @param options the executor's options
 * @param context the Nx execution context
 * @return `{ success: true }` when the command exits zero, `{ success: false }` otherwise
 */
const runExecutor: PromiseExecutor<NativeExecutorSchema> = async (options, context) => {
  const cwd = resolveCwd(context);
  const { pkg, bin } = CLI_PACKAGES[options.cli ?? 'cordova'];

  try {
    const status = spawnCli(pkg, bin, buildArgv(options), { root: context.root, cwd });
    return { success: status === 0 };
  } catch (error) {
    logger.error(`The native executor could not run "${bin}" (${pkg}): ${(error as Error).message}`);
    return { success: false };
  }
};

export default runExecutor;
