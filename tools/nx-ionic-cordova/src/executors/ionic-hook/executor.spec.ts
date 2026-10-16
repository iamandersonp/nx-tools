import { type ExecutorContext, runExecutor as runNxExecutor } from '@nx/devkit';

import runExecutor from './executor';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  runExecutor: jest.fn()
}));

const mockedRunNxExecutor = runNxExecutor as jest.MockedFunction<typeof runNxExecutor>;

function createContext(projectName?: string, configurationName?: string): ExecutorContext {
  return { root: '/workspace', cwd: '/workspace', isVerbose: false, projectName, configurationName } as ExecutorContext;
}

async function* iteratorOf(...results: Array<{ success: boolean }>): AsyncGenerator<{ success: boolean }> {
  yield* results;
}

describe('ionic-hook executor', () => {
  beforeEach(() => {
    mockedRunNxExecutor.mockReset();
    mockedRunNxExecutor.mockImplementation(async () => iteratorOf({ success: true }));
  });

  it('runs the web build target under the context configuration', async () => {
    const result = await runExecutor({ hook: 'build' }, createContext('shop', 'production'));

    expect(mockedRunNxExecutor).toHaveBeenCalledWith(
      { project: 'shop', target: 'build', configuration: 'production' },
      {},
      expect.anything()
    );
    expect(result).toEqual({ success: true });
  });

  it('runs ionic-cordova-build with the platform, preferring buildConfiguration over the context', async () => {
    await runExecutor(
      { hook: 'build', platform: 'android', buildConfiguration: 'ante' },
      createContext('shop', 'prod')
    );

    expect(mockedRunNxExecutor).toHaveBeenCalledWith(
      { project: 'shop', target: 'ionic-cordova-build', configuration: 'ante' },
      { platform: 'android' },
      expect.anything()
    );
  });

  it('runs serve under live-<platform> with host and port only', async () => {
    await runExecutor({ hook: 'serve', host: '0.0.0.0', port: 8100, platform: 'ios' }, createContext('shop'));

    expect(mockedRunNxExecutor).toHaveBeenCalledWith(
      { project: 'shop', target: 'serve', configuration: 'live-ios' },
      { host: '0.0.0.0', port: 8100 },
      expect.anything()
    );
  });

  it('throws and runs nothing when a platform serve also gets a configuration', async () => {
    await expect(
      runExecutor({ hook: 'serve', platform: 'android' }, createContext('shop', 'production'))
    ).rejects.toThrow(/'live-android'.*'production'/);
    expect(mockedRunNxExecutor).not.toHaveBeenCalled();
  });

  describe('PORT', () => {
    const original = process.env.PORT;
    let seen: string | undefined;

    beforeEach(() => {
      process.env.PORT = '300';
      mockedRunNxExecutor.mockImplementation(async () => {
        seen = process.env.PORT;
        return iteratorOf({ success: true });
      });
    });

    afterEach(() => {
      if (original === undefined) {
        delete process.env.PORT;
      } else {
        process.env.PORT = original;
      }
    });

    it('is set to the serve port before the target runs', async () => {
      await runExecutor({ hook: 'serve', port: 8100 }, createContext('shop'));

      expect(seen).toBe('8100');
    });

    it('is left untouched for a serve without a port or a build with one', async () => {
      await runExecutor({ hook: 'serve' }, createContext('shop'));
      expect(seen).toBe('300');

      await runExecutor({ hook: 'build', port: 8100 }, createContext('shop'));
      expect(seen).toBe('300');
    });
  });

  it('returns success false when any yielded result fails', async () => {
    mockedRunNxExecutor.mockImplementation(async () => iteratorOf({ success: true }, { success: false }));

    expect(await runExecutor({ hook: 'build' }, createContext('shop'))).toEqual({ success: false });
  });

  it('throws when the context has no projectName', async () => {
    await expect(runExecutor({ hook: 'build' }, createContext())).rejects.toThrow('projectName');
    expect(mockedRunNxExecutor).not.toHaveBeenCalled();
  });
});
