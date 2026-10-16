# ionic-cordova-plugin-packaging Specification

## Requirements

### Requirement: Package manifest

`tools/nx-ionic-cordova/package.json` MUST declare name `@iamandersonp/nx-ionic-cordova`, `private: false`, license MIT, `publishConfig.access: public`, `main` and manifests pointing at compiled JS, `generators`, `executors`, and `bin` `nx-ionic-hook` pointing at the compiled hook CLI. Peer dependencies MUST be `nx` and `@nx/devkit` at `^23`.

#### Scenario: Public package
- THEN the manifest satisfies each field above

#### Scenario: Peers
- THEN `nx` and `@nx/devkit` peers are `^23`

#### Scenario: Compiled targets
- THEN no manifest path points at a `.ts` source file

### Requirement: Tarball contents

`npm pack --dry-run` MUST list the compiled JS, `generators.json`, `executors.json`, every `schema.json`, template files and `README.md`, and the `bin` file MUST be executable with a shebang. The tarball MUST NOT contain specs or sources outside `files`.

#### Scenario: Complete tarball
- WHEN the dry-run is executed after build
- THEN all listed items are present

#### Scenario: Bin runnable
- THEN the bin file starts with a node shebang and is executable

### Requirement: Build and quality targets

The project MUST provide `build` (out-tsc), `test`, `typecheck` and `lint` targets that pass via `npm run test:ci`, build, typecheck and lint.

#### Scenario: Green gates
- WHEN the four targets run
- THEN all succeed

### Requirement: Workspace and release wiring

The root `tsconfig.json` MUST reference the project, `eslint.config.mjs` MUST cover its sources, and `release-please-config.json` and `.release-please-manifest.json` MUST each contain a `tools/nx-ionic-cordova` entry. No publish job, `NPM_TOKEN` or provenance MUST be added. A unit test MUST verify the release entries.

#### Scenario: Release entries
- THEN both release files contain the package entry
- AND every package in the release-please config has a key in the manifest (verified by a unit test in `packaging.spec.ts`)

#### Scenario: No automation publish
- THEN no workflow runs `npm publish`

### Requirement: No private coupling and README

No shipped file MAY reference `@bde`, `es.bde`, `asb` defaults or `node_modules/.bin` spawning. The README MUST document requirements, `nx add`, each generator and executor, option tables, and supported majors.

#### Scenario: Clean sources
- WHEN the sources are searched
- THEN no BdE reference remains

#### Scenario: Private plugin untouched
- THEN bde-nx has no change from this work

### Requirement: Local tarball smoke target

The project MUST provide an `e2e` target with `cache: false` and `dependsOn: ["build"]`, local only: it MUST NOT be added to any CI workflow. The target MUST run a smoke script located outside `src/**` (so it is excluded from `test`, `typecheck`, `lint` and the tarball). The script MUST spawn commands with argv arrays and no shell, and MUST: pack the built plugin; create a fresh Nx 23 workspace; install the tarball; run `init`; generate app `demo`; then run `demo:build`, `demo:test` and `demo:lint`. It MUST fail when any of those exits non-zero, when the `demo:test` output contains `TS151001`, or when generating an app with a path-like name succeeds.

#### Scenario: Target definition
- WHEN `project.json` is read
- THEN `targets.e2e` has `cache: false` and `dependsOn` including `build`

#### Scenario: Happy path
- GIVEN registry access
- WHEN `nx run nx-ionic-cordova:e2e` runs
- THEN `demo:build`, `demo:test` and `demo:lint` exit 0 and the target exits 0

#### Scenario: TS151001 regression
- GIVEN `demo:test` output contains `TS151001`
- WHEN the smoke assertions run
- THEN the target exits non-zero

#### Scenario: Path-like name rejected
- WHEN the script generates an app whose name is path-like
- THEN the generator fails and the script treats that as success
- AND if the generator succeeds the target exits non-zero

#### Scenario: Not gated in CI
- THEN no workflow under `.github/workflows` invokes the `e2e` target

#### Scenario: Not shipped
- WHEN `npm pack --dry-run` runs after build
- THEN the smoke script is not in the tarball

### Requirement: README dependency and TypeScript documentation

The README MUST state that `init` writes runtime packages (`@angular/*` runtime set, `@ionic/angular`, `ionicons`, `rxjs`, `tslib`) to root `dependencies` and tooling to `devDependencies`, keeping existing versions. Its requirements MUST state `typescript ~6.0` and the reason: the Angular 22 toolchain (`@angular/build`, `@angular-devkit/build-angular`, `@ionic/angular-toolkit`, `typescript-eslint`) peers on `<6.1`. The `versions.ts` comment MUST record the same rationale.

#### Scenario: Dependency placement documented
- WHEN the README is read
- THEN it states runtime packages go to `dependencies` and tooling to `devDependencies`

#### Scenario: TypeScript range documented
- WHEN the README requirements are read
- THEN they state `typescript ~6.0` and that the Angular 22 toolchain peers on `<6.1`
