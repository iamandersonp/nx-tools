import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { IONIC_HOOK_EXECUTOR, NATIVE_EXECUTOR, PLUGIN_NAME } from './plugin-entry';

const PROJECT_ROOT = join(__dirname, '..', '..', '..');

describe('plugin-entry', () => {
  it('names the plugin exactly as package.json does', () => {
    const manifest = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8')) as { name: string };

    expect(PLUGIN_NAME).toBe(manifest.name);
    expect(PLUGIN_NAME).toBe('@iamandersonp/nx-ionic-cordova');
  });

  it('builds the native executor id from the plugin name', () => {
    expect(NATIVE_EXECUTOR).toBe(`${PLUGIN_NAME}:native`);
    expect(NATIVE_EXECUTOR.endsWith(':native')).toBe(true);
  });

  it('builds the ionic-hook executor id from the plugin name', () => {
    expect(IONIC_HOOK_EXECUTOR).toBe(`${PLUGIN_NAME}:ionic-hook`);
    expect(IONIC_HOOK_EXECUTOR.endsWith(':ionic-hook')).toBe(true);
  });

  it('never leaks a private scope into the executor ids', () => {
    expect(NATIVE_EXECUTOR).not.toContain('@bde');
    expect(IONIC_HOOK_EXECUTOR).not.toContain('@bde');
  });
});
