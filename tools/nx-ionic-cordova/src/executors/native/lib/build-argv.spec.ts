import { buildArgv } from './build-argv';

describe('buildArgv emulator target', () => {
  it('appends --target=<serial> after --emulator when a serial is given', () => {
    expect(
      buildArgv(
        {
          command: 'cordova',
          args: ['run', 'android', '-l'],
          deploy: 'emulator'
        },
        'emulator-5554'
      )
    ).toEqual(['cordova', 'run', 'android', '-l', '--emulator', '--target=emulator-5554']);
  });

  it('keeps plain --emulator when no serial is given', () => {
    expect(
      buildArgv({
        command: 'cordova',
        args: ['run', 'android'],
        deploy: 'emulator'
      })
    ).toEqual(['cordova', 'run', 'android', '--emulator']);
  });

  it('ignores a serial when deploy is device', () => {
    expect(
      buildArgv(
        {
          command: 'cordova',
          args: ['run', 'android'],
          deploy: 'device'
        },
        'emulator-5554'
      )
    ).toEqual(['cordova', 'run', 'android', '--device']);
  });

  it('ignores a serial when deploy is unset', () => {
    expect(buildArgv({ command: 'cordova', args: ['build', 'android'] }, 'emulator-5554')).toEqual([
      'cordova',
      'build',
      'android'
    ]);
  });
});

describe('buildArgv plugin spec', () => {
  it('appends the plugin spec right after the extra arguments', () => {
    expect(
      buildArgv({
        command: 'cordova',
        args: ['plugin', 'add'],
        plugin: 'cordova-plugin-x'
      })
    ).toEqual(['cordova', 'plugin', 'add', 'cordova-plugin-x']);
  });

  it('places the plugin spec before the platform and the deploy flag', () => {
    expect(
      buildArgv({
        command: 'cordova',
        args: ['plugin', 'rm'],
        plugin: 'cordova-plugin-x',
        platform: 'android',
        deploy: 'device'
      })
    ).toEqual(['cordova', 'plugin', 'rm', 'cordova-plugin-x', 'android', '--device']);
  });

  it('keeps a git URL plugin spec as one argument, never split or interpolated', () => {
    const spec = 'https://github.com/org/cordova-plugin-x.git#v1.0.0';

    expect(
      buildArgv({
        command: 'cordova',
        args: ['plugin', 'add'],
        plugin: spec
      })
    ).toEqual(['cordova', 'plugin', 'add', spec]);
  });

  it('appends no plugin spec when plugin is unset', () => {
    expect(
      buildArgv({
        command: 'cordova',
        args: ['plugin', 'add']
      })
    ).toEqual(['cordova', 'plugin', 'add']);
  });
});
