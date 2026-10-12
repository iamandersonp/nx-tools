import { formatFiles, type PluginConfiguration, readNxJson, type Tree, updateNxJson, writeJson } from '@nx/devkit';

import { isPluginEntry, PLUGIN_NAME } from '../shared/plugin-entry';
import type { InitGeneratorSchema } from './schema';

/**
 * Builds the plugin's `nx.json` entry with `projectKeyPrefix` set,
 * starting from the entry already declared, if any. A bare string entry
 * becomes an object entry; an object entry keeps its other options and
 * its `include`/`exclude`.
 *
 * @param existing the plugin's current entry, or `undefined` when absent
 * @param projectKeyPrefix the prefix to store
 * @return the entry carrying the prefix
 */
function withPrefix(existing: PluginConfiguration | undefined, projectKeyPrefix: string): PluginConfiguration {
  const base = existing === undefined || typeof existing === 'string' ? { plugin: PLUGIN_NAME } : existing;
  return {
    ...base,
    options: {
      ...(base.options as object | undefined),
      projectKeyPrefix
    }
  };
}

/**
 * Registers the plugin in `nx.json`; this is the generator `nx add` runs.
 *
 * Without `projectKeyPrefix`, it appends `{ "plugin": "@iamandersonp/nx-sonar" }`
 * only when no entry for the plugin exists, in either the string or the
 * object shape, and otherwise leaves `nx.json` unchanged, so running it
 * again never duplicates or rewrites an entry. With `projectKeyPrefix`,
 * it sets `options.projectKeyPrefix` on the plugin's entry, in place,
 * creating the entry when absent. A workspace without `nx.json` gets one
 * holding the entry, because `updateNxJson` writes nothing when the file
 * does not exist.
 *
 * @param tree the workspace file tree
 * @param options the generator's options
 */
export default async function initGenerator(tree: Tree, options: InitGeneratorSchema): Promise<void> {
  const nxJson = readNxJson(tree) ?? {};
  const plugins = [...(nxJson.plugins ?? [])];
  const index = plugins.findIndex(isPluginEntry);

  if (options.projectKeyPrefix !== undefined) {
    const entry = withPrefix(index === -1 ? undefined : plugins[index], options.projectKeyPrefix);
    if (index === -1) {
      plugins.push(entry);
    } else {
      plugins[index] = entry;
    }
  } else if (index === -1) {
    plugins.push({ plugin: PLUGIN_NAME });
  } else {
    return;
  }

  if (tree.exists('nx.json')) {
    updateNxJson(tree, { ...nxJson, plugins });
  } else {
    writeJson(tree, 'nx.json', { ...nxJson, plugins });
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}
