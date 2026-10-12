import { findMissingLcov } from './find-missing-lcov';

describe('findMissingLcov', () => {
  const properties = {
    'sonar.projectBaseDir': '/workspace/libs/x',
    'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info'
  };

  it('returns the absolute path of the report when it is absent', () => {
    const checked: string[] = [];

    expect(
      findMissingLcov(properties, (path) => {
        checked.push(path);
        return false;
      })
    ).toBe('/workspace/libs/x/coverage/lcov.info');
    expect(checked).toEqual(['/workspace/libs/x/coverage/lcov.info']);
  });

  it('returns undefined when the report exists', () => {
    expect(findMissingLcov(properties, () => true)).toBeUndefined();
  });

  it('resolves a custom report path against the project base dir', () => {
    expect(
      findMissingLcov(
        {
          ...properties,
          'sonar.javascript.lcov.reportPaths': 'out/lcov.info'
        },
        () => false
      )
    ).toBe('/workspace/libs/x/out/lcov.info');
  });
});
