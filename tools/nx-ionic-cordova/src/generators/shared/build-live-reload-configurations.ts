const LIVE_RELOAD_PLATFORMS = ['android', 'ios'] as const;

/**
 * Builds the `live-android`/`live-ios` configurations of an app's `build` target
 * (`@angular/build:application`). Each registers the platform's `cordova.js` as a global
 * script and copies the rest of `platform_www` as assets.
 *
 * A configuration replaces array options instead of merging them, so the base `assets` and
 * `scripts` are repeated first. A non-array base value is treated as absent.
 *
 * @param appRoot the application's root, e.g. `apps/shop`
 * @param baseOptions the `build` target's base `options`
 */
export function buildLiveReloadBuildConfigurations(
  appRoot: string,
  baseOptions: Record<string, unknown>
): Record<string, { assets: unknown[]; scripts: unknown[] }> {
  const baseAssets = Array.isArray(baseOptions.assets) ? baseOptions.assets : [];
  const baseScripts = Array.isArray(baseOptions.scripts) ? baseOptions.scripts : [];

  return Object.fromEntries(
    LIVE_RELOAD_PLATFORMS.map((platform) => {
      const platformWww = `${appRoot}/platforms/${platform}/platform_www`;
      return [
        `live-${platform}`,
        {
          assets: [...baseAssets, { glob: '**/*', input: platformWww, output: './', ignore: ['cordova.js'] }],
          scripts: [...baseScripts, { input: `${platformWww}/cordova.js`, bundleName: 'cordova' }]
        }
      ];
    })
  );
}

/**
 * Builds the `live-android`/`live-ios` configurations of an app's `serve` target, each
 * pointing `buildTarget` at the `build` configuration of the same name.
 *
 * @param project the application's Nx project name
 */
export function buildLiveReloadServeConfigurations(project: string): Record<string, { buildTarget: string }> {
  return Object.fromEntries(
    LIVE_RELOAD_PLATFORMS.map((platform) => [`live-${platform}`, { buildTarget: `${project}:build:live-${platform}` }])
  );
}
