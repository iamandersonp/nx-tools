import {
  buildLiveReloadBuildConfigurations,
  buildLiveReloadServeConfigurations
} from './build-live-reload-configurations';

const platformAssets = (root: string, platform: string) => ({
  glob: '**/*',
  input: `${root}/platforms/${platform}/platform_www`,
  output: './',
  ignore: ['cordova.js']
});
const cordovaScript = (root: string, platform: string) => ({
  input: `${root}/platforms/${platform}/platform_www/cordova.js`,
  bundleName: 'cordova'
});

describe('buildLiveReloadBuildConfigurations', () => {
  it('declares one live-<platform> configuration per Cordova platform', () => {
    expect(Object.keys(buildLiveReloadBuildConfigurations('apps/asb', {}))).toEqual(['live-android', 'live-ios']);
  });

  it('registers cordova.js as the global script and copies the rest of platform_www', () => {
    const configurations = buildLiveReloadBuildConfigurations('apps/asb', {});

    expect(configurations['live-android'].scripts).toEqual([cordovaScript('apps/asb', 'android')]);
    expect(configurations['live-android'].assets).toEqual([platformAssets('apps/asb', 'android')]);
    expect(configurations['live-ios'].scripts).toEqual([cordovaScript('apps/asb', 'ios')]);
  });

  it('follows the app root', () => {
    const configurations = buildLiveReloadBuildConfigurations('applications/shop', {});

    expect(configurations['live-ios'].assets).toEqual([platformAssets('applications/shop', 'ios')]);
  });

  it('keeps the base assets and scripts first, because a configuration replaces arrays', () => {
    const appAsset = { glob: '**/*', input: 'apps/asb/src/assets', output: 'assets' };
    const configurations = buildLiveReloadBuildConfigurations('apps/asb', { assets: [appAsset], scripts: ['a.js'] });

    expect(configurations['live-android'].assets).toEqual([appAsset, platformAssets('apps/asb', 'android')]);
    expect(configurations['live-android'].scripts).toEqual(['a.js', cordovaScript('apps/asb', 'android')]);
  });

  it('ignores a base assets or scripts value that is not an array', () => {
    const configurations = buildLiveReloadBuildConfigurations('apps/asb', { assets: 'x', scripts: undefined });

    expect(configurations['live-android'].assets).toHaveLength(1);
    expect(configurations['live-android'].scripts).toHaveLength(1);
  });
});

describe('buildLiveReloadServeConfigurations', () => {
  it('points each live-<platform> serve configuration at the matching build configuration', () => {
    expect(buildLiveReloadServeConfigurations('shop')).toEqual({
      'live-android': { buildTarget: 'shop:build:live-android' },
      'live-ios': { buildTarget: 'shop:build:live-ios' }
    });
  });
});
