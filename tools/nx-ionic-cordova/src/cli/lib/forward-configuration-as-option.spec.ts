import { forwardConfigurationAsOption } from './forward-configuration-as-option';

describe('forwardConfigurationAsOption', () => {
  it('rewrites every configuration form into one --buildConfiguration=<value> token', () => {
    expect(forwardConfigurationAsOption(['--platform=android', '--configuration=production'])).toEqual([
      '--platform=android',
      '--buildConfiguration=production'
    ]);
    expect(forwardConfigurationAsOption(['--configuration', 'production', '--platform=ios'])).toEqual([
      '--buildConfiguration=production',
      '--platform=ios'
    ]);
    expect(forwardConfigurationAsOption(['-c', 'dev'])).toEqual(['--buildConfiguration=dev']);
    expect(forwardConfigurationAsOption(['-c=test'])).toEqual(['--buildConfiguration=test']);
  });

  it('drops a trailing configuration flag that carries no value', () => {
    expect(forwardConfigurationAsOption(['--platform=android', '--configuration'])).toEqual(['--platform=android']);
  });

  it('leaves other flags untouched, including look-alike prefixes', () => {
    const argv = ['--platform=android', '--configurations=x', '-cx', '--port=8100'];

    expect(forwardConfigurationAsOption(argv)).toEqual(argv);
  });
});
