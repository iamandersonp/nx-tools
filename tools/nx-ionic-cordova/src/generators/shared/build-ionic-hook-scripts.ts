/**
 * Builds the `ionic:build`/`ionic:serve` npm scripts the Ionic CLI runs instead of `ng`.
 * They go through the `nx-ionic-hook` bin because the CLI always forwards its own
 * `--project=<name>`, which would collide with `nx run`'s reserved flag.
 *
 * @param appName the application's Nx project name
 */
export function buildIonicHookScripts(appName: string): Record<string, string> {
  return {
    'ionic:build': `nx-ionic-hook ${appName}:ionic-hook-build`,
    'ionic:serve': `nx-ionic-hook ${appName}:ionic-hook-serve`
  };
}
