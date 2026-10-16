# Delta for ionic-cordova-plugin-packaging

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Workspace and release wiring

The root `tsconfig.json` MUST reference the project, `eslint.config.mjs` MUST cover its sources, and `release-please-config.json` and `.release-please-manifest.json` MUST each contain a `tools/nx-ionic-cordova` entry. No publish job, `NPM_TOKEN` or provenance MUST be added. A unit test MUST verify the release entries.

#### Scenario: Release entries
- THEN both release files contain the package entry
- AND every package in the release-please config has a key in the manifest (verified by a unit test in `packaging.spec.ts`)

#### Scenario: No automation publish
- THEN no workflow runs `npm publish`
