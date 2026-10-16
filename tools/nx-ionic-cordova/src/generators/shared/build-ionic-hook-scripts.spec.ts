import { buildIonicHookScripts } from './build-ionic-hook-scripts';

describe('buildIonicHookScripts', () => {
  it('runs the nx-ionic-hook bin against the app hook targets', () => {
    expect(buildIonicHookScripts('shop')).toEqual({
      'ionic:build': 'nx-ionic-hook shop:ionic-hook-build',
      'ionic:serve': 'nx-ionic-hook shop:ionic-hook-serve'
    });
  });

  it('carries no swc-register and no relative path to the plugin', () => {
    const scripts = Object.values(buildIonicHookScripts('shop')).join(' ');

    expect(scripts).not.toMatch(/swc|\.\.\/|tools\//);
  });
});
