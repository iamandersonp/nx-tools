/**
 * Removes every `--project`/`-p` token (and a separate value) from the
 * Ionic CLI's forwarded arguments. `nx run` reserves them to pick the
 * project, so the Ionic CLI's unrelated `--project=app` would hijack
 * `nx run <app>:<target>`.
 */
export function stripReservedProjectFlag(argv: string[]): string[] {
  const filtered: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--project' || token === '-p') {
      index += 1; // skip the value token too
    } else if (!token.startsWith('--project=')) {
      filtered.push(token);
    }
  }

  return filtered;
}
