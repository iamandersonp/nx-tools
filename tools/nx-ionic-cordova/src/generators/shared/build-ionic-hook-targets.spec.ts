import { buildIonicHookTargets } from './build-ionic-hook-targets';
import { IONIC_HOOK_EXECUTOR } from './plugin-entry';

describe('buildIonicHookTargets', () => {
  it('declares build and serve targets on the plugin ionic-hook executor, ordered after ^build', () => {
    expect(buildIonicHookTargets()).toEqual({
      'ionic-hook-build': { executor: IONIC_HOOK_EXECUTOR, options: { hook: 'build' }, dependsOn: ['^build'] },
      'ionic-hook-serve': { executor: IONIC_HOOK_EXECUTOR, options: { hook: 'serve' }, dependsOn: ['^build'] }
    });
  });

  it('uses no private scope', () => {
    expect(JSON.stringify(buildIonicHookTargets())).not.toContain('@bde');
  });
});
