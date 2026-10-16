import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { findWorkspaceRoot, resolveCliEntry, type ResolverDeps, spawnCli } from './resolve-cli';

const ROOT = '/ws';
const EXEC_PATH = '/usr/bin/node';

/** Builds injected deps backed by an in-memory map of package.json files. */
function fakeDeps(
  packages: Record<string, { bin?: string | Record<string, string> }>,
  overrides: Partial<ResolverDeps> = {}
): ResolverDeps {
  return {
    execPath: EXEC_PATH,
    resolve: (request) => {
      const pkg = request.replace(/\/package\.json$/, '');
      if (!(pkg in packages)) {
        throw Object.assign(new Error(`Cannot find module '${request}'`), {
          code: 'MODULE_NOT_FOUND'
        });
      }
      return `${ROOT}/node_modules/${request}`;
    },
    readJson: (file) => {
      const pkg = file.replace(`${ROOT}/node_modules/`, '').replace(/\/package\.json$/, '');
      return packages[pkg];
    },
    spawn: jest.fn(() => ({ status: 0 })),
    ...overrides
  };
}

describe('findWorkspaceRoot', () => {
  let base: string;

  beforeEach(() => {
    base = realpathSync(mkdtempSync(join(tmpdir(), 'resolve-cli-')));
  });

  it('climbs from a nested directory to the nearest nx.json', () => {
    const nested = join(base, 'apps', 'shop', 'src');
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(base, 'nx.json'), '{}');

    expect(findWorkspaceRoot(nested, {})).toBe(base);
  });

  it('prefers the nearest nx.json over one further up', () => {
    const inner = join(base, 'inner');
    mkdirSync(inner);
    writeFileSync(join(base, 'nx.json'), '{}');
    writeFileSync(join(inner, 'nx.json'), '{}');

    expect(findWorkspaceRoot(inner, {})).toBe(inner);
  });

  it('falls back to NX_WORKSPACE_ROOT when no nx.json is above cwd', () => {
    expect(findWorkspaceRoot(base, { NX_WORKSPACE_ROOT: '/from/env' }, () => false)).toBe('/from/env');
  });

  it('prefers nx.json over NX_WORKSPACE_ROOT', () => {
    writeFileSync(join(base, 'nx.json'), '{}');

    expect(findWorkspaceRoot(base, { NX_WORKSPACE_ROOT: '/from/env' })).toBe(base);
  });

  it('throws when neither source yields a root', () => {
    expect(() => findWorkspaceRoot(base, {}, () => false)).toThrow(/nx\.json/);
  });

  it('treats an empty NX_WORKSPACE_ROOT as unset', () => {
    expect(() => findWorkspaceRoot(base, { NX_WORKSPACE_ROOT: '' }, () => false)).toThrow(/NX_WORKSPACE_ROOT/);
  });
});

describe('resolveCliEntry', () => {
  it('reads a string bin', () => {
    const deps = fakeDeps({ cordova: { bin: './bin/cordova' } });

    expect(resolveCliEntry('cordova', 'cordova', ROOT, deps)).toBe(`${ROOT}/node_modules/cordova/bin/cordova`);
  });

  it('reads the named entry of an object bin', () => {
    const deps = fakeDeps({
      '@ionic/cli': { bin: { ionic: './bin/ionic', other: './bin/other' } }
    });

    expect(resolveCliEntry('@ionic/cli', 'ionic', ROOT, deps)).toBe(`${ROOT}/node_modules/@ionic/cli/bin/ionic`);
  });

  it('never points into node_modules/.bin', () => {
    const deps = fakeDeps({ cordova: { bin: './bin/cordova' } });

    expect(resolveCliEntry('cordova', 'cordova', ROOT, deps)).not.toContain('.bin');
  });

  it('resolves from the given root', () => {
    const resolve = jest.fn(() => `${ROOT}/node_modules/cordova/package.json`);
    const deps = fakeDeps(
      { cordova: { bin: './bin/cordova' } },
      { resolve, readJson: () => ({ bin: './bin/cordova' }) }
    );

    resolveCliEntry('cordova', 'cordova', ROOT, deps);

    expect(resolve).toHaveBeenCalledWith('cordova/package.json', {
      paths: [ROOT]
    });
  });

  it('names the package when it is not installed', () => {
    const deps = fakeDeps({});

    expect(() => resolveCliEntry('cordova-res', 'cordova-res', ROOT, deps)).toThrow(/cordova-res/);
  });

  it('names the bin when the package does not declare it', () => {
    const deps = fakeDeps({ '@ionic/cli': { bin: { other: './x' } } });

    expect(() => resolveCliEntry('@ionic/cli', 'ionic', ROOT, deps)).toThrow(/ionic/);
  });

  it('falls back to the package main entry when exports hides package.json', () => {
    const blocked = Object.assign(new Error('not exported'), {
      code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    });
    const deps = fakeDeps(
      {},
      {
        resolve: (request) => {
          if (request === 'sealed/package.json') {
            throw blocked;
          }
          return `${ROOT}/node_modules/sealed/lib/index.js`;
        },
        readJson: (file) => {
          if (file === `${ROOT}/node_modules/sealed/package.json`) {
            return { name: 'sealed', bin: './bin/sealed.js' };
          }
          throw new Error(`ENOENT ${file}`);
        }
      }
    );

    expect(resolveCliEntry('sealed', 'sealed', ROOT, deps)).toBe(`${ROOT}/node_modules/sealed/bin/sealed.js`);
  });
});

describe('spawnCli', () => {
  const opts = { root: ROOT, cwd: `${ROOT}/apps/shop` };

  it('spawns process.execPath with the resolved entry first', () => {
    const deps = fakeDeps({ cordova: { bin: './bin/cordova' } });

    spawnCli('cordova', 'cordova', ['build', 'android'], opts, deps);

    expect(deps.spawn).toHaveBeenCalledWith(
      EXEC_PATH,
      [`${ROOT}/node_modules/cordova/bin/cordova`, 'build', 'android'],
      expect.objectContaining({
        cwd: opts.cwd,
        shell: false,
        stdio: 'inherit'
      })
    );
  });

  it('keeps shell metacharacters inside a single argv element', () => {
    const deps = fakeDeps({ cordova: { bin: './bin/cordova' } });
    const spec = 'plugin@1; rm -rf / && echo $(id)';

    spawnCli('cordova', 'cordova', ['plugin', 'add', spec], opts, deps);

    const [, args, options] = (deps.spawn as jest.Mock).mock.calls[0];
    expect(args).toHaveLength(4);
    expect(args[3]).toBe(spec);
    expect(options.shell).toBe(false);
  });

  it('returns the child exit status', () => {
    const deps = fakeDeps({ cordova: { bin: './bin/cordova' } }, { spawn: jest.fn(() => ({ status: 3 })) });

    expect(spawnCli('cordova', 'cordova', [], opts, deps)).toBe(3);
  });

  it('returns 1 when the child reports no status', () => {
    const deps = fakeDeps({ cordova: { bin: './bin/cordova' } }, { spawn: jest.fn(() => ({ status: null })) });

    expect(spawnCli('cordova', 'cordova', [], opts, deps)).toBe(1);
  });

  it('spawns nothing when the CLI cannot be resolved', () => {
    const deps = fakeDeps({});

    expect(() => spawnCli('cordova', 'cordova', [], opts, deps)).toThrow(/cordova/);
    expect(deps.spawn).not.toHaveBeenCalled();
  });
});
