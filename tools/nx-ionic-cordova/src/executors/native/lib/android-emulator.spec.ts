import { listRunningEmulators, parseRunningEmulators, resolveAdbPath } from './android-emulator';

const HEADER = 'List of devices attached';

describe('parseRunningEmulators', () => {
  it('returns the one running emulator serial', () => {
    const output = [HEADER, 'emulator-5554\tdevice', ''].join('\n');

    expect(parseRunningEmulators(output)).toEqual(['emulator-5554']);
  });

  it('returns every running emulator, in adb order', () => {
    const output = [HEADER, 'emulator-5556\tdevice', 'emulator-5554\tdevice', ''].join('\n');

    expect(parseRunningEmulators(output)).toEqual(['emulator-5556', 'emulator-5554']);
  });

  it('returns nothing when only the header is listed', () => {
    expect(parseRunningEmulators(`${HEADER}\n\n`)).toEqual([]);
  });

  it('ignores emulators whose state is not exactly device', () => {
    const output = [HEADER, 'emulator-5554\toffline', 'emulator-5556\tunauthorized', 'emulator-5558\tdevice', ''].join(
      '\n'
    );

    expect(parseRunningEmulators(output)).toEqual(['emulator-5558']);
  });

  it('ignores physical devices, blank lines and CRLF endings', () => {
    const output = [
      HEADER,
      '',
      'R58M123ABC\tdevice',
      '   ',
      'emulator-5554    device product:sdk_gphone16k_x86_64 model:sdk_gphone16k_x86_64 device:emu64xa16k transport_id:1',
      ''
    ].join('\r\n');

    expect(parseRunningEmulators(output)).toEqual(['emulator-5554']);
  });

  it('ignores serials that only look like an emulator', () => {
    const output = [HEADER, 'emulator-abc\tdevice', 'my-emulator-5554\tdevice', ''].join('\n');

    expect(parseRunningEmulators(output)).toEqual([]);
  });
});

describe('resolveAdbPath', () => {
  it('prefers ANDROID_HOME', () => {
    expect(
      resolveAdbPath({
        ANDROID_HOME: '/sdk/home',
        ANDROID_SDK_ROOT: '/sdk/root'
      })
    ).toBe('/sdk/home/platform-tools/adb');
  });

  it('falls back to ANDROID_SDK_ROOT', () => {
    expect(resolveAdbPath({ ANDROID_SDK_ROOT: '/sdk/root' })).toBe('/sdk/root/platform-tools/adb');
  });

  it('falls back to adb on PATH when neither is set', () => {
    expect(resolveAdbPath({})).toBe('adb');
  });

  it('treats an empty ANDROID_HOME as unset', () => {
    expect(
      resolveAdbPath({
        ANDROID_HOME: '',
        ANDROID_SDK_ROOT: '/sdk/root'
      })
    ).toBe('/sdk/root/platform-tools/adb');
  });
});

describe('listRunningEmulators', () => {
  it('runs adb devices through the resolved binary and parses its output', () => {
    const run = jest.fn().mockReturnValue(`${HEADER}\nemulator-5554\tdevice\n`);

    const serials = listRunningEmulators({ ANDROID_HOME: '/sdk' }, run);

    expect(run).toHaveBeenCalledWith('/sdk/platform-tools/adb', ['devices']);
    expect(serials).toEqual(['emulator-5554']);
  });

  it('returns nothing when adb fails or is missing', () => {
    const run = jest.fn().mockImplementation(() => {
      throw new Error('spawnSync adb ENOENT');
    });

    expect(listRunningEmulators({}, run)).toEqual([]);
  });
});
