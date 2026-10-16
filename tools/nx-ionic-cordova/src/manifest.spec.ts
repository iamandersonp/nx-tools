import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = join(__dirname, '..');

interface PackageManifest {
  name: string;
  private: boolean;
  license: string;
  publishConfig: { access: string };
  main: string;
  generators: string;
  executors: string;
  bin: Record<string, string>;
  peerDependencies: Record<string, string>;
}

const manifest = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8')) as PackageManifest;

describe('package manifest', () => {
  it('is a public MIT package under the author scope', () => {
    expect(manifest.name).toBe('@iamandersonp/nx-ionic-cordova');
    expect(manifest.private).toBe(false);
    expect(manifest.license).toBe('MIT');
    expect(manifest.publishConfig.access).toBe('public');
  });

  it('points every manifest path at compiled JavaScript, never a .ts source', () => {
    const paths = [manifest.main, manifest.generators, manifest.executors, ...Object.values(manifest.bin)];

    expect(paths).toHaveLength(4);
    for (const path of paths) {
      expect(path).not.toMatch(/\.ts$/);
    }
    expect(manifest.main).toBe('./out-tsc/lib/src/index.js');
    expect(manifest.bin['nx-ionic-hook']).toBe('./out-tsc/lib/src/cli/ionic-hook.js');
  });

  it('requires nx and @nx/devkit at the 23 major', () => {
    expect(manifest.peerDependencies).toEqual({ '@nx/devkit': '^23', nx: '^23' });
  });
});

describe('bin build step', () => {
  const project = JSON.parse(readFileSync(join(PROJECT_ROOT, 'project.json'), 'utf8')) as {
    targets: Record<string, { dependsOn?: string[]; options: { command?: string } }>;
  };

  it('marks the compiled bin executable after compiling', () => {
    const bin = manifest.bin['nx-ionic-hook'].replace(/^\.\//, '');

    expect(project.targets['build'].dependsOn).toEqual(['compile']);
    expect(project.targets['build'].options.command).toContain('chmodSync');
    expect(project.targets['build'].options.command).toContain(bin);
  });
});

describe('generator registration', () => {
  const registry = JSON.parse(readFileSync(join(PROJECT_ROOT, 'generators.json'), 'utf8')) as {
    generators: Record<string, { factory: string; schema: string }>;
  };

  it.each(['init', 'app'])('registers %s with a compiled factory and a source schema', (id) => {
    expect(registry.generators[id].factory).toBe(`./out-tsc/lib/src/generators/${id}/generator.js`);
    expect(registry.generators[id].schema).toBe(`./src/generators/${id}/schema.json`);
  });
});
