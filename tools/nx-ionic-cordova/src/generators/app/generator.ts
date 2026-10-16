import { join } from 'node:path';

import { addProjectConfiguration, formatFiles, generateFiles, type Tree } from '@nx/devkit';

import { buildIonicHookScripts } from '../shared/build-ionic-hook-scripts';
import { buildAppProjectJson } from './lib/build-app-project-json';
import { normalizeAppOptions } from './lib/normalize-app-options';
import type { AppGeneratorSchema } from './schema';

/**
 * Scaffolds an Ionic/Cordova application under `<directory>/<name>`.
 *
 * Options are validated first, so an invalid `appId` or an existing project throws before
 * anything is written. The `project.json` comes from `buildAppProjectJson`; every other file
 * is rendered from `files/` with `generateFiles`, whose substitutions carry the identity and
 * the depth-derived `offset` (nothing hardcodes the climb to the workspace root).
 *
 * @param tree the workspace file tree
 * @param rawOptions the generator's raw options
 */
export default async function appGenerator(tree: Tree, rawOptions: AppGeneratorSchema): Promise<void> {
  const options = normalizeAppOptions(tree, rawOptions);
  const { name, appRoot } = options;
  const { 'ionic:build': hookBuildScript, 'ionic:serve': hookServeScript } = buildIonicHookScripts(name);

  addProjectConfiguration(tree, name, {
    root: appRoot,
    ...buildAppProjectJson(options)
  });
  generateFiles(tree, join(__dirname, 'files'), appRoot, {
    ...options,
    hookBuildScript,
    hookServeScript,
    tmpl: ''
  });

  if (!rawOptions.skipFormat) {
    await formatFiles(tree);
  }
}
