import {
  formatFiles,
  type PluginConfiguration,
  readJson,
  readNxJson,
  type Tree,
  updateNxJson,
  writeJson
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { PLUGIN_NAME } from '../shared/plugin-entry';
import initGenerator from './generator';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn(),
  installPackagesTask: jest.fn()
}));

/**
 * Creates an empty workspace whose writes are not reformatted.
 *
 * @return the workspace tree
 */
function createFixtureTree(): Tree {
  return createTreeWithEmptyWorkspace({ formatter: 'none' });
}

/**
 * Replaces the `plugins` array of the tree's `nx.json`.
 *
 * @param tree the workspace tree
 * @param plugins the entries declared before the generator runs
 */
function givenPlugins(tree: Tree, plugins: PluginConfiguration[]): void {
  updateNxJson(tree, { ...readNxJson(tree), plugins });
}

/**
 * Reads the root `package.json` of the tree.
 *
 * @param tree the workspace tree
 * @return the parsed manifest
 */
function rootPackage(tree: Tree): Record<string, Record<string, string>> {
  return readJson(tree, 'package.json');
}

describe('initGenerator', () => {
  describe('registration', () => {
    it('adds exactly one entry for the plugin', async () => {
      const tree = createFixtureTree();

      await initGenerator(tree, { skipFormat: true });

      expect(readNxJson(tree)?.plugins).toEqual([{ plugin: PLUGIN_NAME }]);
    });

    it('creates nx.json when the workspace has none', async () => {
      const tree = createFixtureTree();
      tree.delete('nx.json');

      await initGenerator(tree, { skipFormat: true });

      expect(readNxJson(tree)?.plugins).toEqual([{ plugin: PLUGIN_NAME }]);
    });

    it.each([[PLUGIN_NAME], [{ plugin: PLUGIN_NAME, options: {}, include: ['apps/**'] }]])(
      'keeps an existing entry %p untouched',
      async (entry) => {
        const tree = createFixtureTree();
        givenPlugins(tree, [entry]);

        await initGenerator(tree, { skipFormat: true });

        expect(readNxJson(tree)?.plugins).toEqual([entry]);
      }
    );

    it('leaves nx.json and package.json unchanged on a re-run', async () => {
      const tree = createFixtureTree();
      await initGenerator(tree, { skipFormat: true });
      const before = [tree.read('nx.json', 'utf8'), tree.read('package.json', 'utf8')];

      await initGenerator(tree, { skipFormat: true });

      expect([tree.read('nx.json', 'utf8'), tree.read('package.json', 'utf8')]).toEqual(before);
    });
  });

  describe('dependencies', () => {
    it('adds tooling to devDependencies and runtime packages to dependencies', async () => {
      const tree = createFixtureTree();

      await initGenerator(tree, { skipFormat: true });

      const manifest = rootPackage(tree);
      expect(manifest.devDependencies['@ionic/cordova-builders']).toBeDefined();
      expect(manifest.devDependencies['@angular-builders/jest']).toBeDefined();
      expect(manifest.devDependencies['jest-preset-angular']).toBeDefined();
      expect(manifest.devDependencies['@angular-eslint/builder']).toBeDefined();
      expect(manifest.dependencies['@ionic/angular']).toBe('^9.0.0');
      expect(manifest.dependencies['@angular/core']).toBe('^22.0.0');
      expect(manifest.dependencies['cordova']).toBeUndefined();
      expect(manifest.devDependencies['cordova']).toBe('^13.0.0');
    });

    it('keeps a newer version that is already present', async () => {
      const tree = createFixtureTree();
      writeJson(tree, 'package.json', {
        name: 'ws',
        dependencies: { '@ionic/angular': '^10.0.0' },
        devDependencies: { cordova: '^14.0.0' }
      });

      await initGenerator(tree, { skipFormat: true });

      const manifest = rootPackage(tree);
      expect(manifest.dependencies['@ionic/angular']).toBe('^10.0.0');
      expect(manifest.devDependencies['cordova']).toBe('^14.0.0');
    });
  });

  describe('formatting and install', () => {
    beforeEach(() => jest.mocked(formatFiles).mockClear());

    it('formats the written files unless skipFormat is set', async () => {
      await initGenerator(createFixtureTree(), {});
      await initGenerator(createFixtureTree(), { skipFormat: true });

      expect(formatFiles).toHaveBeenCalledTimes(1);
    });

    it('returns a callback that installs the added packages', async () => {
      const { installPackagesTask } = jest.requireMock('@nx/devkit') as { installPackagesTask: jest.Mock };
      const tree = createFixtureTree();

      const install = await initGenerator(tree, { skipFormat: true });
      install();

      expect(installPackagesTask).toHaveBeenCalledWith(tree);
    });
  });
});
