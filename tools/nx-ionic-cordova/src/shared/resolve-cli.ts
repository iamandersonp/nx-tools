import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, dirname, join, resolve as resolvePath } from 'node:path';

/** The slice of a `package.json` the resolver reads. */
interface PackageManifest {
  name?: string;
  bin?: string | Record<string, string>;
}

/** Everything the resolver needs from the outside world, injectable for tests. */
export interface ResolverDeps {
  /** Node's `require.resolve(request, { paths })`. */
  resolve: (request: string, options: { paths: string[] }) => string;
  /** Reads and parses a JSON file. */
  readJson: (file: string) => PackageManifest;
  /** `spawnSync` reduced to what the resolver uses. */
  spawn: (
    command: string,
    args: string[],
    options: { cwd: string; shell: false; stdio: 'inherit'; env: NodeJS.ProcessEnv }
  ) => { status: number | null };
  /** The Node binary that runs the resolved CLI entry. */
  execPath: string;
  /** The environment the child inherits. */
  env: NodeJS.ProcessEnv;
}

const defaultDeps: ResolverDeps = {
  resolve: (request, options) => require.resolve(request, options),
  readJson: (file) => JSON.parse(readFileSync(file, 'utf8')),
  spawn: (command, args, options) => spawnSync(command, args, options),
  execPath: process.execPath,
  env: process.env
};

/**
 * Finds the workspace root: the nearest directory at or above `cwd` that
 * holds an `nx.json`, else `NX_WORKSPACE_ROOT` (an empty value counts as
 * unset). Climbing from `cwd` rather than from this file keeps it correct
 * when the plugin lives under `node_modules`.
 */
export function findWorkspaceRoot(
  cwd: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
  exists: (path: string) => boolean = existsSync
): string {
  let dir = resolvePath(cwd);
  for (;;) {
    if (exists(join(dir, 'nx.json'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  if (env['NX_WORKSPACE_ROOT']) {
    return env['NX_WORKSPACE_ROOT'];
  }
  throw new Error(
    `Could not find the workspace root: no nx.json at or above "${cwd}" and NX_WORKSPACE_ROOT is not set.`
  );
}

/**
 * Locates `<pkg>/package.json` from `root`. When the package's `exports`
 * map hides it, resolves the package's main entry and climbs to the
 * directory whose manifest carries the package name.
 */
function locateManifest(pkg: string, root: string, deps: ResolverDeps): { file: string; manifest: PackageManifest } {
  try {
    const file = deps.resolve(`${pkg}/package.json`, { paths: [root] });
    return { file, manifest: deps.readJson(file) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      throw new Error(`Cannot find the package "${pkg}" from "${root}". Install it in the workspace.`, {
        cause: error
      });
    }
  }

  let dir = dirname(deps.resolve(pkg, { paths: [root] }));
  for (;;) {
    const file = join(dir, 'package.json');
    try {
      const manifest = deps.readJson(file);
      if (manifest.name === pkg) {
        return { file, manifest };
      }
    } catch {
      // No manifest in this directory; keep climbing.
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`Cannot find the package.json of "${pkg}" from "${root}".`);
    }
    dir = parent;
  }
}

/**
 * Resolves the JavaScript entry file of `binName` in package `pkg` by
 * reading the package's own `bin` field, never `node_modules/.bin`.
 */
export function resolveCliEntry(pkg: string, binName: string, root: string, deps: ResolverDeps = defaultDeps): string {
  const { file, manifest } = locateManifest(pkg, root, deps);
  const bin = manifest.bin;
  const entry = typeof bin === 'string' ? bin : bin?.[binName];
  if (!entry) {
    throw new Error(`The package "${pkg}" does not declare a "${binName}" bin.`);
  }
  return resolvePath(dirname(file), entry);
}

/**
 * Copies `env` with `<root>/node_modules/.bin` prepended to its PATH, keeping the
 * existing key casing (`Path` on Windows). `@ionic/cli` finds `native-run` through
 * `which` on PATH, so workspace-local binaries must be visible there. This only
 * extends the child's environment; the spawned command is never taken from `.bin`.
 */
function withWorkspaceBin(env: NodeJS.ProcessEnv, root: string): NodeJS.ProcessEnv {
  const key = Object.keys(env).find((name) => name.toUpperCase() === 'PATH') ?? 'PATH';
  const bin = join(root, 'node_modules', '.bin');
  return { ...env, [key]: env[key] ? `${bin}${delimiter}${env[key]}` : bin };
}

/**
 * Runs a CLI synchronously through `process.execPath` with its resolved
 * entry as the first argument. Arguments stay separate argv elements and
 * no shell is involved; the child's PATH starts with the workspace `.bin`. Returns the child's exit status (1 when absent).
 */
export function spawnCli(
  pkg: string,
  binName: string,
  argv: string[],
  opts: { root: string; cwd: string },
  deps: ResolverDeps = defaultDeps
): number {
  const entry = resolveCliEntry(pkg, binName, opts.root, deps);
  const result = deps.spawn(deps.execPath, [entry, ...argv], {
    cwd: opts.cwd,
    shell: false,
    stdio: 'inherit',
    env: withWorkspaceBin(deps.env, opts.root)
  });
  return result.status ?? 1;
}
