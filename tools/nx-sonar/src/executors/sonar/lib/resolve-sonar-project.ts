import type { ExecutorContext } from '@nx/devkit';

/** The paths of the invoking project that the scanner properties derive from. */
export interface SonarProject {
  /** The absolute workspace root. */
  workspaceRoot: string;
  /** The project root, relative to the workspace root. */
  root: string;
  /** The project source root, relative to the workspace root, when declared. */
  sourceRoot: string | undefined;
}

/**
 * Resolves the invoking project's root and source root from the Nx
 * execution context, never from a caller-supplied path, so declaring the
 * target on a project is the whole act of scoping its analysis.
 *
 * @param context the Nx executor context
 * @return the workspace root with the invoking project's root and source
 *   root
 * @throws Error when the context names no project, or a project the
 *   workspace configuration does not hold
 */
export function resolveSonarProject(context: ExecutorContext): SonarProject {
  const { projectName } = context;
  if (!projectName) {
    throw new Error('The sonar executor requires an invoking project; context.projectName was not set.');
  }

  const project = context.projectsConfigurations.projects[projectName];
  if (!project) {
    throw new Error(
      `The sonar executor could not resolve project "${projectName}" from the workspace's projects configuration.`
    );
  }

  return {
    workspaceRoot: context.root,
    root: project.root,
    sourceRoot: project.sourceRoot
  };
}
