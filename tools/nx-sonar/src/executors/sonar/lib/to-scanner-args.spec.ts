import { toScannerArgs } from './to-scanner-args';

describe('toScannerArgs', () => {
  it('turns every property into one -Dkey=value argv entry, in order', () => {
    expect(
      toScannerArgs({
        'sonar.projectKey': 'K',
        'sonar.sources': 'src,e2e/support'
      })
    ).toEqual(['-Dsonar.projectKey=K', '-Dsonar.sources=src,e2e/support']);
  });

  it('passes globs, spaces and equals signs through unchanged', () => {
    expect(
      toScannerArgs({
        'sonar.exclusions': '**/*.spec.ts,dir with space/**',
        'sonar.projectName': 'A=B C'
      })
    ).toEqual(['-Dsonar.exclusions=**/*.spec.ts,dir with space/**', '-Dsonar.projectName=A=B C']);
  });

  it('yields no entry for no property', () => {
    const args = toScannerArgs({ 'sonar.projectKey': 'K' });

    expect(args).toHaveLength(1);
    expect(toScannerArgs({})).toEqual([]);
  });
});
