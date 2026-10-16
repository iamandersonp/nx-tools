import { type PromiseExecutor, runExecutor as runNxExecutor } from '@nx/devkit';

import { mapIonicHookToNxTarget } from './lib/map-ionic-hook-options';
import type { IonicHookExecutorSchema } from './schema';

/**
 * Redirects the Ionic CLI's `ionic:build`/`ionic:serve` npm-script hook into Nx, so no `ng` call or
 * `angular.json` is needed. The mapped target runs under `buildConfiguration`, falling back to the
 * context configuration for a direct `nx run <app>:<target>:<c>`.
 *
 * @return `{ success: true }` only when every result yielded by the mapped target succeeds
 * @throws {Error} when `context.projectName` is unset, or the mapping rejects the options
 */
const runExecutor: PromiseExecutor<IonicHookExecutorSchema> = async (options, context) => {
  const { projectName } = context;
  if (!projectName) {
    throw new Error('The ionic-hook executor requires an invoking project; context.projectName was not set.');
  }

  const mapped = mapIonicHookToNxTarget({
    hook: options.hook,
    platform: options.platform,
    host: options.host,
    port: options.port,
    configuration: options.buildConfiguration ?? context.configurationName
  });

  // Nx loads `.env.local` into every task and the dev-server lets `PORT` override `--port`. The port the
  // Ionic CLI reports to the device must win, or the livereload URL points at the wrong server.
  if (options.hook === 'serve' && options.port) {
    process.env.PORT = String(options.port);
  }

  const results = await runNxExecutor(
    { project: projectName, target: mapped.target, configuration: mapped.configuration },
    mapped.options,
    context
  );

  for await (const result of results) {
    if (!result.success) {
      return { success: false };
    }
  }
  return { success: true };
};

export default runExecutor;
