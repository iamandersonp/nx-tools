import { buildIonicHookTargets } from '../../shared/build-ionic-hook-targets';
import {
  buildLiveReloadBuildConfigurations,
  buildLiveReloadServeConfigurations
} from '../../shared/build-live-reload-configurations';
import { buildNativeTarget } from '../../shared/build-native-target';
import type { NormalizedAppGeneratorOptions } from './normalize-app-options';

/**
 * Builds the application's `project.json`. Target paths are relative to the workspace root
 * (`appRoot`); only `$schema` points upward, through the depth-derived `offset`.
 *
 * `build`, `serve` and `ionic-cordova-build` depend on `^build` directly, because
 * `targetDefaults` only match a target literally named `build`. `build` declares `outputs` because Nx
 * cannot expand its default `{options.outputPath}` when `outputPath` is an object. `outputPath.base` and
 * `cordovaBasePath` are explicit: `@ionic/cordova-builders` ignores an implicit value.
 *
 * `test` is zoneless like the starter's `main.ts`, and `@angular-builders/jest` resolves its `tsConfig`
 * from the project root and installs the test environment itself, so no setup file is generated.
 *
 * @param options the normalized generator options
 * @return the `project.json` object
 */
export function buildAppProjectJson(options: NormalizedAppGeneratorOptions): Record<string, unknown> {
  const { name, appRoot, offset, prefix, tags } = options;
  const buildOptions = {
    outputPath: { base: `${appRoot}/www`, browser: '' },
    index: `${appRoot}/src/index.html`,
    browser: `${appRoot}/src/main.ts`,
    tsConfig: `${appRoot}/tsconfig.angular.json`
  };

  return {
    $schema: `${offset}node_modules/nx/schemas/project-schema.json`,
    name,
    sourceRoot: `${appRoot}/src`,
    projectType: 'application',
    prefix,
    ...(tags.length > 0 ? { tags } : {}),
    targets: {
      build: {
        executor: '@angular/build:application',
        dependsOn: ['^build'],
        outputs: ['{projectRoot}/www'],
        options: buildOptions,
        configurations: {
          production: {
            fileReplacements: [
              {
                replace: `${appRoot}/src/environments/environment.ts`,
                with: `${appRoot}/src/environments/environment.prod.ts`
              }
            ]
          },
          ...buildLiveReloadBuildConfigurations(appRoot, buildOptions)
        }
      },
      serve: {
        executor: '@angular/build:dev-server',
        dependsOn: ['^build'],
        options: { buildTarget: `${name}:build` },
        configurations: {
          production: { buildTarget: `${name}:build:production` },
          ...buildLiveReloadServeConfigurations(name)
        }
      },
      test: {
        executor: '@angular-builders/jest:run',
        options: { tsConfig: 'tsconfig.spec.json', zoneless: true }
      },
      lint: {
        executor: '@angular-eslint/builder:lint',
        options: { lintFilePatterns: [`${appRoot}/src/**/*.ts`, `${appRoot}/src/**/*.html`] }
      },
      native: buildNativeTarget(),
      ...buildIonicHookTargets(),
      'ionic-cordova-build': {
        executor: '@ionic/cordova-builders:cordova-build',
        dependsOn: ['^build'],
        options: { browserTarget: `${name}:build`, cordovaBasePath: appRoot },
        configurations: { production: { browserTarget: `${name}:build:production` } }
      }
    }
  };
}
