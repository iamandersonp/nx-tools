# Delta for ionic-cordova-init-generator

## RENAMED Requirements

- FROM: `### Requirement: Root devDependencies`
- TO: `### Requirement: Root dependency placement`

## MODIFIED Requirements

### Requirement: Root dependency placement

`init` MUST write the runtime packages the app needs at the supported majors to the root `package.json` `dependencies`: the `@angular/*` runtime set, `@ionic/angular`, `ionicons`, `rxjs` and `tslib`. It MUST write the tooling packages (Cordova 13, `@ionic/cli`, `@ionic/cordova-builders`, `@ionic/angular-toolkit`, `cordova-res`, `native-run`, `@angular-builders/jest`, `@angular-eslint/builder`, `typescript` and the build tooling) to `devDependencies`. It MUST NOT downgrade a higher version already present, and MUST keep existing versions of packages it finds.

(Previously: "Root devDependencies", which placed every package in `devDependencies`.)

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
