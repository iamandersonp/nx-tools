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

    for (const file of workflows) {
      expect(readFileSync(file, 'utf8')).not.toMatch(/npm\s+publish/);
    }
  });
});
