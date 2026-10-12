import { dirname, join } from 'node:path';

import { type CreateNodes, createNodesFromFiles, type CreateNodesResult, readJsonFile } from '@nx/devkit';

/**
 * The executor every inferred `sonar` target runs, and the only executor a
 * `project.json` may name on its own `sonar` target for inference to apply.
 */
const SONAR_EXECUTOR = '@iamandersonp/nx-sonar:sonar';

/** The slice of a `project.json` the inference reads. */
interface ProjectJsonSonarShape {
  targets?: {
    sonar?: {
      executor?: unknown;
      options?: { projectKey?: unknown };
    };
  };
}

/**
 * Infers the `sonar` target of one project from its `project.json`.
 *
 * A project opts in by declaring `targets.sonar.options.projectKey` as a
 * non-empty string; nothing else triggers inference, so a workspace whose
 * projects declare no key gains no target. A target that still names a
 * different executor is left to `project.json` alone: Nx cannot merge two
 * executors into one target, and inferring ours over a foreign one would
 * make a half-migrated project resolve to a mix of both. The target
 * declares no `dependsOn` and no options, which stay with the project.
 *
 * @param file the workspace-relative `project.json` path
 * @param workspaceRoot the absolute workspace root
 * @return the project's inferred `sonar` target, or an empty result when
 *   the project has not opted in
 */
function inferSonar(file: string, workspaceRoot: string): CreateNodesResult {
  const project = readJsonFile<ProjectJsonSonarShape>(join(workspaceRoot, file));
  const sonar = project.targets?.sonar;
  const projectKey = sonar?.options?.projectKey;

  if (typeof projectKey !== 'string' || projectKey === '') {
    return {};
  }
  if (sonar?.executor !== undefined && sonar.executor !== SONAR_EXECUTOR) {
    return {};
  }

  return {
    projects: {
      [dirname(file)]: {
        targets: {
          sonar: { executor: SONAR_EXECUTOR, cache: false }
        }
      }
    }
  };
}

/**
 * The Nx inference entry: every `project.json` is inspected, and a `sonar`
 * target is attached only to the projects that opted in with a `projectKey`.
 * The options of the plugin's `nx.json` entry, such as `projectKeyPrefix`,
 * belong to the generators and never change what is inferred.
 */
export const createNodes: CreateNodes = [
  '**/project.json',
  (configFiles, options, context) =>
    createNodesFromFiles(
      (file, _options, fileContext) => inferSonar(file, fileContext.workspaceRoot),
      configFiles,
      options,
      context
    )
];

/** The same inference entry under the name newer Nx releases look up. */
export const createNodesV2 = createNodes;
