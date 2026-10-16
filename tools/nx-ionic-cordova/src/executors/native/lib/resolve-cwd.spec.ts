import type { ExecutorContext } from '@nx/devkit';

import { resolveCwd } from './resolve-cwd';

function createContext(projectName: string | undefined, projects: Record<string, { root: string }>): ExecutorContext {
  return {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName,
    projectsConfigurations: { version: 2, projects }
  } as unknown as ExecutorContext;
}

describe('resolveCwd', () => {
  it('returns the invoking project root under the workspace root', () => {
    expect(resolveCwd(createContext('shop', { shop: { root: 'apps/shop' } }))).toBe('/workspace/apps/shop');
  });

  it('follows the project that is invoking, not the first one', () => {
    const projects = { shop: { root: 'apps/shop' }, admin: { root: 'apps/admin' } };

    expect(resolveCwd(createContext('admin', projects))).toBe('/workspace/apps/admin');
  });

  it('throws when projectName is unset', () => {
    expect(() => resolveCwd(createContext(undefined, {}))).toThrow(/requires an invoking project/);
  });

  it('throws naming a project that is not in the configuration', () => {
    expect(() => resolveCwd(createContext('ghost', { shop: { root: 'apps/shop' } }))).toThrow(/"ghost"/);
  });
});
