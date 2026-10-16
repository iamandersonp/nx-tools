import { logger, type PromiseExecutor } from '@nx/devkit';

import { spawnCli } from '../../shared/resolve-cli';
import { listRunningEmulators } from './lib/android-emulator';
import { buildArgv } from './lib/build-argv';
import { resolveCwd } from './lib/resolve-cwd';
import type { NativeExecutorSchema } from './schema';

/** The npm package and bin name each supported CLI is resolved from. */
const CLI_PACKAGES: Readonly<Record<NonNullable<NativeExecutorSchema['cli']>, { pkg: string; bin: string }>> = {
  cordova: { pkg: 'cordova', bin: 'cordova' },
  ionic: { pkg: '@ionic/cli', bin: 'ionic' },
  'cordova-res': { pkg: 'cordova-res', bin: 'cordova-res' }
};

/** The upstream native-run issue the Android emulator target works around. */
const NATIVE_RUN_409 = 'https://github.com/ionic-team/native-run/issues/409';

/**
 * Resolves the serial of the running Android emulator an
 * `--deploy=emulator` Android run targets, or `undefined` for every
 * other run.
 *
 * Workaround for native-run #409: native-run types current emulator
 * images (`device:emu64xa16k`) as `hardware`, so `--virtual` finds no
 * target. It honours `--target=<serial>` before the type, so the running
 * emulator's serial is passed explicitly. Remove this function and the
 * `emulatorTarget` parameter of `buildArgv` once native-run classifies
 * these emulators as virtual.
 *
 * With several emulators running, the first adb lists is chosen and the
 * choice is logged. With none, or with adb missing or failing, the run
 * keeps plain `--emulator` and a one-line warning is logged.
 *
 * @param options the executor's options
 * @return the emulator serial, or `undefined`
 */
function resolveEmulatorTarget(options: NativeExecutorSchema): string | undefined {
  const isAndroid = options.platform === 'android' || (options.args ?? []).includes('android');
  if (options.deploy !== 'emulator' || !isAndroid) {
    return undefined;
  }

  const [serial, ...ignored] = listRunningEmulators();
  if (!serial) {
    logger.warn(
      `No running Android emulator found through adb; deploying with plain --emulator, which native-run may reject with ERR_NO_TARGET (${NATIVE_RUN_409}).`
    );
    return undefined;
  }
  if (ignored.length > 0) {
    logger.info(`Several Android emulators are running; targeting ${serial} and ignoring ${ignored.join(', ')}.`);
  }
  return serial;
}

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
    const status = spawnCli(pkg, bin, buildArgv(options, resolveEmulatorTarget(options)), { root: context.root, cwd });
    return { success: status === 0 };
  } catch (error) {
    logger.error(`The native executor could not run "${bin}" (${pkg}): ${(error as Error).message}`);
    return { success: false };
  }
};

export default runExecutor;
