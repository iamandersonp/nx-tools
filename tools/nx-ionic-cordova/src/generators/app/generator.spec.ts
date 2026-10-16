import { addProjectConfiguration, formatFiles, readJson, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import appGenerator from './generator';
import type { AppGeneratorSchema } from './schema';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn()
}));

const BASE: AppGeneratorSchema = { name: 'shop', appId: 'com.acme.shop' };

/**
 * Creates an empty workspace whose writes are not reformatted.
 *
 * @return the workspace tree
 */
function createFixtureTree(): Tree {
  return createTreeWithEmptyWorkspace({ formatter: 'none' });
}

describe('app generator', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('project and identity', () => {
    it('registers the project from the built project.json', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, BASE);
      const project = readJson(tree, 'apps/shop/project.json');
      expect(project.name).toBe('shop');
      expect(project.targets.build.executor).toBe('@angular/build:application');
    });

    it('writes exactly one config.xml carrying the widget id and display name', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, { ...BASE, displayName: 'Acme Shop' });
      const config = tree.read('apps/shop/config.xml', 'utf-8') ?? '';
      expect(config).toContain('<widget id="com.acme.shop"');
      expect(config).toContain('<name>Acme Shop</name>');
      expect(tree.children('apps/shop').filter((file) => /^config.*\.xml$/.test(file))).toEqual(['config.xml']);
      expect(tree.children('apps/shop').filter((file) => /^build-.*_ENV\.json$/.test(file))).toEqual([]);
    });

    it('defaults the display name to the project name and writes both environments', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, BASE);
      expect(tree.read('apps/shop/config.xml', 'utf-8')).toContain('<name>shop</name>');
      expect(tree.children('apps/shop/src/environments').sort()).toEqual(['environment.prod.ts', 'environment.ts']);
    });

    it('writes ionic.config.json named after the project as a Cordova project', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, BASE);
      expect(readJson(tree, 'apps/shop/ionic.config.json')).toEqual({
        name: 'shop',
        integrations: { cordova: {}, capacitor: { enabled: false } },
        type: 'angular'
      });
    });
  });

  describe('app package.json', () => {
    it('holds the name, hook scripts and cordova metadata only', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, BASE);
      const pkg = readJson(tree, 'apps/shop/package.json');
      expect(pkg.name).toBe('shop');
      expect(pkg.scripts).toEqual({
        'ionic:build': 'nx-ionic-hook shop:ionic-hook-build',
        'ionic:serve': 'nx-ionic-hook shop:ionic-hook-serve'
      });
      expect(pkg.cordova).toEqual({ plugins: {}, platforms: [] });
      expect(pkg).not.toHaveProperty('dependencies');
      expect(pkg).not.toHaveProperty('devDependencies');
    });
  });

  describe.each([
    ['.', '../'],
    ['apps', '../../'],
    ['apps/mobile', '../../../']
  ])('with directory "%s"', (directory, offset) => {
    const root = directory === '.' ? 'shop' : `${directory}/shop`;

    it('derives every workspace-root reference from the depth', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, { ...BASE, directory });
      expect(readJson(tree, `${root}/tsconfig.json`).extends).toBe(`${offset}tsconfig.base.json`);
      expect(readJson(tree, `${root}/project.json`).$schema).toBe(
        `${offset}node_modules/nx/schemas/project-schema.json`
      );
      const jest = tree.read(`${root}/jest.config.js`, 'utf-8') ?? '';
      expect(jest).toContain(`<rootDir>/${offset}node_modules/@ionic/core/dist/index.cjs.js`);
    });

    it('resets every declaration-only option Nx 23 base config sets, for the Angular compiler', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, { ...BASE, directory });
      expect(readJson(tree, `${root}/tsconfig.angular.json`).compilerOptions).toEqual({
        composite: false,
        declarationMap: false,
        emitDeclarationOnly: false
      });
    });

    it('chains the leaf tsconfigs and leaves the Jest bootstrap to the builder', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, { ...BASE, directory });
      expect(readJson(tree, `${root}/tsconfig.app.json`).extends).toBe('./tsconfig.json');
      expect(readJson(tree, `${root}/tsconfig.spec.json`).compilerOptions.types).toEqual(['jest', 'node']);
      expect(readJson(tree, `${root}/tsconfig.angular.json`).extends).toBe('./tsconfig.app.json');
      expect(tree.exists(`${root}/setup-jest.ts`)).toBe(false);
      expect(tree.read(`${root}/jest.config.js`, 'utf-8')).not.toContain('setupFilesAfterEnv');
    });
  });

  describe('no opinionated extras', () => {
    it('writes no path alias, localization or @bde reference', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, BASE);
      const files = tree.listChanges().map((change) => change.path);
      expect(files).toContain('apps/shop/tsconfig.json');
      for (const file of files.filter((path) => path.startsWith('apps/shop/'))) {
        expect(tree.read(file, 'utf-8')).not.toMatch(/@bde|@shared\/|TRANSLATION_PATH|localization/);
      }
    });
  });

  describe('validation', () => {
    it('throws and writes nothing when appId is invalid', async () => {
      const tree = createFixtureTree();
      await expect(appGenerator(tree, { name: 'shop', appId: 'Not Valid' })).rejects.toThrow('appId');
      expect(tree.exists('apps/shop/project.json')).toBe(false);
    });

    it('throws and leaves the existing project when the name is taken', async () => {
      const tree = createFixtureTree();
      addProjectConfiguration(tree, 'shop', { root: 'libs/shop' });
      await expect(appGenerator(tree, BASE)).rejects.toThrow('already exists');
      expect(tree.exists('apps/shop/config.xml')).toBe(false);
    });
  });

  describe('format and layout', () => {
    it('formats unless skipFormat is set', async () => {
      await appGenerator(createFixtureTree(), BASE);
      expect(formatFiles).toHaveBeenCalledTimes(1);
      await appGenerator(createFixtureTree(), { ...BASE, skipFormat: true });
      expect(formatFiles).toHaveBeenCalledTimes(1);
    });

    it('leaves other projects untouched when run for another name', async () => {
      const tree = createFixtureTree();
      await appGenerator(tree, BASE);
      const before = tree.read('apps/shop/project.json', 'utf-8');
      await appGenerator(tree, { name: 'admin', appId: 'com.acme.admin' });
      expect(tree.read('apps/shop/project.json', 'utf-8')).toBe(before);
      expect(tree.read('apps/admin/config.xml', 'utf-8')).toContain('<widget id="com.acme.admin"');
    });
  });
});
