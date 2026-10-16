/**
 * Local release smoke test: packs the plugin, installs the tarball into a throwaway Nx workspace
 * and proves the published shape works (init, app generation, build, test, lint).
 *
 * Run it with `nx run nx-ionic-cordova:e2e`. It needs registry access, takes several minutes and
 * is never part of CI. Set NX_IONIC_CORDOVA_E2E_KEEP=1 to keep the temporary directory.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const PLUGIN = '@iamandersonp/nx-ionic-cordova';
const MAX_BUFFER = 256 * 1024 * 1024;
const CHILD_ENV = {
  ...process.env,
  NX_DAEMON: 'false',
  NX_NO_CLOUD: 'true',
  NX_TUI: 'false',
  CI: 'true',
  FORCE_COLOR: '0'
};

/**
 * Runs a Node entry file without a shell, echoes its output and returns it.
 *
 * @param {string} step the step name used in messages
 * @param {string} entry the JavaScript entry file to run with this Node
 * @param {string[]} argv the arguments passed to the entry
 * @param {string} cwd the working directory
 * @param {{ expectFailure?: boolean }} [options] set when a non-zero exit is the expected outcome
 * @return {{ status: number, output: string }} the exit status and the combined output
 */
function run(step, entry, argv, cwd, options = {}) {
  console.log(`\n> [smoke] ${step}`);
  const result = spawnSync(process.execPath, [entry, ...argv], {
    cwd,
    env: CHILD_ENV,
    shell: false,
    stdio: 'pipe',
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER
  });
  if (result.error) {
    throw new Error(`Smoke step "${step}" could not start: ${result.error.message}`);
  }
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  process.stdout.write(output);
  const status = result.status ?? 1;
  if (options.expectFailure ? status === 0 : status !== 0) {
    throw new Error(
      options.expectFailure
        ? `Smoke step "${step}" should have failed but exited 0`
        : `Smoke step "${step}" failed (exit ${status})`
    );
  }
  return { status, output };
}

/**
 * Resolves npm's JavaScript entry, so no `.cmd` shim or shell is needed.
 *
 * @return {string} the path to `npm-cli.js`
 */
function resolveNpmEntry() {
  const fromEnv = process.env.npm_execpath;
  const nodeDir = dirname(process.execPath);
  const candidates = [
    fromEnv,
    join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')
  ].filter(Boolean);
  const found = candidates.find((candidate) => /npm-cli\.c?js$/.test(candidate) && existsSync(candidate));
  if (!found) {
    throw new Error(`Cannot find npm's JavaScript entry. Tried: ${candidates.join(', ')}`);
  }
  return found;
}

/**
 * Resolves the Nx CLI entry installed in the generated workspace.
 *
 * @param {string} workspace the generated workspace directory
 * @return {string} the path to the `nx` bin file
 */
function resolveNxEntry(workspace) {
  const manifestPath = createRequire(join(workspace, 'package.json')).resolve('nx/package.json');
  const bin = JSON.parse(readFileSync(manifestPath, 'utf8')).bin;
  const relative = typeof bin === 'string' ? bin : bin.nx;
  return isAbsolute(relative) ? relative : join(dirname(manifestPath), relative);
}

/** Packs, installs and exercises the plugin in a temporary workspace. */
function smoke() {
  const tmp = mkdtempSync(join(tmpdir(), 'nx-ionic-cordova-e2e-'));
  const started = Date.now();
  try {
    const npm = resolveNpmEntry();

    const pack = run(
      'npm pack',
      npm,
      ['pack', '-w', 'tools/nx-ionic-cordova', '--pack-destination', tmp, '--json'],
      REPO_ROOT
    );
    const tarball = join(tmp, JSON.parse(pack.output.slice(pack.output.indexOf('[')))[0].filename);

    run(
      'create-nx-workspace',
      npm,
      [
        'exec',
        '--yes',
        'create-nx-workspace@23',
        '--',
        'ws',
        '--preset=apps',
        '--nxCloud=skip',
        '--packageManager=npm',
        '--interactive=false',
        '--skipGit'
      ],
      tmp
    );
    const workspace = join(tmp, 'ws');

    run('install tarball', npm, ['install', '--save-dev', tarball], workspace);
    const nx = resolveNxEntry(workspace);

    run('init', nx, ['g', `${PLUGIN}:init`], workspace);

    const bad = run(
      'reject path-like name',
      nx,
      ['g', `${PLUGIN}:app`, 'apps/bad', '--appId=com.example.bad'],
      workspace,
      {
        expectFailure: true
      }
    );
    if (!bad.output.includes('--directory')) {
      throw new Error('Smoke step "reject path-like name" did not point to --directory');
    }
    if (existsSync(join(workspace, 'apps', 'apps'))) {
      throw new Error('Smoke step "reject path-like name" wrote apps/apps');
    }

    run('generate app', nx, ['g', `${PLUGIN}:app`, 'demo', '--appId=com.example.demo'], workspace);
    run('install app dependencies', npm, ['install'], workspace);

    run('demo:build', nx, ['run', 'demo:build'], workspace);
    const test = run('demo:test', nx, ['run', 'demo:test'], workspace);
    if (test.output.includes('TS151001')) {
      throw new Error('Smoke step "demo:test" reported TS151001');
    }
    run('demo:lint', nx, ['run', 'demo:lint'], workspace);

    console.log(`\n[smoke] passed in ${Math.round((Date.now() - started) / 1000)}s`);
  } finally {
    if (process.env.NX_IONIC_CORDOVA_E2E_KEEP === '1') {
      console.log(`[smoke] kept ${tmp}`);
    } else {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
}

try {
  smoke();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
