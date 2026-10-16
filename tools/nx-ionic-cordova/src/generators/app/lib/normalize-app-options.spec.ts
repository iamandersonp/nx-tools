import { addProjectConfiguration, type Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import type { AppGeneratorSchema } from '../schema';
import { normalizeAppOptions } from './normalize-app-options';

const BASE: AppGeneratorSchema = { name: 'shop', appId: 'com.acme.shop' };

describe('normalizeAppOptions', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ formatter: 'none' });
  });

  it('applies the defaults', () => {
    expect(normalizeAppOptions(tree, BASE)).toEqual({
      name: 'shop',
      appId: 'com.acme.shop',
      directory: 'apps',
      appRoot: 'apps/shop',
      offset: '../../',
      displayName: 'shop',
      prefix: 'app',
      tags: []
    });
  });

  it('keeps explicit values and splits tags', () => {
    const options = normalizeAppOptions(tree, { ...BASE, displayName: 'Shop', prefix: 'sh', tags: 'a, b' });
    expect(options).toMatchObject({ displayName: 'Shop', prefix: 'sh', tags: ['a', 'b'] });
  });

  it.each([
    ['.', 'shop', '../'],
    ['apps', 'shop', '../../'],
    ['apps/mobile', 'shop', '../../../']
  ])('derives the root offset from directory %s', (directory, name, offset) => {
    const options = normalizeAppOptions(tree, { ...BASE, name, directory });
    expect(options.offset).toBe(offset);
  });

  it('rejects a missing appId', () => {
    expect(() => normalizeAppOptions(tree, { name: 'shop' } as AppGeneratorSchema)).toThrow(/appId/);
  });

  it.each(['Not Valid', 'shop', 'com..shop', '1com.shop', 'com.acme-shop'])(
    'rejects appId %s naming the option',
    (appId) => {
      expect(() => normalizeAppOptions(tree, { ...BASE, appId })).toThrow(/appId/);
    }
  );

  it.each(['apps/demo', 'apps\\demo', 'a:demo', 'my app', '1demo', '-demo'])(
    'rejects the path-like or malformed name %s pointing to --directory',
    (name) => {
      expect(() => normalizeAppOptions(tree, { ...BASE, name })).toThrow(/--directory/);
    }
  );

  it.each(['../outside', 'a/../../x', '/abs', 'C:\\x', '..\\x'])(
    'rejects the directory %s that escapes the workspace',
    (directory) => {
      expect(() => normalizeAppOptions(tree, { ...BASE, directory })).toThrow(/directory/);
    }
  );

  it('places a dashed name under a nested directory', () => {
    const options = normalizeAppOptions(tree, { ...BASE, name: 'demo-app', directory: 'apps/mobile' });
    expect(options.appRoot).toBe('apps/mobile/demo-app');
  });

  it('rejects an existing project', () => {
    addProjectConfiguration(tree, 'shop', { root: 'apps/shop' });
    expect(() => normalizeAppOptions(tree, BASE)).toThrow(/shop.*already exists/);
  });
});
