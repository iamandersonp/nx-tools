import { stripReservedProjectFlag } from './strip-reserved-project-flag';

describe('stripReservedProjectFlag', () => {
  it('removes --project=<value>, --project <value> and -p <value>', () => {
    expect(stripReservedProjectFlag(['--platform=android', '--project=app'])).toEqual(['--platform=android']);
    expect(stripReservedProjectFlag(['--project', 'app', '--platform=android'])).toEqual(['--platform=android']);
    expect(stripReservedProjectFlag(['-p', 'app', '--platform=android'])).toEqual(['--platform=android']);
  });

  it('leaves every other flag untouched, including --configuration', () => {
    const argv = ['--platform=android', '--configuration=production', '--source-map=true'];

    expect(stripReservedProjectFlag(argv)).toEqual(argv);
  });
});
