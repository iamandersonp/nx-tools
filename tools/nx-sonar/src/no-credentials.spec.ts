import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Lists the plugin's own production sources: every `.ts` file under `src`
 * except the specs, which have to name the variables to assert their
 * absence.
 *
 * @return the paths of those files, relative to `src`
 */
function productionSources(): string[] {
  return readdirSync(__dirname, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'));
}

describe('token isolation in the plugin source', () => {
  it('scans the executor and the inference entry', () => {
    const sources = productionSources();

    expect(sources).toContain('index.ts');
    expect(sources).toContain(join('executors', 'sonar', 'executor.ts'));
  });

  it.each(['SONAR_TOKEN', 'SONAR_HOST_URL'])('never references %s', (name) => {
    const offenders = productionSources().filter((file) => readFileSync(join(__dirname, file), 'utf8').includes(name));

    expect(offenders).toEqual([]);
  });
});
