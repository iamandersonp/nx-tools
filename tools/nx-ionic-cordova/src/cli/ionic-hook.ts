#!/usr/bin/env node
import { findWorkspaceRoot, spawnCli } from '../shared/resolve-cli';
import { buildNxRunArgs } from './lib/build-nx-run-args';

export interface IonicHookDeps {
  findRoot: () => string;
  spawnCli: typeof spawnCli;
  error: (message: string) => void;
}

/**
 * The `nx-ionic-hook` bin: runs `nx run <target>` with the Ionic CLI's
 * forwarded arguments. The workspace root is the nearest `nx.json` above
 * the cwd (else `NX_WORKSPACE_ROOT`) and nx runs through its resolved package
 * bin, so the result does not depend on where this file is installed.
 *
 * @return the process exit code
 */
export function runIonicHook(argv: string[], deps: IonicHookDeps): number {
  const [target, ...forwarded] = argv;
  if (!target) {
    deps.error('nx-ionic-hook: expected a target. Usage: nx-ionic-hook <project>:<target> [ionic arguments...]');
    return 1;
  }

  try {
    const root = deps.findRoot();
    return deps.spawnCli('nx', 'nx', buildNxRunArgs(target, forwarded), { root, cwd: root });
  } catch (error) {
    deps.error(`nx-ionic-hook: ${(error as Error).message}`);
    return 1;
  }
}

/* istanbul ignore next -- entry point, covered by running the built bin */
if (require.main === module) {
  process.exit(
    runIonicHook(process.argv.slice(2), { findRoot: () => findWorkspaceRoot(), spawnCli, error: console.error })
  );
}
