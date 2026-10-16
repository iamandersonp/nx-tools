const OPTION = '--buildConfiguration=';

/**
 * Rewrites the Ionic CLI's configuration flag into the `ionic-hook`
 * executor's `--buildConfiguration` option. `nx run` would otherwise
 * consume `--configuration`/`-c` as the hook target's own configuration
 * and drop it. `--configuration=<c>`, `--configuration <c>`, `-c <c>` and
 * `-c=<c>` each become one token; a trailing flag with no value is dropped.
 */
export function forwardConfigurationAsOption(argv: string[]): string[] {
  const rewritten: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--configuration' || token === '-c') {
      index += 1;
      if (index < argv.length) {
        rewritten.push(`${OPTION}${argv[index]}`);
      }
      continue;
    }

    const prefix = ['--configuration=', '-c='].find((candidate) => token.startsWith(candidate));
    rewritten.push(prefix ? `${OPTION}${token.slice(prefix.length)}` : token);
  }

  return rewritten;
}
