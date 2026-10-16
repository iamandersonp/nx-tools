import { forwardConfigurationAsOption } from './forward-configuration-as-option';
import { stripReservedProjectFlag } from './strip-reserved-project-flag';

/** Builds the `nx` argument vector: `run <target>` plus the normalized Ionic arguments. */
export function buildNxRunArgs(target: string, forwarded: string[]): string[] {
  return ['run', target, ...forwardConfigurationAsOption(stripReservedProjectFlag(forwarded))];
}
