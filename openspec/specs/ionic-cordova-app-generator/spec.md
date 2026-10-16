# ionic-cordova-app-generator Specification

## Requirements

### Requirement: Options and validation

The `app` generator MUST require `name` and `appId`, and accept `directory` (default `apps`), `displayName`, `prefix` (default `app`), `tags` and `skipFormat`. It MUST fail without writing files when `appId` is missing or not a valid reverse-DNS id. It MUST NOT adopt a standalone non-Nx project.

#### Scenario: Missing appId
- WHEN the generator runs without `appId`
- THEN it throws and the tree is unchanged

#### Scenario: Invalid appId
- GIVEN `appId` is `Not Valid`
- THEN it throws naming the option

#### Scenario: Existing project
- GIVEN project `name` already exists
- THEN it throws and writes nothing

### Requirement: Starter-equivalent sources

Apart from the Nx wiring and the single-environment layout, sources and config MUST equal the official Ionic Angular standalone starter (Angular 22, Ionic 9). Exactly one `config.xml` (with `appId` as widget id and the display name), one `src/environments/environment.ts` and one `environment.prod.ts` MUST exist. There MUST be no localization plugin, no `TRANSLATION_PATH`, no per-environment variants and no path aliases.

#### Scenario: Single config set
- WHEN generated
- THEN one `config.xml`, `environment.ts` and `environment.prod.ts` exist and no `config*.xml` variant or `build-*_ENV.json`

#### Scenario: Widget identity
- GIVEN `appId: com.acme.shop`
- THEN `config.xml` widget id is `com.acme.shop`

#### Scenario: No opinionated extras
- THEN no localization plugin or `@shared/*`-style alias appears in any file

### Requirement: Targets and wiring

`project.json` MUST contain `build` (`@angular/build:application`), `serve` (`@angular/build:dev-server`), `test` (`@angular-builders/jest:run`), `lint` (`@angular-eslint/builder:lint`), `ionic-cordova-build` (`@ionic/cordova-builders:cordova-build`), `native`, `ionic-hook-build` and `ionic-hook-serve` using `@iamandersonp/nx-ionic-cordova` executors, and `live-android`/`live-ios` build and serve configurations. No executor string may contain `@bde`.

#### Scenario: Executors
- WHEN generated
- THEN each listed target uses the stated executor

#### Scenario: Native configurations
- THEN `native` provides add/rm, build, live, install, plugin-add/rm and resource configurations, with Android platform `android@15`, and without per-environment configurations

### Requirement: App package.json

The app `package.json` MUST contain its name, the hook scripts and Cordova metadata, and MUST NOT contain `dependencies` or `devDependencies`. Its scripts `ionic:build` and `ionic:serve` MUST invoke `nx-ionic-hook <name>:ionic-hook-build|serve`, with no swc-register and no relative path to the plugin.

#### Scenario: No dependencies
- THEN the app `package.json` has neither dependency key

#### Scenario: Hook scripts
- GIVEN name `shop`
- THEN `ionic:build` is `nx-ionic-hook shop:ionic-hook-build`

### Requirement: Depth-derived relative paths

All relative paths to the workspace root (tsconfig extends, Jest preset, eslint config, output paths) MUST be computed from the depth of `directory/name`.

#### Scenario: Depth 2
- GIVEN directory `apps`
- THEN root references use `../../`

#### Scenario: Depth 1
- GIVEN directory `.` and name `shop`
- THEN root references use `../`

#### Scenario: Depth 3
- GIVEN directory `apps/mobile`
- THEN root references use `../../../`

### Requirement: Format and layout

With `skipFormat` false the generator MUST format generated files; with true it MUST NOT. Re-running for a different name MUST NOT alter other projects.

#### Scenario: skipFormat
- GIVEN `skipFormat: true`
- THEN no formatting is applied
