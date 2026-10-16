import type { PluginConfiguration } from '@nx/devkit';

/**
 * The npm name of this plugin. A spec keeps it equal to `package.json#name`,
 * so every executor id below stays in step with the published package.
 */
export const PLUGIN_NAME = '@iamandersonp/nx-ionic-cordova';

/** The executor that runs one native Cordova CLI command for an app. */
export const NATIVE_EXECUTOR = `${PLUGIN_NAME}:native`;

/** The executor that maps an Ionic CLI hook to an Nx target. */
export const IONIC_HOOK_EXECUTOR = `${PLUGIN_NAME}:ionic-hook`;

/**
 * Tells whether one `nx.json` `plugins` entry loads this plugin, in either
 * accepted shape: the bare package name, or an object whose `plugin` is it.
 *
 * @param entry one element of `nx.json` `plugins`
 * @return `true` when the entry loads this plugin
 */
export function isPluginEntry(entry: PluginConfiguration): boolean {
  return typeof entry === 'string' ? entry === PLUGIN_NAME : entry.plugin === PLUGIN_NAME;
}
