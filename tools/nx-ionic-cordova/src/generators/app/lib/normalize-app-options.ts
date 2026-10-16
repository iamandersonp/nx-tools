import { getProjects, joinPathFragments, offsetFromRoot, type Tree } from '@nx/devkit';

import type { AppGeneratorSchema } from '../schema';

/**
 * The `app` options with defaults resolved and the application's root and the
 * path back to the workspace root derived once.
 */
export interface NormalizedAppGeneratorOptions {
  name: string;
  appId: string;
  directory: string;
  /** `<directory>/<name>`, relative to the workspace root. */
  appRoot: string;
  /** The relative path from `appRoot` to the workspace root, e.g. `../../`. */
  offset: string;
  displayName: string;
  prefix: string;
  tags: string[];
}

/** At least two dot-separated segments, each starting with a letter (Android package rules). */
const REVERSE_DNS = /^[A-Za-z]\w*(\.[A-Za-z]\w*)+$/;

/**
 * Validates the raw options and resolves their defaults. Throws before anything is written
 * when `appId` is missing or not reverse-DNS, or when the project already exists.
 *
 * @param tree the workspace file tree, read for existing projects
 * @param raw the generator's raw options
 */
export function normalizeAppOptions(tree: Tree, raw: AppGeneratorSchema): NormalizedAppGeneratorOptions {
  if (!raw.appId || !REVERSE_DNS.test(raw.appId)) {
    throw new Error(`Option "appId" must be a reverse-DNS id such as com.acme.shop, received "${raw.appId ?? ''}".`);
  }
  if (getProjects(tree).has(raw.name)) {
    throw new Error(`Project "${raw.name}" already exists.`);
  }

  const directory = raw.directory ?? 'apps';
  const appRoot = joinPathFragments(directory, raw.name);

  return {
    name: raw.name,
    appId: raw.appId,
    directory,
    appRoot,
    offset: offsetFromRoot(appRoot),
    displayName: raw.displayName ?? raw.name,
    prefix: raw.prefix ?? 'app',
    tags: raw.tags ? raw.tags.split(',').map((tag) => tag.trim()) : []
  };
}
