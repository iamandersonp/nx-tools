/**
 * Options accepted by the `init` generator.
 */
export interface InitGeneratorSchema {
  /**
   * The prefix the `configuration` generator puts before the project
   * name to build a default `projectKey`. Stored as
   * `options.projectKeyPrefix` on the plugin's `nx.json` entry.
   */
  projectKeyPrefix?: string;
  /** Skips formatting the files the generator changed. */
  skipFormat?: boolean;
}
