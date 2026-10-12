import {
  addProjectConfiguration,
  formatFiles,
  logger,
  type PluginConfiguration,
  readJson,
  readNxJson,
  type TargetConfiguration,
  type Tree,
  updateNxJson
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import configurationGenerator from './generator';
import type { ConfigurationGeneratorSchema } from './schema';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn()
}));

const PLUGIN = '@iamandersonp/nx-sonar';
const ROOT = 'libs/mylib';

/**
 * Creates an empty workspace holding one library, `mylib`, whose root
 * carries a `tsconfig.lib.json` so the default tsconfig chain resolves.
 *
 * @param targets the targets `mylib` declares before the generator runs
 * @return the workspace tree
 */
function createFixtureTree(targets: Record<string, TargetConfiguration> = {}): Tree {
  const tree = createTreeWithEmptyWorkspace({
    formatter: 'none'
  });
  addProjectConfiguration(tree, 'mylib', {
    root: ROOT,
    projectType: 'library',
    targets
  });
  tree.write(`${ROOT}/tsconfig.lib.json`, '{}\n');
  return tree;
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
 * Runs the generator without formatting, with `mylib` as the project
 * unless the options name another one.
 *
 * @param tree the workspace tree
 * @param options the options besides `project` and `skipFormat`
 * @return the callback the generator returns
 */
function generate(tree: Tree, options: Partial<ConfigurationGeneratorSchema> = {}): Promise<() => void> {
  return configurationGenerator(tree, {
    project: 'mylib',
    skipFormat: true,
    ...options
  });
}

/**
 * Reads the `sonar` target the generator left in `mylib`'s
 * `project.json`, straight from the file.
 *
 * @param tree the workspace tree
 * @return the declared `sonar` target, if any
 */
function sonarTargetOf(tree: Tree): TargetConfiguration | undefined {
  return readJson(tree, `${ROOT}/project.json`).targets?.sonar;
}

describe('configurationGenerator', () => {
  let warn: jest.SpyInstance;
  let info: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(logger, 'warn').mockImplementation();
    info = jest.spyOn(logger, 'info').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('the default projectKey', () => {
    it('is the project name when nx.json declares no plugin entry', async () => {
      const tree = createFixtureTree();

      await generate(tree);

      expect(sonarTargetOf(tree)).toEqual({
        options: { projectKey: 'mylib' }
      });
    });

    it('is the project name under a string plugin entry, which carries no options', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [PLUGIN]);

      await generate(tree);

      expect(sonarTargetOf(tree)?.options.projectKey).toBe('mylib');
    });

    it('is the configured projectKeyPrefix followed by the project name', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [
        {
          plugin: PLUGIN,
          options: { projectKeyPrefix: 'Team-' }
        }
      ]);

      await generate(tree);

      expect(sonarTargetOf(tree)?.options.projectKey).toBe('Team-mylib');
    });

    it('is the project name under an object entry without a prefix', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [{ plugin: PLUGIN, options: {} }]);

      await generate(tree);

      expect(sonarTargetOf(tree)?.options.projectKey).toBe('mylib');
    });

    it('ignores the prefix of another plugin entry', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [
        {
          plugin: '@other/plugin',
          options: { projectKeyPrefix: 'Team-' }
        }
      ]);

      await generate(tree);

      expect(sonarTargetOf(tree)?.options.projectKey).toBe('mylib');
    });
  });

  describe('explicit options', () => {
    it('writes an explicit projectKey as given, without the prefix', async () => {
      const tree = createFixtureTree();
      givenPlugins(tree, [
        {
          plugin: PLUGIN,
          options: { projectKeyPrefix: 'Team-' }
        }
      ]);

      await generate(tree, { projectKey: 'custom-key' });

      expect(sonarTargetOf(tree)?.options.projectKey).toBe('custom-key');
    });

    it('writes projectName when given', async () => {
      const tree = createFixtureTree();

      await generate(tree, { projectName: 'My Library' });

      expect(sonarTargetOf(tree)).toEqual({
        options: {
          projectKey: 'mylib',
          projectName: 'My Library'
        }
      });
    });

    it('copies every given executor option and none of the generator-only ones', async () => {
      const tree = createFixtureTree();

      await generate(tree, {
        tsconfig: 'tsconfig.custom.json',
        lcovReportPath: 'out/lcov.info',
        extraSources: ['scripts'],
        extraTests: ['test'],
        extraTestInclusions: ['src/testing/**'],
        extraTsconfigPaths: ['tsconfig.extra.json'],
        extraExclusions: ['src/generated/**'],
        extraCoverageExclusions: ['src/main.ts']
      });

      expect(sonarTargetOf(tree)).toEqual({
        options: {
          projectKey: 'mylib',
          tsconfig: 'tsconfig.custom.json',
          lcovReportPath: 'out/lcov.info',
          extraSources: ['scripts'],
          extraTests: ['test'],
          extraTestInclusions: ['src/testing/**'],
          extraTsconfigPaths: ['tsconfig.extra.json'],
          extraExclusions: ['src/generated/**'],
          extraCoverageExclusions: ['src/main.ts']
        }
      });
    });

    it('never writes an executor, so the plugin infers it', async () => {
      const tree = createFixtureTree();

      await generate(tree);

      expect(sonarTargetOf(tree)).not.toHaveProperty('executor');
    });

    it('keeps the targets the project already declares', async () => {
      const tree = createFixtureTree({
        test: { executor: '@nx/jest:jest' }
      });

      await generate(tree);

      expect(readJson(tree, `${ROOT}/project.json`).targets.test).toEqual({ executor: '@nx/jest:jest' });
    });
  });

  describe('rejections', () => {
    it('throws when the project does not exist', async () => {
      const tree = createFixtureTree();

      await expect(generate(tree, { project: 'missing' })).rejects.toThrow(/missing/);
    });

    it('throws when the project already has a sonar target, naming the overwrite option', async () => {
      const tree = createFixtureTree({
        sonar: { options: { projectKey: 'old' } }
      });

      await expect(generate(tree)).rejects.toThrow(/already has a sonar target.*--overwrite/);
      expect(sonarTargetOf(tree)).toEqual({
        options: { projectKey: 'old' }
      });
    });

    it('throws when another project already uses the key, naming that project', async () => {
      const tree = createFixtureTree();
      addProjectConfiguration(tree, 'other', {
        root: 'libs/other',
        targets: {
          sonar: { options: { projectKey: 'mylib' } }
        }
      });

      await expect(generate(tree)).rejects.toThrow(/"mylib".*"other"/);
      expect(sonarTargetOf(tree)).toBeUndefined();
    });
  });

  describe('overwrite', () => {
    it('replaces an existing sonar target as a whole, executor included', async () => {
      const tree = createFixtureTree({
        sonar: {
          executor: '@legacy/sonar:scan',
          options: { projectKey: 'old', extraTests: ['x'] }
        }
      });

      await generate(tree, { overwrite: true });

      expect(sonarTargetOf(tree)).toEqual({
        options: { projectKey: 'mylib' }
      });
    });

    it('accepts the key the project itself already declares', async () => {
      const tree = createFixtureTree({
        sonar: { options: { projectKey: 'mylib' } }
      });

      await generate(tree, {
        overwrite: true,
        projectName: 'Renamed'
      });

      expect(sonarTargetOf(tree)).toEqual({
        options: {
          projectKey: 'mylib',
          projectName: 'Renamed'
        }
      });
    });

    it('still rejects a key another project uses', async () => {
      const tree = createFixtureTree({
        sonar: { options: { projectKey: 'old' } }
      });
      addProjectConfiguration(tree, 'other', {
        root: 'libs/other',
        targets: {
          sonar: { options: { projectKey: 'taken' } }
        }
      });

      await expect(
        generate(tree, {
          overwrite: true,
          projectKey: 'taken'
        })
      ).rejects.toThrow(/"taken".*"other"/);
    });
  });

  describe('the tsconfig check', () => {
    it.each(['tsconfig.sonar.json', 'tsconfig.lib.json', 'tsconfig.app.json'])(
      'does not warn when %s exists',
      async (file) => {
        const tree = createFixtureTree();
        tree.delete(`${ROOT}/tsconfig.lib.json`);
        tree.write(`${ROOT}/${file}`, '{}\n');

        await generate(tree);

        expect(warn).not.toHaveBeenCalled();
      }
    );

    it('warns, without failing or scaffolding, when no default tsconfig exists', async () => {
      const tree = createFixtureTree();
      tree.delete(`${ROOT}/tsconfig.lib.json`);

      await generate(tree);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(/tsconfig\.sonar\.json.*tsconfig\.lib\.json.*tsconfig\.app\.json/s);
      expect(sonarTargetOf(tree)).toEqual({
        options: { projectKey: 'mylib' }
      });
      expect(tree.exists(`${ROOT}/tsconfig.sonar.json`)).toBe(false);
    });

    it('does not warn when the tsconfig option is given', async () => {
      const tree = createFixtureTree();
      tree.delete(`${ROOT}/tsconfig.lib.json`);

      await generate(tree, { tsconfig: 'tsconfig.json' });

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('the follow-up steps', () => {
    it('returns a callback that names the key and the dry run command', async () => {
      const tree = createFixtureTree();

      const callback = await generate(tree);
      expect(info).not.toHaveBeenCalled();
      callback();

      const logged = info.mock.calls.map(([message]) => String(message)).join('\n');
      expect(logged).toContain('mylib');
      expect(logged).toContain('nx run mylib:sonar --dryRun');
    });
  });

  describe('formatting', () => {
    beforeEach(() => {
      jest.mocked(formatFiles).mockClear();
    });

    it('formats the files it wrote when skipFormat is not set', async () => {
      const tree = createFixtureTree();

      await generate(tree, { skipFormat: false });

      expect(formatFiles).toHaveBeenCalledTimes(1);
      expect(formatFiles).toHaveBeenCalledWith(tree);
    });

    it('leaves the files unformatted when skipFormat is set', async () => {
      const tree = createFixtureTree();

      await generate(tree);

      expect(formatFiles).not.toHaveBeenCalled();
    });
  });
});
