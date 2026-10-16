import {
  addDependenciesToPackageJson,
  formatFiles,
  type GeneratorCallback,
  installPackagesTask,
  readNxJson,
  type Tree,
  updateNxJson,
  writeJson
} from '@nx/devkit';

import { DEV_DEPENDENCIES, RUNTIME_DEPENDENCIES } from '../../utils/versions';
import { isPluginEntry, PLUGIN_NAME } from '../shared/plugin-entry';
import type { InitGeneratorSchema } from './schema';

/**
 * Registers the plugin in `nx.json` (the generator `nx add` runs) and adds
 * the app's packages to the root `package.json`.
 *
 * Registration appends `{ "plugin": ... }` only when no entry exists in
 * either shape, so a re-run never duplicates or rewrites it. A workspace
 * without `nx.json` gets one, because `updateNxJson` writes nothing then.
 * Versions already present are kept, so nothing is ever downgraded.
 *
 * @param tree the workspace file tree
 * @param options the generator's options
 * @return a callback that installs the added packages
 */
export default async function initGenerator(tree: Tree, options: InitGeneratorSchema): Promise<GeneratorCallback> {
  const nxJson = readNxJson(tree) ?? {};
  const plugins = [...(nxJson.plugins ?? [])];

  if (!plugins.some(isPluginEntry)) {
    plugins.push({ plugin: PLUGIN_NAME });
    if (tree.exists('nx.json')) {
      updateNxJson(tree, { ...nxJson, plugins });
    } else {
      writeJson(tree, 'nx.json', { ...nxJson, plugins });
    }
  }

  addDependenciesToPackageJson(tree, RUNTIME_DEPENDENCIES, DEV_DEPENDENCIES, undefined, true);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return () => installPackagesTask(tree);
}
