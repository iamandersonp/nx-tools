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

### Requirement: Root dependency placement

`init` MUST write the runtime packages the app needs at the supported majors to the root `package.json` `dependencies`: the `@angular/*` runtime set, `@ionic/angular`, `ionicons`, `rxjs` and `tslib`. It MUST write the tooling packages (Cordova 13, `@ionic/cli`, `@ionic/cordova-builders`, `@ionic/angular-toolkit`, `cordova-res`, `native-run`, `@angular-builders/jest`, `@angular-eslint/builder`, `typescript` and the build tooling) to `devDependencies`. It MUST NOT downgrade a higher version already present, and MUST keep existing versions of packages it finds.

#### Scenario: Runtime packages in dependencies
- GIVEN empty root `dependencies` and `devDependencies`
- WHEN `init` runs
- THEN `@ionic/angular`, `ionicons`, `rxjs`, `tslib` and the `@angular/*` runtime set are in `dependencies` with their ranges
- AND none of them is in `devDependencies`

#### Scenario: Tooling in devDependencies
- GIVEN empty root `dependencies` and `devDependencies`
- WHEN `init` runs
- THEN the tooling packages are in `devDependencies` with their ranges
- AND none of them is in `dependencies`

#### Scenario: Existing newer version
- GIVEN a required package is present at a newer compatible version
- WHEN `init` runs
- THEN that version is kept

#### Scenario: Existing version kept in place
- GIVEN a required runtime package is already declared with a version
- WHEN `init` runs
- THEN its existing version is unchanged

### Requirement: skipFormat and install

With `skipFormat` true `init` MUST NOT format files. It MUST return a callback that installs packages.

#### Scenario: skipFormat
- GIVEN `skipFormat: true`
- THEN no formatting is applied

#### Scenario: Install callback
- WHEN `init` returns
- THEN the returned task installs the added packages
