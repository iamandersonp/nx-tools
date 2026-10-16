import { type ExecutorContext, logger } from '@nx/devkit';

import { spawnCli } from '../../shared/resolve-cli';
import runExecutor from './executor';
import { listRunningEmulators } from './lib/android-emulator';

jest.mock('../../shared/resolve-cli');
jest.mock('./lib/android-emulator');

const mockedSpawnCli = spawnCli as jest.MockedFunction<typeof spawnCli>;
const mockedListEmulators = listRunningEmulators as jest.MockedFunction<typeof listRunningEmulators>;

function createContext(projectName: string | undefined, projectRoot = 'apps/shop'): ExecutorContext {
  return {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName,
    projectsConfigurations: { version: 2, projects: { shop: { root: projectRoot } } }
  } as unknown as ExecutorContext;
}

describe('native executor', () => {
  beforeEach(() => {
    mockedSpawnCli.mockReset();
    mockedSpawnCli.mockReturnValue(0);
    mockedListEmulators.mockReset();
    mockedListEmulators.mockReturnValue([]);
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('spawns the default cordova CLI at the project root with the built argv', async () => {
    const result = await runExecutor({ command: 'build', platform: 'android' }, createContext('shop'));

    expect(result).toEqual({ success: true });
    expect(mockedSpawnCli).toHaveBeenCalledWith('cordova', 'cordova', ['build', 'android'], {
      root: '/workspace',
      cwd: '/workspace/apps/shop'
    });
  });

  it.each([
    ['ionic', '@ionic/cli', 'ionic'],
    ['cordova-res', 'cordova-res', 'cordova-res'],
    ['cordova', 'cordova', 'cordova']
  ] as const)('maps cli %s to package %s and bin %s', async (cli, pkg, bin) => {
    await runExecutor({ cli, command: 'x' }, createContext('shop'));

    expect(mockedSpawnCli).toHaveBeenCalledWith(pkg, bin, ['x'], expect.any(Object));
  });

  it('reports failure when the child exits non-zero', async () => {
    mockedSpawnCli.mockReturnValue(1);

    await expect(runExecutor({ command: 'build' }, createContext('shop'))).resolves.toEqual({ success: false });
  });

  it('returns failure naming the CLI when it cannot be resolved', async () => {
    mockedSpawnCli.mockImplementation(() => {
      throw new Error('Cannot find the package "@ionic/cli" from "/workspace".');
    });

    const result = await runExecutor({ cli: 'ionic', command: 'build' }, createContext('shop'));

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('@ionic/cli'));
  });

  it('throws when no project is invoking, spawning nothing', async () => {
    await expect(runExecutor({ command: 'build' }, createContext(undefined))).rejects.toThrow(
      /requires an invoking project/
    );
    expect(mockedSpawnCli).not.toHaveBeenCalled();
  });

  describe('Android emulator targeting', () => {
    const run = (overrides: Record<string, unknown> = {}) =>
      runExecutor({ command: 'run', platform: 'android', deploy: 'emulator', ...overrides }, createContext('shop'));
    const argvOfSpawn = () => mockedSpawnCli.mock.calls[0][2];

    it('targets the first running emulator, last in the vector', async () => {
      mockedListEmulators.mockReturnValue(['emulator-5554']);

      await run();

      expect(argvOfSpawn()).toEqual(['run', 'android', '--emulator', '--target=emulator-5554']);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('logs the ignored emulators when several are running', async () => {
      mockedListEmulators.mockReturnValue(['emulator-5554', 'emulator-5556']);

      await run();

      expect(argvOfSpawn()).toContain('--target=emulator-5554');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('emulator-5556'));
    });

    it('detects android from args when platform is unset', async () => {
      mockedListEmulators.mockReturnValue(['emulator-5554']);

      await run({ platform: undefined, args: ['android'] });

      expect(argvOfSpawn()).toContain('--target=emulator-5554');
    });

    it('proceeds with plain --emulator and warns once when none is running or adb fails', async () => {
      const result = await run();

      expect(result).toEqual({ success: true });
      expect(argvOfSpawn()).toEqual(['run', 'android', '--emulator']);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['device deploy', { deploy: 'device' }],
      ['ios platform', { platform: 'ios' }],
      ['unset deploy', { deploy: undefined }]
    ])('does not query adb for %s', async (_label, overrides) => {
      await run(overrides);

      expect(mockedListEmulators).not.toHaveBeenCalled();
      expect(argvOfSpawn().some((a) => a.startsWith('--target'))).toBe(false);
    });
  });

  describe('plugin add and remove', () => {
    it('passes the plugin spec as one argv element, never shell-split', async () => {
      const spec = 'cordova-plugin-x; rm -rf / && echo $(id)';

      await runExecutor(
        { cli: 'ionic', command: 'cordova', args: ['plugin', 'add'], plugin: spec },
        createContext('shop')
      );

      expect(mockedSpawnCli.mock.calls[0][2]).toEqual(['cordova', 'plugin', 'add', spec]);
      expect(mockedListEmulators).not.toHaveBeenCalled();
    });

    it('invents no plugin argument when --plugin is omitted', async () => {
      await runExecutor({ cli: 'ionic', command: 'cordova', args: ['plugin', 'rm'] }, createContext('shop'));

      expect(mockedSpawnCli.mock.calls[0][2]).toEqual(['cordova', 'plugin', 'rm']);
    });
  });
});
