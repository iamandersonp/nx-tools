import { type IonicHookDeps, runIonicHook } from './ionic-hook';

function makeDeps(overrides: Partial<IonicHookDeps> = {}): IonicHookDeps {
  return {
    findRoot: jest.fn(() => '/ws'),
    spawnCli: jest.fn(() => 0),
    error: jest.fn(),
    ...overrides
  };
}

describe('runIonicHook', () => {
  it('prints usage and exits 1 without a target, spawning nothing', () => {
    const deps = makeDeps();

    expect(runIonicHook([], deps)).toBe(1);
    expect(deps.error).toHaveBeenCalledWith(expect.stringContaining('expected a target'));
    expect(deps.spawnCli).not.toHaveBeenCalled();
  });

  it('exits 1 with the resolver message when no workspace root is found', () => {
    const deps = makeDeps({
      findRoot: jest.fn(() => {
        throw new Error('no workspace');
      })
    });

    expect(runIonicHook(['shop:ionic-hook-build'], deps)).toBe(1);
    expect(deps.error).toHaveBeenCalledWith(expect.stringContaining('no workspace'));
    expect(deps.spawnCli).not.toHaveBeenCalled();
  });

  it('runs the nx package bin from the workspace root with normalized args and returns its exit status', () => {
    const deps = makeDeps({ spawnCli: jest.fn(() => 3) });

    const code = runIonicHook(['shop:ionic-hook-build', '--project=app', '-c', 'dev'], deps);

    expect(code).toBe(3);
    expect(deps.spawnCli).toHaveBeenCalledWith(
      'nx',
      'nx',
      ['run', 'shop:ionic-hook-build', '--buildConfiguration=dev'],
      { root: '/ws', cwd: '/ws' }
    );
  });
});
