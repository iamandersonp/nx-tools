import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { type ExecutorContext, logger } from '@nx/devkit';

import runExecutor from './executor';
import type { SonarExecutorSchema } from './schema';

jest.mock('node:child_process');
jest.mock('node:fs');
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}));

const mockedSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>;
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedInfo = logger.info as jest.MockedFunction<typeof logger.info>;
const mockedWarn = logger.warn as jest.MockedFunction<typeof logger.warn>;
const mockedError = logger.error as jest.MockedFunction<typeof logger.error>;

/**
 * Builds a minimal `ExecutorContext` fixture for the project at
 * `libs/x`.
 *
 * @return an `ExecutorContext` fixture
 */
function createContext(): ExecutorContext {
  return {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName: 'x',
    targetName: 'sonar',
    projectsConfigurations: {
      version: 2,
      projects: {
        x: { root: 'libs/x', sourceRoot: 'libs/x/src' }
      }
    },
    nxJsonConfiguration: {},
    projectGraph: { nodes: {}, dependencies: {} }
  } as unknown as ExecutorContext;
}

/**
 * Returns a spawnSync-shaped result with the given exit status.
 *
 * @param status the exit status to report
 * @return a `spawnSync`-shaped stub
 */
function spawnResult(status: number | null): ReturnType<typeof spawnSync> {
  return {
    status,
    pid: 1,
    output: [],
    stdout: Buffer.from(''),
    stderr: Buffer.from(''),
    signal: null
  } as unknown as ReturnType<typeof spawnSync>;
}

/**
 * Runs the executor for the `libs/x` fixture.
 *
 * @param options the executor options; the key defaults to `K`
 * @return the executor result
 */
function run(options: Partial<SonarExecutorSchema> = {}): Promise<{ success: boolean }> {
  return runExecutor({ projectKey: 'K', ...options }, createContext()) as Promise<{ success: boolean }>;
}

describe('sonar executor', () => {
  beforeEach(() => {
    mockedSpawnSync.mockReset();
    mockedSpawnSync.mockReturnValue(spawnResult(0));
    mockedExistsSync.mockReset();
    mockedExistsSync.mockReturnValue(true);
    mockedInfo.mockReset();
    mockedWarn.mockReset();
    mockedError.mockReset();
  });

  describe('the scanner is spawned without a shell', () => {
    it('runs the workspace-local binary from the workspace root with inherited stdio and no shell', async () => {
      await run();

      expect(mockedSpawnSync).toHaveBeenCalledTimes(1);
      const [binary, , spawnOptions] = mockedSpawnSync.mock.calls[0];
      expect(binary).toBe('/workspace/node_modules/.bin/sonar-scanner-npm');
      expect(spawnOptions).toEqual({
        cwd: '/workspace',
        stdio: 'inherit'
      });
      expect(spawnOptions).not.toHaveProperty('shell');
    });

    it('passes every effective property as one -D argv entry, never through npx', async () => {
      await run({ extraExclusions: ['dir with space/**'] });

      const [binary, args] = mockedSpawnSync.mock.calls[0];
      expect(binary).not.toContain('npx');
      expect(args).toContain('-Dsonar.projectKey=K');
      expect(args).toContain('-Dsonar.projectBaseDir=/workspace/libs/x');
      expect(args).toContain('-Dsonar.exclusions=**/*.spec.ts,dir with space/**');
      expect((args as string[]).every((arg) => arg.startsWith('-Dsonar.'))).toBe(true);
    });
  });

  describe('exit-code mapping', () => {
    it.each([
      [0, true],
      [1, false],
      [null, false]
    ])('maps exit status %s to success: %s', async (status, success) => {
      mockedSpawnSync.mockReturnValue(spawnResult(status));

      expect(await run()).toEqual({ success });
    });
  });

  describe('scanner execution errors', () => {
    it('reports a missing executable and returns failure', async () => {
      mockedSpawnSync.mockReturnValue({
        ...spawnResult(null),
        error: new Error('spawn sonar-scanner-npm ENOENT')
      });

      await expect(run()).resolves.toEqual({ success: false });
      expect(mockedError).toHaveBeenCalledWith('Could not execute the Sonar scanner: spawn sonar-scanner-npm ENOENT');
    });
  });

  describe('dryRun', () => {
    it('logs every effective property as a key=value line, reports success and never spawns', async () => {
      const result = await run({ dryRun: true });

      expect(result).toEqual({ success: true });
      expect(mockedSpawnSync).not.toHaveBeenCalled();
      expect(mockedInfo).toHaveBeenCalledWith('sonar.projectKey=K');
      expect(mockedInfo).toHaveBeenCalledWith('sonar.projectBaseDir=/workspace/libs/x');
      expect(mockedInfo).toHaveBeenCalledWith('sonar.exclusions=**/*.spec.ts');
    });

    it('logs nothing and spawns when it is not a dry run', async () => {
      await run({ dryRun: false });

      expect(mockedInfo).not.toHaveBeenCalled();
      expect(mockedSpawnSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('a missing coverage report', () => {
    it('warns naming the absolute path and still spawns, following the exit code', async () => {
      mockedExistsSync.mockImplementation((path) => !String(path).endsWith('lcov.info'));
      mockedSpawnSync.mockReturnValue(spawnResult(1));

      const result = await run();

      expect(mockedWarn).toHaveBeenCalledTimes(1);
      expect(mockedWarn).toHaveBeenCalledWith(expect.stringContaining('/workspace/libs/x/coverage/lcov.info'));
      expect(mockedSpawnSync).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: false });
    });

    it('does not warn when the report exists', async () => {
      await run();

      expect(mockedWarn).not.toHaveBeenCalled();
    });
  });

  describe('an invalid projectKey', () => {
    it('rejects an empty key without spawning', async () => {
      await expect(run({ projectKey: '' })).rejects.toThrow(/projectKey/);
      expect(mockedSpawnSync).not.toHaveBeenCalled();
    });
  });

  describe('token isolation', () => {
    const original = {
      token: process.env.SONAR_TOKEN,
      host: process.env.SONAR_HOST_URL
    };

    beforeEach(() => {
      process.env.SONAR_TOKEN = 'token-value-123';
      process.env.SONAR_HOST_URL = 'https://sonar.invalid';
    });

    afterEach(() => {
      for (const [name, value] of [
        ['SONAR_TOKEN', original.token],
        ['SONAR_HOST_URL', original.host]
      ] as const) {
        if (value === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = value;
        }
      }
    });

    it.each([[false], [true]])(
      'puts neither name nor value in the arguments or the logs (dryRun: %s)',
      async (dryRun) => {
        mockedExistsSync.mockReturnValue(false);

        await run({ dryRun });

        const everything = JSON.stringify([mockedSpawnSync.mock.calls, mockedInfo.mock.calls, mockedWarn.mock.calls]);
        expect(everything).toContain('sonar.projectKey=K');
        for (const secret of ['SONAR_TOKEN', 'SONAR_HOST_URL', 'token-value-123', 'sonar.invalid']) {
          expect(everything).not.toContain(secret);
        }
      }
    );
  });
});
