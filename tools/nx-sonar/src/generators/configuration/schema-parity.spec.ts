import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The JSON schema slice this spec compares. */
interface JsonSchema {
  properties: Record<string, unknown>;
  required?: string[];
}

/**
 * Reads and parses one schema file.
 *
 * @param path the schema path, relative to this directory
 * @return the parsed schema
 */
function readSchema(path: string): JsonSchema {
  return JSON.parse(readFileSync(join(__dirname, path), 'utf8')) as JsonSchema;
}

const generatorSchema = readSchema('schema.json');
const executorSchema = readSchema(join('..', '..', 'executors', 'sonar', 'schema.json'));

/**
 * The options the generator forwards to the target unchanged; they are
 * the executor's own, so the generator never becomes a second source of
 * truth for their names or types.
 */
const SHARED = [
  'tsconfig',
  'lcovReportPath',
  'extraSources',
  'extraTests',
  'extraTestInclusions',
  'extraTsconfigPaths',
  'extraExclusions',
  'extraCoverageExclusions'
];

describe('configuration generator schema parity', () => {
  it('declares every extra* option the executor declares', () => {
    const executorExtras = Object.keys(executorSchema.properties).filter((name) => name.startsWith('extra'));

    expect(SHARED).toEqual(expect.arrayContaining(executorExtras));
  });

  it.each(SHARED)('declares %s exactly as the executor does', (name) => {
    expect(executorSchema.properties[name]).toBeDefined();
    expect(generatorSchema.properties[name]).toEqual(executorSchema.properties[name]);
  });

  it('requires only the project', () => {
    expect(generatorSchema.required).toEqual(['project']);
  });

  it('prompts for the project', () => {
    expect(generatorSchema.properties['project']).toEqual(
      expect.objectContaining({
        type: 'string',
        'x-prompt': expect.any(String)
      })
    );
  });
});
