import { formatFiles, type PluginConfiguration, readNxJson, type Tree, updateNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import initGenerator from './generator';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn()
}));

const PLUGIN = '@iamandersonp/nx-sonar';

/**
 * Creates an empty workspace whose writes are not reformatted, so the
 * assertions read `nx.json` exactly as the generator left it.
 *
 * @return the workspace tree
 */
function createFixtureTree(): Tree {
  return createTreeWithEmptyWorkspace({
    formatter: 'none'
  });
}

/**
 * Replaces the `plugins` array of the tree's `nx.json`.
 *
 * @param tree the workspace tree
 * @param plugins the entries `nx.json` declares before the generator runs
 */
function givenPlugins(tree: Tree, plugins: PluginConfiguration[]): void {
  updateNxJson(tree, { ...readNxJson(tree), plugins });
}

/**
 * Reads the `plugins` array the generator left in `nx.json`.
 *
 * @param tree the workspace tree
 * @return the declared plugin entries, or `undefined` when there are none
 */
function pluginsOf(tree: Tree): PluginConfiguration[] | undefined {
  return readNxJson(tree)?.plugins;
}

describe('initGenerator', () => {
  describe('registration', () => {
    it('creates nx.json with the plugin entry when the workspace has none', async () => {
      const tree = createFixtureTree();
      tree.delete('nx.json');

      await initGenerator(tree, { skipFormat: true });

      expect(pluginsOf(tree)).toEqual([{ plugin: PLUGIN }]);
    });

    it('adds an object entry for the plugin when nx.json declares no plugins', async () => {
      const tree = createFixtureTree();

      await initGenerator(tree, { skipFormat: true });

      expect(pluginsOf(tree)).toEqual([{ plugin: PLUGIN }]);
    });

    it('appends the entry after the plugins already declared', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, ['@nx/js/typescript']);

      await initGenerator(tree, { skipFormat: true });

      expect(pluginsOf(tree)).toEqual(['@nx/js/typescript', { plugin: PLUGIN }]);
    });
  });

  describe('idempotence', () => {
    it('leaves a string entry untouched', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [PLUGIN]);

      await initGenerator(tree, { skipFormat: true });

      expect(pluginsOf(tree)).toEqual([PLUGIN]);
    });

    it('leaves an object entry and its options untouched', async () => {
      const tree = createFixtureTree();
      const entry = {
        plugin: PLUGIN,
        options: { projectKeyPrefix: 'Team-' },
        include: ['libs/**']
      };
      givenPlugins(tree, [entry]);

      await initGenerator(tree, { skipFormat: true });

      expect(pluginsOf(tree)).toEqual([entry]);
    });

    it('adds only one entry when run twice', async () => {
      const tree = createFixtureTree();

      await initGenerator(tree, { skipFormat: true });
      await initGenerator(tree, { skipFormat: true });

      expect(pluginsOf(tree)).toEqual([{ plugin: PLUGIN }]);
    });
  });

  describe('projectKeyPrefix', () => {
    it('sets the prefix on a new entry', async () => {
      const tree = createFixtureTree();

      await initGenerator(tree, {
        projectKeyPrefix: 'Team-',
        skipFormat: true
      });

      expect(pluginsOf(tree)).toEqual([
        {
          plugin: PLUGIN,
          options: { projectKeyPrefix: 'Team-' }
        }
      ]);
    });

    it('turns a string entry into an object entry carrying the prefix, in place', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [PLUGIN, '@nx/js/typescript']);

      await initGenerator(tree, {
        projectKeyPrefix: 'Team-',
        skipFormat: true
      });

      expect(pluginsOf(tree)).toEqual([
        {
          plugin: PLUGIN,
          options: { projectKeyPrefix: 'Team-' }
        },
        '@nx/js/typescript'
      ]);
    });

    it('updates the prefix of an object entry and keeps its other settings', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [
        {
          plugin: PLUGIN,
          options: { projectKeyPrefix: 'Old-' },
          exclude: ['tools/**']
        }
      ]);

      await initGenerator(tree, {
        projectKeyPrefix: 'New-',
        skipFormat: true
      });

      expect(pluginsOf(tree)).toEqual([
        {
          plugin: PLUGIN,
          options: { projectKeyPrefix: 'New-' },
          exclude: ['tools/**']
        }
      ]);
    });
  });

  describe('formatting', () => {
    beforeEach(() => {
      jest.mocked(formatFiles).mockClear();
    });

    it('formats the files it wrote when skipFormat is not set', async () => {
      const tree = createFixtureTree();

      await initGenerator(tree, {});

      expect(formatFiles).toHaveBeenCalledTimes(1);
      expect(formatFiles).toHaveBeenCalledWith(tree);
    });

    it('leaves the files unformatted when skipFormat is set', async () => {
      const tree = createFixtureTree();

      await initGenerator(tree, { skipFormat: true });

      expect(formatFiles).not.toHaveBeenCalled();
    });
  });
});
