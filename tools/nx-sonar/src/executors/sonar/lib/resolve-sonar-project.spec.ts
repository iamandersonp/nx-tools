import type { ExecutorContext } from '@nx/devkit';

import { resolveSonarProject } from './resolve-sonar-project';

/**
 * Builds the slice of an `ExecutorContext` the resolution reads.
 *
 * @param projectName the invoking project's name, when there is one
 * @param projects the workspace's project configurations
 * @return an `ExecutorContext` fixture
 */
function createContext(
  projectName: string | undefined,
  projects: Record<string, { root: string; sourceRoot?: string }>
): ExecutorContext {
  return {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName,
    targetName: 'sonar',
    projectsConfigurations: { version: 2, projects },
    nxJsonConfiguration: {},
    projectGraph: { nodes: {}, dependencies: {} }
  } as unknown as ExecutorContext;
}

describe('resolveSonarProject', () => {
  it('resolves the workspace root, root and sourceRoot of the invoking project', () => {
    expect(
      resolveSonarProject(
        createContext('providers', {
          providers: {
            root: 'libs/providers',
            sourceRoot: 'libs/providers/src'
          }
        })
      )
    ).toEqual({
      workspaceRoot: '/workspace',
      root: 'libs/providers',
      sourceRoot: 'libs/providers/src'
    });
  });

  it('triangulates: another project resolves its own paths, and a missing sourceRoot stays undefined', () => {
    const resolved = resolveSonarProject(
      createContext('asb', {
        providers: { root: 'libs/providers' },
        asb: { root: 'apps/asb' }
      })
    );

    expect(resolved.root).toBe('apps/asb');
    expect(resolved.sourceRoot).toBeUndefined();
  });

  it('throws when the context carries no project name', () => {
    expect(() => resolveSonarProject(createContext(undefined, {}))).toThrow(/projectName/);
  });

  it('throws when the project is not in the workspace configuration', () => {
    expect(() =>
      resolveSonarProject(
        createContext('ghost', {
          asb: { root: 'apps/asb' }
        })
      )
    ).toThrow(/"ghost"/);
  });
});
