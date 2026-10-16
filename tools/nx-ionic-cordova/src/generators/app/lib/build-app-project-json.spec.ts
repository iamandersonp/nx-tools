import { buildAppProjectJson } from './build-app-project-json';
import type { NormalizedAppGeneratorOptions } from './normalize-app-options';

const OPTIONS: NormalizedAppGeneratorOptions = {
  name: 'shop',
  appId: 'com.acme.shop',
  directory: 'apps',
  appRoot: 'apps/shop',
  offset: '../../',
  displayName: 'Shop',
  prefix: 'app',
  tags: []
};

type Targets = Record<string, { executor: string; configurations?: Record<string, unknown> }>;

describe('buildAppProjectJson', () => {
  const project = buildAppProjectJson(OPTIONS);
  const targets = project.targets as Targets;

  it.each([
    ['build', '@angular/build:application'],
    ['serve', '@angular/build:dev-server'],
    ['test', '@angular-builders/jest:run'],
    ['lint', '@angular-eslint/builder:lint'],
    ['ionic-cordova-build', '@ionic/cordova-builders:cordova-build'],
    ['native', '@iamandersonp/nx-ionic-cordova:native'],
    ['ionic-hook-build', '@iamandersonp/nx-ionic-cordova:ionic-hook'],
    ['ionic-hook-serve', '@iamandersonp/nx-ionic-cordova:ionic-hook']
  ])('target %s uses %s', (target, executor) => {
    expect(targets[target].executor).toBe(executor);
  });

  it('adds live-android and live-ios to build and serve', () => {
    for (const target of ['build', 'serve']) {
      expect(Object.keys(targets[target].configurations ?? {})).toEqual(
        expect.arrayContaining(['production', 'live-android', 'live-ios'])
      );
    }
  });

  it('keeps native without per-environment configurations and android@15', () => {
    const configurations = Object.keys(targets.native.configurations ?? {});
    expect(JSON.stringify(targets.native)).toContain('android@15');
    expect(configurations.filter((key) => /-(test|ante|pre|pro)$/.test(key))).toEqual([]);
  });

  it('never mentions @bde', () => {
    expect(JSON.stringify(project)).not.toContain('@bde');
  });

  it('roots every path at the app and carries no polyfills', () => {
    const serialized = JSON.stringify(project);
    expect(serialized).toContain('apps/shop/src/main.ts');
    expect(serialized).not.toContain('polyfills');
  });

  it.each([
    ['shop', '.', '../', 'shop'],
    ['shop', 'apps', '../../', 'apps/shop'],
    ['shop', 'apps/mobile', '../../../', 'apps/mobile/shop']
  ])('derives $schema and paths for %s in %s', (name, directory, offset, appRoot) => {
    const result = buildAppProjectJson({ ...OPTIONS, name, directory, offset, appRoot });
    expect(result.$schema).toBe(`${offset}node_modules/nx/schemas/project-schema.json`);
    expect(result.sourceRoot).toBe(`${appRoot}/src`);
  });

  it('adds tags only when present', () => {
    expect(project).not.toHaveProperty('tags');
    expect(buildAppProjectJson({ ...OPTIONS, tags: ['a'] })).toHaveProperty('tags', ['a']);
  });
});
