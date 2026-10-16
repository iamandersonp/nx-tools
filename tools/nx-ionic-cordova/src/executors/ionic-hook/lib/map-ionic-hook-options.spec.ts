import { mapIonicHookToNxTarget } from './map-ionic-hook-options';

describe('mapIonicHookToNxTarget', () => {
  it('maps a build with a platform to ionic-cordova-build and forwards the platform', () => {
    expect(mapIonicHookToNxTarget({ hook: 'build', platform: 'android', configuration: 'production' })).toEqual({
      target: 'ionic-cordova-build',
      configuration: 'production',
      options: { platform: 'android' }
    });
  });

  it('maps a build without a platform to the plain build target', () => {
    expect(mapIonicHookToNxTarget({ hook: 'build', configuration: 'production' })).toEqual({
      target: 'build',
      configuration: 'production',
      options: {}
    });
  });

  it('maps a serve with a platform to live-<platform>, forwarding only host and port', () => {
    expect(mapIonicHookToNxTarget({ hook: 'serve', host: '0.0.0.0', port: 8100, platform: 'ios' })).toEqual({
      target: 'serve',
      configuration: 'live-ios',
      options: { host: '0.0.0.0', port: 8100 }
    });
  });

  it('maps a serve without a platform to the plain serve target and keeps the configuration', () => {
    expect(mapIonicHookToNxTarget({ hook: 'serve', configuration: 'production' })).toEqual({
      target: 'serve',
      configuration: 'production',
      options: {}
    });
  });

  it('throws naming both when a platform serve also requests a configuration', () => {
    expect(() => mapIonicHookToNxTarget({ hook: 'serve', platform: 'android', configuration: 'production' })).toThrow(
      /'live-android'.*'production'/
    );
  });
});
