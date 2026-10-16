# ionic-cordova-init-generator Specification

## Requirements

### Requirement: Plugin registration

The `init` generator MUST register `@iamandersonp/nx-ionic-cordova` in the `plugins` of `nx.json`, creating `nx.json` if absent, and MUST be idempotent.

#### Scenario: First run
- GIVEN `nx.json` has no such plugin
- WHEN `init` runs
- THEN exactly one entry for the plugin exists

#### Scenario: Re-run
- GIVEN the plugin is already registered
- WHEN `init` runs again
- THEN `nx.json` and `package.json` are unchanged

#### Scenario: Missing nx.json
- GIVEN no `nx.json`
- WHEN `init` runs
- THEN `nx.json` is created containing the plugin

### Requirement: Root devDependencies

`init` MUST add to the root `package.json` `devDependencies` every package the app needs at the supported majors (Angular 22, Ionic 9, Cordova 13, `@ionic/cli`, `@ionic/cordova-builders`, `@ionic/angular-toolkit`, `cordova-res`, `native-run`, `@angular-builders/jest`, `@angular-eslint/builder`, and the build tooling). It MUST NOT downgrade a higher version already present.

#### Scenario: Dependencies added
- GIVEN an empty root `devDependencies`
- THEN the required packages are present with their ranges

#### Scenario: Existing newer version
- GIVEN a required package is present at a newer compatible version
- THEN that version is kept

### Requirement: skipFormat and install

With `skipFormat` true `init` MUST NOT format files. It MUST return a callback that installs packages.

#### Scenario: skipFormat
- GIVEN `skipFormat: true`
- THEN no formatting is applied

#### Scenario: Install callback
- WHEN `init` returns
- THEN the returned task installs the added packages
