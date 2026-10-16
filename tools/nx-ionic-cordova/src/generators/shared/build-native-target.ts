import { NATIVE_EXECUTOR } from './plugin-entry';

/** The Nx `project.json` target shape the generators write. */
export interface GeneratedNxTarget {
  executor: string;
  options?: Record<string, unknown>;
  configurations?: Record<string, unknown>;
  dependsOn?: string[];
}

/**
 * Builds the `native` target every generated app carries. It has no app-specific options:
 * the executor resolves its own `cwd` from the invoking project's root.
 *
 * The base command is the read-only `info`. Every real invocation selects a configuration.
 * Cordova-facing ones run the Ionic CLI, so the web build runs through the app's
 * `ionic:build`/`ionic:serve` hook scripts. There are no per-environment variants and no
 * `--buildConfig`: Cordova reads `build.json` by itself.
 *
 * The run configurations declare `deploy: 'device'` rather than a literal `--device`, so a
 * command-line `--deploy=emulator` overrides it. `plugin-add`/`plugin-rm` take the spec as
 * `--plugin=<name>`, because Nx replaces (never extends) a configuration's `args` array.
 * `dependsOn: ['^build']` sits at the top level because every operation can reach a build.
 */
export function buildNativeTarget(): GeneratedNxTarget {
  return {
    executor: NATIVE_EXECUTOR,
    options: { command: 'info' },
    dependsOn: ['^build'],
    configurations: {
      'android-add': ionicCordova('platforms', 'add', 'android@15'),
      'android-rm': ionicCordova('platform', 'rm', 'android'),
      'android-build': ionicCordova('build', 'android'),
      'android-build-debug': ionicCordova('build', 'android', '--debug'),
      'android-build-prod': ionicCordova('build', 'android', '--prod', '--release'),
      'ios-add': ionicCordova('platforms', 'add', 'ios'),
      'ios-rm': ionicCordova('platform', 'rm', 'ios'),
      'ios-build': ionicCordova('build', 'ios'),
      'ios-build-debug': ionicCordova('build', 'ios', '--prod', '--device', '--debug'),
      'ios-build-prod': ionicCordova('build', 'ios', '--prod', '--device', '--release'),
      'live-android': ionicCordovaRun('android', '-l'),
      'live-ios': ionicCordovaRun('ios', '-l', '--external'),
      'install-android': ionicCordovaRun('android'),
      'install-ios': ionicCordovaRun('ios'),
      'plugin-add': ionicCordova('plugin', 'add'),
      'plugin-rm': ionicCordova('plugin', 'rm'),
      resgenerate: cordovaRes('resources'),
      'res-generate': cordovaRes('--copy'),
      'res-generate-android': cordovaRes('android', '--type', 'adaptive-icon'),
      'res-generate-ios': cordovaRes('ios')
    }
  };
}

function ionicCordova(...args: string[]): Record<string, unknown> {
  return { cli: 'ionic', command: 'cordova', args };
}

function ionicCordovaRun(...args: string[]): Record<string, unknown> {
  return { ...ionicCordova('run', ...args), deploy: 'device' };
}

function cordovaRes(command: string, ...args: string[]): Record<string, unknown> {
  return { cli: 'cordova-res', command, args };
}
