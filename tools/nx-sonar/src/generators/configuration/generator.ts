import { formatFiles, getProjects, logger, readNxJson, type Tree, updateProjectConfiguration } from '@nx/devkit';

import { readProjectKeyPrefix } from '../shared/plugin-entry';
import type { ConfigurationGeneratorSchema } from './schema';

/**
 * The executor options the generator copies to the target as given,
 * under the executor's own names.
 */
const FORWARDED_OPTIONS = [
  'projectName',
  'tsconfig',
  'lcovReportPath',
  'extraSources',
  'extraTests',
  'extraTestInclusions',
  'extraTsconfigPaths',
  'extraExclusions',
  'extraCoverageExclusions'
] as const;

/**
 * The tsconfig files the executor looks for, in order, when the target
 * names none.
 */
const DEFAULT_TSCONFIGS = ['tsconfig.sonar.json', 'tsconfig.lib.json', 'tsconfig.app.json'];

/**
 * Finds the project, other than the given one, whose `sonar` target
 * already declares the given key.
 *
 * @param projects every project of the workspace, by name
 * @param project the project being configured, which is skipped
 * @param projectKey the key to look for
 * @return the name of the project using the key, or `undefined`
 */
function findKeyOwner(
  projects: ReturnType<typeof getProjects>,
  project: string,
  projectKey: string
): string | undefined {
  for (const [name, config] of projects) {
    if (name !== project && config.targets?.['sonar']?.options?.projectKey === projectKey) {
      return name;
    }
  }
  return undefined;
}

/**
 * Builds the options of the `sonar` target: the key, then every
 * forwarded option that was given. Options left out are not written, so
 * the executor's own defaults apply.
 *
 * @param options the generator's options
 * @param projectKey the resolved key
 * @return the target's options
 */
function buildTargetOptions(options: ConfigurationGeneratorSchema, projectKey: string): Record<string, unknown> {
  const targetOptions: Record<string, unknown> = {
    projectKey
  };
  for (const name of FORWARDED_OPTIONS) {
    if (options[name] !== undefined) {
      targetOptions[name] = options[name];
    }
  }
  return targetOptions;
}

/**
 * Opts one project into Sonar analysis by adding a `sonar` target to its
 * `project.json`.
 *
 * The target carries only `options`: `projectKey`, plus `projectName`,
 * `tsconfig`, `lcovReportPath` and the `extra*` options when given. It
 * never names an `executor`, because the plugin infers the target from
 * the key. The key defaults to the plugin's `projectKeyPrefix` option in
 * `nx.json` followed by the project name, or the project name alone when
 * no prefix is configured; an explicit `projectKey` is used as given.
 *
 * It warns, without failing or scaffolding a file, when no `tsconfig`
 * option is given and none of `tsconfig.sonar.json`, `tsconfig.lib.json`
 * or `tsconfig.app.json` exists in the project root, since the analysis
 * would then read no tsconfig.
 *
 * @param tree the workspace file tree
 * @param options the generator's options; `project` is required
 * @return a callback that logs the follow-up steps: create the project on
 *   the Sonar server, then check the derived properties with `--dryRun`
 * @throws {Error} when the project does not exist; when it already has a
 *   `sonar` target and `overwrite` is not set; or when another project's
 *   `sonar` target already declares the same key, since a Sonar key is
 *   the server-side identity of one analysis
 */
export default async function configurationGenerator(
  tree: Tree,
  options: ConfigurationGeneratorSchema
): Promise<() => void> {
  const projects = getProjects(tree);
  const config = projects.get(options.project);
  if (config === undefined) {
    throw new Error(`Cannot find a project named "${options.project}".`);
  }
  if (config.targets?.['sonar'] && !options.overwrite) {
    throw new Error(`Project "${options.project}" already has a sonar target. Pass --overwrite to replace it.`);
  }

  const projectKey = options.projectKey ?? `${readProjectKeyPrefix(readNxJson(tree))}${options.project}`;
  const owner = findKeyOwner(projects, options.project, projectKey);
  if (owner !== undefined) {
    throw new Error(
      `The Sonar projectKey "${projectKey}" is already used by project "${owner}". Pass a different --projectKey.`
    );
  }

  if (options.tsconfig === undefined && !DEFAULT_TSCONFIGS.some((file) => tree.exists(`${config.root}/${file}`))) {
    logger.warn(
      `Project "${options.project}" has none of ${DEFAULT_TSCONFIGS.join(', ')} in ${
        config.root
      }, so the analysis reads no tsconfig. Create one, or pass --tsconfig.`
    );
  }

  updateProjectConfiguration(tree, options.project, {
    ...config,
    targets: {
      ...config.targets,
      sonar: {
        options: buildTargetOptions(options, projectKey)
      }
    }
  });

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return () => {
    logger.info(`Next steps for the Sonar projectKey "${projectKey}":`);
    logger.info(`  1. Create the project "${projectKey}" on your Sonar server.`);
    logger.info(`  2. Check the derived properties: nx run ${options.project}:sonar --dryRun`);
  };
}
