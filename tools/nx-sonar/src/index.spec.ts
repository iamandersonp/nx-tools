import { type CreateNodesContextV2, readJsonFile } from '@nx/devkit';

import { createNodes, createNodesV2 } from './index';

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  readJsonFile: jest.fn()
}));

const mockedReadJsonFile = readJsonFile as jest.MockedFunction<typeof readJsonFile>;

const SONAR_EXECUTOR = '@iamandersonp/nx-sonar:sonar';

/**
 * Runs the plugin's inference function over one `project.json`, whose
 * parsed content is the given object.
 *
 * @param file the workspace-relative `project.json` path
 * @param projectJson the parsed content the mocked `readJsonFile` returns
 * @param options the plugin options of the `nx.json` entry, if any
 * @return what the plugin returns for that file
 */
async function infer(file: string, projectJson: object, options?: unknown): Promise<unknown> {
  mockedReadJsonFile.mockReturnValue(projectJson);
  const [, createNodesFunction] = createNodes;
  return createNodesFunction([file], options, {
    workspaceRoot: '/workspace',
    nxJsonConfiguration: {}
  } as CreateNodesContextV2);
}

/**
 * Builds the one result the plugin returns for a project that opted in.
 *
 * @param file the workspace-relative `project.json` path
 * @param root the project root the target is attached to
 * @return the expected `createNodes` result
 */
function inferredFor(file: string, root: string): unknown {
  return [
    [
      file,
      {
        projects: {
          [root]: {
            targets: {
              sonar: {
                executor: SONAR_EXECUTOR,
                cache: false
              }
            }
          }
        }
      }
    ]
  ];
}

describe('nx-sonar plugin entry', () => {
  beforeEach(() => {
    mockedReadJsonFile.mockReset();
  });

  describe('registration', () => {
    it('matches every project.json', () => {
      expect(createNodes[0]).toBe('**/project.json');
    });

    it('exports createNodesV2 as the same function as createNodes', () => {
      expect(createNodesV2).toBeDefined();
      expect(createNodesV2).toBe(createNodes);
    });
  });

  describe('opt-in target inference', () => {
    it('infers a sonar target with our executor, no cache and no dependsOn for a project with a key', async () => {
      const result = await infer('libs/x/project.json', {
        targets: { sonar: { options: { projectKey: 'K' } } }
      });

      expect(result).toEqual(inferredFor('libs/x/project.json', 'libs/x'));
    });

    it('attaches the target to the directory of the project.json it read', async () => {
      const result = await infer('apps/asb/project.json', {
        targets: { sonar: { options: { projectKey: 'A' } } }
      });

      expect(result).toEqual(inferredFor('apps/asb/project.json', 'apps/asb'));
      expect(mockedReadJsonFile).toHaveBeenCalledWith('/workspace/apps/asb/project.json');
    });

    it.each([
      ['no targets at all', {}],
      ['no sonar target', { targets: { test: {} } }],
      ['a sonar target without options', { targets: { sonar: {} } }],
      ['an absent projectKey', { targets: { sonar: { options: {} } } }],
      [
        'an empty projectKey',
        {
          targets: {
            sonar: { options: { projectKey: '' } }
          }
        }
      ],
      [
        'a non-string projectKey',
        {
          targets: {
            sonar: { options: { projectKey: 42 } }
          }
        }
      ]
    ])('infers nothing for %s', async (_label, projectJson) => {
      const result = await infer('libs/x/project.json', projectJson);

      expect(result).toEqual([['libs/x/project.json', {}]]);
    });
  });

  describe('plugin options', () => {
    it('ignores the options of its nx.json entry, which only the generators read', async () => {
      const result = await infer(
        'libs/x/project.json',
        {
          targets: {
            sonar: { options: { projectKey: 'K' } }
          }
        },
        { projectKeyPrefix: 'Team-', unknownOption: true }
      );

      expect(result).toEqual(inferredFor('libs/x/project.json', 'libs/x'));
    });
  });

  describe('the declared executor', () => {
    it('infers nothing when the target keeps a foreign executor, so a half-migrated project stays on its old target', async () => {
      const result = await infer('libs/x/project.json', {
        targets: {
          sonar: {
            executor: '@bde/nx-ionic-cordova:sonar',
            options: { projectKey: 'K' }
          }
        }
      });

      expect(result).toEqual([['libs/x/project.json', {}]]);
    });

    it('infers when the target already names our executor', async () => {
      const result = await infer('libs/x/project.json', {
        targets: {
          sonar: {
            executor: SONAR_EXECUTOR,
            options: { projectKey: 'K' }
          }
        }
      });

      expect(result).toEqual(inferredFor('libs/x/project.json', 'libs/x'));
    });
  });
});
