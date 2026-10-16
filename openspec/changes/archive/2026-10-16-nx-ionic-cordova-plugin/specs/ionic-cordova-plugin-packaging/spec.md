# Delta for ionic-cordova-plugin-packaging

## ADDED Requirements

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

The root `tsconfig.json` MUST reference the project, `eslint.config.mjs` MUST cover its sources, and `release-please-config.json` and `.release-please-manifest.json` MUST each contain a `tools/nx-ionic-cordova` entry. No publish job, `NPM_TOKEN` or provenance MUST be added.

#### Scenario: Release entries
- THEN both release files contain the package entry

#### Scenario: No automation publish
- THEN no workflow runs `npm publish`

### Requirement: No private coupling and README

No shipped file MAY reference `@bde`, `es.bde`, `asb` defaults or `node_modules/.bin` spawning. The README MUST document requirements, `nx add`, each generator and executor, option tables, and supported majors.

#### Scenario: Clean sources
- WHEN the sources are searched
- THEN no BdE reference remains

#### Scenario: Private plugin untouched
- THEN bde-nx has no change from this work
