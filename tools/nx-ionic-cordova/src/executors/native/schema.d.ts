/**
 * Where an `ionic cordova run` invocation deploys the application: a
 * physical device (`--device`) or an emulator/simulator (`--emulator`).
 */
export type NativeDeployTarget = 'device' | 'emulator';

/**
 * Options accepted by the `native` executor.
 */
export interface NativeExecutorSchema {
  /**
   * Which hoisted CLI binary to run, resolved from the root
   * `node_modules/.bin`. Defaults to `'cordova'`.
   */
  cli?: 'cordova' | 'ionic' | 'cordova-res';
  /** The CLI subcommand to run, e.g. `'build'`, `'platform'`, `'prepare'`. */
  command: string;
  /** Extra arguments appended after the command. Defaults to `[]`. */
  args?: string[];
  /**
   * A Cordova plugin spec (npm package name, git URL, or local path),
   * appended right after `args` and before `platform`. Meant for the
   * `plugin-add`/`plugin-rm` configurations, whose array `args` the
   * command line cannot extend: `--plugin=cordova-plugin-x`.
   */
  plugin?: string;
  /** An optional platform name (e.g. `'android'`, `'ios'`), appended after the command. */
  platform?: string;
  /**
   * Where `run` deploys the application. `'device'` appends `--device`
   * and `'emulator'` appends `--emulator`, last in the argument vector;
   * unset appends neither. A command-line `--deploy=<value>` overrides
   * the value a configuration declares.
   */
  deploy?: NativeDeployTarget;
}
