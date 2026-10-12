import type { NxJsonConfiguration, PluginConfiguration } from '@nx/devkit';

/** The package name an `nx.json` `plugins` entry uses to load this plugin. */
export const PLUGIN_NAME = '@iamandersonp/nx-sonar';

/**
 * The options this plugin reads from its own `nx.json` `plugins` entry.
 * Only the generators read them; target inference ignores them.
 */
export interface NxSonarPluginOptions {
  /**
   * Put before the project name to build the default `projectKey` of the
   * `configuration` generator. Absent means no prefix.
   */
  projectKeyPrefix?: string;
}

/**
 * Tells whether one `nx.json` `plugins` entry loads this plugin, in either
 * of the two shapes Nx accepts: the bare package name, or an object whose
 * `plugin` is that name.
 *
 * @param entry one element of `nx.json` `plugins`
 * @return `true` when the entry loads this plugin
 */
export function isPluginEntry(entry: PluginConfiguration): boolean {
  return typeof entry === 'string' ? entry === PLUGIN_NAME : entry.plugin === PLUGIN_NAME;
}

/**
 * Reads the `projectKeyPrefix` option of this plugin's `nx.json` entry.
 *
 * A bare string entry carries no options, and a missing `nx.json`, a
 * missing entry or a non-string value all mean no prefix.
 *
 * @param nxJson the workspace's `nx.json`, or `null` when there is none
 * @return the configured prefix, or an empty string
 */
export function readProjectKeyPrefix(nxJson: NxJsonConfiguration | null): string {
  const entry = nxJson?.plugins?.find(isPluginEntry);
  if (entry === undefined || typeof entry === 'string') {
    return '';
  }
  const prefix = (entry.options as NxSonarPluginOptions | undefined)?.projectKeyPrefix;
  return typeof prefix === 'string' ? prefix : '';
}
