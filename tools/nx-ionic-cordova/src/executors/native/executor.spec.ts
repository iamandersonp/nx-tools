import { type ExecutorContext, logger } from '@nx/devkit';

import { spawnCli } from '../../shared/resolve-cli';
import runExecutor from './executor';

jest.mock('../../shared/resolve-cli');

const mockedSpawnCli = spawnCli as jest.MockedFunction<typeof spawnCli>;

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
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
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
});
