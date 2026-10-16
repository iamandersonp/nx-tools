import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import appGenerator from './generator';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn()
}));

const APP_ROOT = 'apps/shop';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The `angular-standalone` base overlaid by `official/blank` (design, Interfaces / Contracts). */
const STARTER_FILES = [
  'src/index.html',
  'src/main.ts',
  'src/global.scss',
  'src/theme/variables.scss',
  'src/assets/shapes.svg',
  'src/assets/icon/favicon.png',
  'src/environments/environment.ts',
  'src/environments/environment.prod.ts',
  'src/app/app.component.ts',
  'src/app/app.component.html',
  'src/app/app.component.scss',
  'src/app/app.component.spec.ts',
  'src/app/app.routes.ts',
  'src/app/home/home.page.ts',
  'src/app/home/home.page.html',
  'src/app/home/home.page.scss',
  'src/app/home/home.page.spec.ts'
];

/**
 * Lists every file under a directory of the tree, recursively.
 *
 * @param tree the workspace file tree
 * @param dir the directory to walk
 * @return the workspace-relative file paths
 */
function listFiles(tree: Tree, dir: string): string[] {
  return tree.children(dir).flatMap((entry) => {
    const path = `${dir}/${entry}`;
    return tree.isFile(path) ? [path] : listFiles(tree, path);
  });
}

describe('app generator starter sources', () => {
  let tree: Tree;

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace({ formatter: 'none' });
    await appGenerator(tree, { name: 'shop', appId: 'com.acme.shop' });
  });

  it('writes the starter file set and no Vitest bootstrap', () => {
    const generated = listFiles(tree, `${APP_ROOT}/src`).map((path) => path.slice(APP_ROOT.length + 1));
    expect(generated.sort()).toEqual([...STARTER_FILES].sort());
    expect(tree.exists(`${APP_ROOT}/src/test-setup.ts`)).toBe(false);
  });

  it('bootstraps the blank starter: Ionic providers and a home redirect', () => {
    const main = tree.read(`${APP_ROOT}/src/main.ts`, 'utf-8') ?? '';
    expect(main).toContain('bootstrapApplication(AppComponent');
    expect(main).toContain('provideIonicAngular()');
    const routes = tree.read(`${APP_ROOT}/src/app/app.routes.ts`, 'utf-8') ?? '';
    expect(routes).toContain("redirectTo: 'home'");
    expect(routes).toContain("import('./home/home.page')");
  });

  it('keeps the starter specs on Jest globals, with no Vitest import', () => {
    for (const spec of ['src/app/app.component.spec.ts', 'src/app/home/home.page.spec.ts']) {
      const source = tree.read(`${APP_ROOT}/${spec}`, 'utf-8') ?? '';
      expect(source).toContain('TestBed');
      expect(source).toContain('expect(');
      expect(source).not.toMatch(/vitest/);
    }
  });

  it('copies the favicon byte for byte', () => {
    const generated = tree.read(`${APP_ROOT}/src/assets/icon/favicon.png`);
    const template = readFileSync(join(__dirname, 'files/src/assets/icon/favicon.png'));
    expect(generated?.subarray(0, PNG_SIGNATURE.length)).toEqual(PNG_SIGNATURE);
    expect(generated).toEqual(template);
  });

  it('contains no localization, alias or private-scope leftovers anywhere', () => {
    const files = listFiles(tree, APP_ROOT).filter((path) => !path.endsWith('.png'));
    expect(files.length).toBeGreaterThan(STARTER_FILES.length);
    for (const path of files) {
      expect(tree.read(path, 'utf-8') ?? '').not.toMatch(/ngx-translate|TRANSLATION_PATH|@shared\/|@bde/i);
    }
  });
});
