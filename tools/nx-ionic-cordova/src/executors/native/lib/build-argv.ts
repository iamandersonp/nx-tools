import type { NativeDeployTarget, NativeExecutorSchema } from '../schema';

/**
 * The Ionic/Cordova CLI flag each `deploy` value selects.
 */
const DEPLOY_FLAGS: Readonly<Record<NativeDeployTarget, string>> = {
  device: '--device',
  emulator: '--emulator'
};

/**
 * Builds the argument vector `spawnSync` receives: the command, its
 * extra arguments, an optional Cordova plugin spec, an optional
 * platform name, and, last, the optional
 * deploy flag (`--device` or `--emulator`) that `deploy` selects. With
 * `deploy` unset the vector carries no deploy flag at all. When
 * `deploy` is `'emulator'` and an emulator serial is given,
 * `--target=<serial>` follows `--emulator`; the serial is ignored for
 * every other `deploy` value.
 *
 * The plugin spec is a dedicated option rather than part of `args`
 * because Nx replaces, never extends, an array option given on the
 * command line: `nx run <app>:native:plugin-add --plugin=<spec>` keeps
 * the configuration's `['plugin', 'add']` and appends `<spec>` after it
 * as a single argument.
 *
 * Returned as an array, never joined into a shell string, so no
 * invocation of this executor opens an interpolation seam -- a
 * release path that receives an environment name from CI MUST NOT
 * concatenate untrusted input into a shell command (design -- "no
 * interpolation seam").
 *
 * @param options the executor's options
 * @param emulatorTarget the serial of the emulator to deploy to, as
 *   the executor resolved it; omitted for every other run
 * @return the argument vector, e.g. `['build', 'android']` or
 *   `['cordova', 'run', 'android', '--emulator']` or
 *   `['cordova', 'plugin', 'add', 'cordova-plugin-x']`
 */
export function buildArgv(options: NativeExecutorSchema, emulatorTarget?: string): string[] {
  const argv = [options.command, ...(options.args ?? [])];
  if (options.plugin) {
    argv.push(options.plugin);
  }
  if (options.platform) {
    argv.push(options.platform);
  }
  if (options.deploy) {
    argv.push(DEPLOY_FLAGS[options.deploy]);
  }
  if (options.deploy === 'emulator' && emulatorTarget) {
    argv.push(`--target=${emulatorTarget}`);
  }
  return argv;
}
