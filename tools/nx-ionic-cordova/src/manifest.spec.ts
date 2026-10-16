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
