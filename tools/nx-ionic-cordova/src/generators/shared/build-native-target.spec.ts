import { buildArgv } from '../../executors/native/lib/build-argv';
import type { NativeExecutorSchema } from '../../executors/native/schema';
import { buildNativeTarget } from './build-native-target';
import { NATIVE_EXECUTOR } from './plugin-entry';

const IONIC_COMMAND_LINES: Record<string, string> = {
  'android-add': 'cordova platforms add android@15',
  'android-rm': 'cordova platform rm android',
  'android-build': 'cordova build android',
  'android-build-debug': 'cordova build android --debug',
  'android-build-prod': 'cordova build android --prod --release',
  'ios-add': 'cordova platforms add ios',
  'ios-rm': 'cordova platform rm ios',
  'ios-build': 'cordova build ios',
  'ios-build-debug': 'cordova build ios --prod --device --debug',
  'ios-build-prod': 'cordova build ios --prod --device --release',
  'live-android': 'cordova run android -l --device',
  'live-ios': 'cordova run ios -l --external --device',
  'install-android': 'cordova run android --device',
  'install-ios': 'cordova run ios --device',
  'plugin-add': 'cordova plugin add',
  'plugin-rm': 'cordova plugin rm'
};

const RESOURCE_COMMAND_LINES: Record<string, string> = {
  resgenerate: 'resources',
  'res-generate': '--copy',
  'res-generate-android': 'android --type adaptive-icon',
  'res-generate-ios': 'ios'
};

const configurationOf = (name: string) => buildNativeTarget().configurations?.[name] as NativeExecutorSchema;

describe('buildNativeTarget', () => {
  it('uses the plugin native executor id, a safe default command and ^build', () => {
    const target = buildNativeTarget();

    expect(target.executor).toBe(NATIVE_EXECUTOR);
    expect(target.executor).not.toContain('@bde');
    expect(target.options).toEqual({ command: 'info' });
    expect(target.dependsOn).toEqual(['^build']);
  });

  it.each(Object.entries(IONIC_COMMAND_LINES))('%s runs "ionic %s"', (name, commandLine) => {
    const configuration = configurationOf(name);

    expect(configuration.cli).toBe('ionic');
    expect(buildArgv(configuration).join(' ')).toBe(commandLine);
  });

  it.each(Object.entries(RESOURCE_COMMAND_LINES))('%s runs cordova-res %s', (name, commandLine) => {
    const configuration = configurationOf(name);

    expect(configuration.cli).toBe('cordova-res');
    expect(buildArgv(configuration).join(' ')).toBe(commandLine);
  });

  it('declares no per-environment configuration and no --buildConfig', () => {
    const configurations = buildNativeTarget().configurations ?? {};

    expect(Object.keys(configurations).filter((name) => /-(test|ante)$/.test(name))).toEqual([]);
    expect(JSON.stringify(configurations)).not.toMatch(/buildConfig|_ENV|_TEST|_ANTE|_PROD/);
  });

  it.each(['live-android', 'live-ios', 'install-android', 'install-ios'])(
    '%s deploys through the deploy option',
    (name) => {
      expect(configurationOf(name).deploy).toBe('device');
      expect(configurationOf(name).args).not.toContain('--device');
    }
  );
});
