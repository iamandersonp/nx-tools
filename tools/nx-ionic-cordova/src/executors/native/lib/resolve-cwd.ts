import { join } from 'node:path';

import type { ExecutorContext } from '@nx/devkit';

/**
 * Resolves the invoking project's own root from the Nx execution
 * context, never `context.root` alone. Cordova hooks and `config.xml`
 * lookups are relative to `process.cwd()`, so the child must start in
 * the project that invoked the executor.
 *
 * @param context the Nx executor context
 * @return the invoking project's root, resolved against the workspace root
 */
export function resolveCwd(context: ExecutorContext): string {
  const { projectName } = context;
  if (!projectName) {
    throw new Error('The native executor requires an invoking project; context.projectName was not set.');
  }

  const project = context.projectsConfigurations.projects[projectName];
  if (!project) {
    throw new Error(
      `The native executor could not resolve project "${projectName}" from the workspace's projects configuration.`
    );
  }

  return join(context.root, project.root);
}
