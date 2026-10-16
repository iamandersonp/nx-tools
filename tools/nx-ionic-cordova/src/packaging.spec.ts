import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const PROJECT_ROOT = join(__dirname, '..');
const WORKSPACE_ROOT = join(PROJECT_ROOT, '..', '..');

interface Entry {
  schema?: string;
  implementation?: string;
  factory?: string;
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(PROJECT_ROOT, file), 'utf8')) as T;
}

const normalize = (path: string): string => path.replace(/^\.\//, '');
const pkg = readJson<{ files: string[]; main: string; bin: Record<string, string> }>('package.json');
const executors = readJson<{ executors: Record<string, Entry> }>('executors.json').executors;
const generators = readJson<{ generators: Record<string, Entry> }>('generators.json').generators;

/** A path ships when a `files` entry names it or a directory above it. */
function isPublished(path: string): boolean {
  return pkg.files.map(normalize).some((entry) => path === entry || path.startsWith(`${entry}/`));
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory() ? walk(join(dir, item.name)) : [join(dir, item.name)]
  );
}

describe('published package contents', () => {
  const entries = [...Object.values(executors), ...Object.values(generators)];

  it('describes every schema so --help never prints undefined', () => {
    const described = entries
      .filter((entry) => entry.schema)
      .map((entry) => readJson<{ description?: string }>(normalize(entry.schema ?? '')));

    expect(described.length).toBeGreaterThan(0);
    expect(described.filter((schema) => !schema.description)).toEqual([]);
  });

  it('publishes both manifests, the README and the bin file', () => {
    for (const path of ['executors.json', 'generators.json', 'README.md', ...Object.values(pkg.bin).map(normalize)]) {
      expect(isPublished(path)).toBe(true);
    }
  });

  it('publishes every schema the manifests reference', () => {
    const schemas = entries.map((entry) => normalize(entry.schema as string));

    expect(schemas).toHaveLength(4);
    for (const schema of schemas) {
      expect(isPublished(schema)).toBe(true);
    }
  });

  it('publishes every implementation and the main entry from the compiled output', () => {
    const compiled = entries.flatMap((entry) => [entry.implementation, entry.factory]).filter(Boolean) as string[];

    expect(compiled).toHaveLength(4);
    for (const path of [...compiled, pkg.main]) {
      expect(isPublished(`${normalize(path)}`.replace(/(\.js)?$/, '.js'))).toBe(true);
    }
  });

  it('does not publish specs or other sources', () => {
    for (const entry of pkg.files.map(normalize)) {
      expect(entry).not.toMatch(/\.spec\.|\.ts$/);
      expect(entry.startsWith('src/') && !entry.endsWith('schema.json')).toBe(false);
    }
  });
});

describe('workspace coupling', () => {
  it('keeps the plugin free of private-workspace references and CLI .bin spawns', () => {
    const sources = walk(join(PROJECT_ROOT, 'src')).filter((file) => /(?<!\.spec|\.d)\.ts$/.test(file));
    const code = (file: string): string =>
      readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
        .join('\n');
    const offenders = sources.filter((file) => /@bde|es\.bde|spawn\w*\([^)]*\.bin/.test(code(file)));

    expect(offenders.map((file) => relative(PROJECT_ROOT, file))).toEqual([]);
  });

  it('adds no workflow that runs npm publish', () => {
    const workflows = walk(join(WORKSPACE_ROOT, '.github', 'workflows'));

    expect(workflows.length).toBeGreaterThan(0);
    for (const file of workflows) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/npm\s+publish/);
    }
  });
});

describe('release wiring', () => {
  const rootJson = <T>(file: string): T => JSON.parse(readFileSync(join(WORKSPACE_ROOT, file), 'utf8')) as T;
  const config = rootJson<{ packages: Record<string, { component?: string }> }>('release-please-config.json');
  const manifest = rootJson<Record<string, string>>('.release-please-manifest.json');

  it('lists every release-please package in the manifest', () => {
    for (const path of Object.keys(config.packages)) {
      expect(manifest).toHaveProperty([path]);
    }
  });

  it('releases the plugin as nx-ionic-cordova at the version its package.json declares', () => {
    const path = 'tools/nx-ionic-cordova';

    expect(config.packages[path]?.component).toBe('nx-ionic-cordova');
    expect(manifest[path]).toBe(readJson<{ version: string }>('package.json').version);
  });
});

describe('local tarball smoke target', () => {
  const project = readJson<{ targets: { e2e?: { cache?: boolean; dependsOn?: string[] } } }>('project.json');

  it('runs uncached after the build', () => {
    expect(project.targets.e2e?.cache).toBe(false);
    expect(project.targets.e2e?.dependsOn).toContain('build');
  });

  it('is not run by any workflow', () => {
    const workflows = walk(join(WORKSPACE_ROOT, '.github', 'workflows'));

    expect(workflows.length).toBeGreaterThan(0);
    for (const file of workflows) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/nx-ionic-cordova:e2e|(-t|--targets?)[ =][^\n]*\be2e\b/);
    }
  });

  it('does not publish the smoke script', () => {
    expect(isPublished('e2e/smoke.mjs')).toBe(false);
  });
});
