import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * Runs one adb command and returns its standard output, throwing when
 * the binary is missing or exits non-zero.
 */
export type AdbRunner = (adb: string, args: string[]) => string;

/**
 * A running emulator line from `adb devices`: an `emulator-<port>`
 * serial whose state is exactly `device`. Physical devices and
 * emulators reported `offline`, `unauthorized` or in any other state
 * never match.
 */
const RUNNING_EMULATOR = /^(emulator-\d+)\s+device(?:\s|$)/;

/**
 * Resolves the adb binary from the Android SDK the environment names:
 * `$ANDROID_HOME/platform-tools/adb`, else
 * `$ANDROID_SDK_ROOT/platform-tools/adb`, else `adb` on `PATH`. An
 * empty variable counts as unset.
 *
 * @param env the environment to read the SDK location from
 * @return the adb binary to run
 */
export function resolveAdbPath(env: NodeJS.ProcessEnv): string {
  const sdk = env['ANDROID_HOME'] || env['ANDROID_SDK_ROOT'];
  return sdk ? join(sdk, 'platform-tools', 'adb') : 'adb';
}

/**
 * Extracts the serials of the running emulators from `adb devices`
 * output, in the order adb lists them. The header, blank lines and
 * every non-emulator or non-ready entry are ignored.
 *
 * @param output the standard output of `adb devices` (with or without `-l`)
 * @return the running emulator serials, e.g. `['emulator-5554']`
 */
export function parseRunningEmulators(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => RUNNING_EMULATOR.exec(line.trim())?.[1])
    .filter((serial): serial is string => serial !== undefined);
}

/**
 * Runs adb synchronously and returns its standard output.
 *
 * @param adb the adb binary
 * @param args the adb arguments
 * @return adb's standard output
 * @throws Error when adb cannot be spawned or exits non-zero
 */
const runAdb: AdbRunner = (adb, args) => {
  const result = spawnSync(adb, args, { encoding: 'utf8' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${adb} ${args.join(' ')} exited with status ${result.status}`);
  }
  return result.stdout;
};

/**
 * Lists the serials of the Android emulators running now, by asking
 * `adb devices`. Never throws: a missing or failing adb yields an
 * empty list, the same as no running emulator.
 *
 * @param env the environment that locates the Android SDK
 * @param run the adb runner; injectable so tests never spawn adb
 * @return the running emulator serials, in adb's order
 */
export function listRunningEmulators(env: NodeJS.ProcessEnv = process.env, run: AdbRunner = runAdb): string[] {
  try {
    return parseRunningEmulators(run(resolveAdbPath(env), ['devices']));
  } catch {
    return [];
  }
}
