import { buildNxRunArgs } from './build-nx-run-args';

describe('buildNxRunArgs', () => {
  it('prefixes run <target>, strips --project and forwards the configuration as an option', () => {
    expect(buildNxRunArgs('shop:ionic-hook-serve', ['--project=app', '--host=0.0.0.0', '-c', 'dev'])).toEqual([
      'run',
      'shop:ionic-hook-serve',
      '--host=0.0.0.0',
      '--buildConfiguration=dev'
    ]);
  });
});
