import type { GeneratedNxTarget } from './build-native-target';
import { IONIC_HOOK_EXECUTOR } from './plugin-entry';

/**
 * Builds the `ionic-hook-build`/`ionic-hook-serve` targets the app's `ionic:build` and
 * `ionic:serve` scripts delegate to. They differ only by the static `hook` option, and both
 * depend on `^build` because each ends up in an app build or dev server.
 */
export function buildIonicHookTargets(): Record<string, GeneratedNxTarget> {
  return {
    'ionic-hook-build': { executor: IONIC_HOOK_EXECUTOR, options: { hook: 'build' }, dependsOn: ['^build'] },
    'ionic-hook-serve': { executor: IONIC_HOOK_EXECUTOR, options: { hook: 'serve' }, dependsOn: ['^build'] }
  };
}
