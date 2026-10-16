# Exploration: `@iamandersonp/nx-ionic-cordova`

A public, general-purpose Nx plugin derived from the private `@bde/nx-ionic-cordova`
(bde-nx `tools/nx-ionic-cordova`). The private plugin stays in bde-nx unchanged: it is
still used to migrate Banco de España apps with per-environment configs.

## Current State

### nx-sonar precedent (the template)

- **Workspace:**
  - Nx 23.2.0, TypeScript ~6.0.3.
  - npm workspaces cover `packages/*` and `tools/*`.
  - The root `tsconfig.json` lists `tools/nx-sonar` in `references`.
  - `eslint.config.mjs` hardcodes the `tools/nx-sonar/src/**/*.ts` glob.
- **`package.json`:**
  - `private: false`, `publishConfig.access: public`, MIT.
  - `main` is `./out-tsc/lib/src/index.js`.
  - `generators`/`executors` point to the JSON manifests.
  - `files` lists `out-tsc/lib`, the manifests, each `schema.json` and `README.md`.
  - There is no `bin`, no `exports`, and no `nx`/`@nx/devkit` peer dependency. A public plugin should declare that peer.
- **Build:**
  - `@nx/js:tsc` outputs to `tools/nx-sonar/out-tsc/lib`.
  - The solution-style `tsconfig.json` uses `module: commonjs`.
  - The manifests point at compiled JS under `./out-tsc/lib/src/...`, with schemas under `./src/...`.
- **Quality:**
  - Jest uses the `nxPreset` with an lcov reporter.
  - The Sonar options live in `project.json`.
  - `typecheck` and `lint` are inferred from `nx.json` plugins.
  - CI runs `run-many -t test build typecheck`.
- **Release:**
  - `release-please-config.json` and `.release-please-manifest.json` each have a `tools/nx-sonar` entry.
  - The workflow runs on `main`.
  - **It only opens release PRs and tags: there is no `npm publish` job, no `NPM_TOKEN` and no provenance.**
- **`init` generator:**
  - It is idempotent and registers `{ plugin }` in `nx.json`, creating `nx.json` if it is missing.
  - It uses the `plugin-entry.ts` helper and has a `skipFormat` option.
- **README shape:** a "provides" table, requirements, install via `nx add`, per-generator usage, and option tables.
- **Consumption:** bde-nx depends on `"@iamandersonp/nx-sonar": "^1.0.2"` and registers the plugin in `nx.json`.

### Local plugin in bde-nx

It is private, has no build target, and is loaded from TS source through swc-register.
It totals about 7,800 `.ts` lines, specs included.

| Piece | Classification |
|---|---|
| `executors/native` (`build-argv`, `resolve-cwd`, `android-emulator`, `plugin-add`/`plugin-rm`) | Portable as-is |
| `executors/ionic-hook` (`map-ionic-hook-options`) | Portable as-is |
| `cli/lib/*` (`strip-reserved-project-flag`, `forward-configuration-as-option`, `build-nx-run-args`) | Portable as-is |
| `cli/ionic-hook.ts` shim | Rewrite (see Executable design) |
| `generators/shared/build-live-reload-configurations` | Portable as-is |
| `generators/shared/build-ionic-hook-targets` | Generalize: executor name is `@bde/...` |
| `generators/shared/build-native-target` | Generalize: `@bde/...` executor, pinned `android@15`, per-environment configs |
| `generators/shared/build-ionic-hook-scripts` | Generalize: hardcoded shim path |
| `generators/shared/to-workspace-package-name` | BdE-specific (`@bde`): drop or parametrize |
| `generators/app/*` | Generalize (see couplings below) |
| `generators/migrate-app/*` (~2,400 lines) | BdE-specific: drop from v1 |

### BdE and workspace couplings

- **Scope and names:**
  - `WORKSPACE_NPM_SCOPE = '@bde'`.
  - The executor strings `@bde/nx-ionic-cordova:*`.
  - The default app is `asb`.
  - The example widget id is `es.bde.<app>`.
- **Per-environment configs:**
  - `config{TEST|ANTE|PROD}.xml` and `environment.prod{TEST}.ts`.
  - `build-ios_*.json` and `build-android_PROD.json`, plus their matching native configurations.
- **Hook script:** `node -r @swc-node/register ../../tools/nx-ionic-cordova/src/cli/ionic-hook.ts <app>:<target>`.
- **Shim root resolution:**
  - It climbs four levels from `__dirname`, which breaks once the package is installed under `node_modules`.
  - It assumes `node_modules/.bin/nx` exists.
- **Fixed layout in the generated app:**
  - `../../tsconfig.base.json`, `../../node_modules/...` and the Jest paths all assume a fixed depth.
  - `directory` accepts any depth, so this is a latent bug.
- **Opinionated dependencies:**
  - Testing and linting: `@angular-builders/jest` and `@angular-eslint/builder`.
  - Localization: `cordova-plugin-localization-strings` with `TRANSLATION_PATH`.
  - Path aliases: `@shared/*`, `@pages/*` and similar.
- **Native binaries:**
  - `spawnSync(context.root/node_modules/.bin/<cli>)` fails on Windows (`.cmd` shims).
  - It also fails under pnpm for binaries that are not hoisted.

### Versions in bde-nx

| Package | Version |
|---|---|
| Angular | 22.0.0 |
| Ionic | 9.0.2 |
| `@ionic/cli` | ^6.18 |
| `@ionic/angular-toolkit` | 13 |
| `@ionic/cordova-builders` | ^10 |
| Cordova | ^13 (android@15) |
| `cordova-res` | ^0.15.4 |
| `native-run` | ^2.0.3 |
| Nx | 23.2.1 |
| TypeScript | 6.0.2 |
| Node | >=22.22.3 <23 |

Platforms are Android and iOS.

## Approaches

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| A. Fork and generalize into `tools/nx-ionic-cordova` in nx-tools | Matches the decision; bde-nx untouched; follows nx-sonar | The two copies drift | Medium/High |
| B. Shared core used by both plugins | No drift | Changes bde-nx; couples it to the public release cadence | High |
| C. Inferred plugin (`createNodes`) driven by one plugin-owned config | The most Nx-native "single config"; removes the generated target blocks | A new design rather than a port | High |

## Recommendation

**A**, in thin slices. C is a possible later evolution.

v1 scope:
- the `native` and `ionic-hook` executors;
- the `bin` hook;
- an `init` generator;
- a generalized `app` generator.

Out of scope: `migrate-app` and `to-workspace-package-name`.

## "Single config file": candidate interpretations (open)

1. **Single environment.** One `environment.ts`/`environment.prod.ts`, one `config.xml`, no per-environment templates, and `debug`/`release` native configurations. Simplest, but it drops env templating.
2. **`config.xml` as the single source of app identity.** Cordova-idiomatic. It is only partial, because Cordova persists plugin variables into `package.json`.
3. **Plugin-owned config** (in the `nx.json` plugin entry or a dedicated file), with inferred targets. Best UX, largest scope (Approach C).
4. **`ionic.config.json` + `config.xml` with no `cordova` key in `package.json`.** Brittle, because it depends on Cordova's persistence behavior.

## Generic app template and `init`

- **Template:**
  - Angular 22 / Ionic 9 / Cordova 13 / Nx 23, for Android and iOS.
  - Compute the relative depth from `directory` instead of hardcoding `../../`.
  - Make the localization plugin and the Jest/ESLint builder choices optional.
- **`init`** (warranted, since `nx add` runs it):
  - Register the plugin idempotently.
  - Add the required devDependencies with `addDependenciesToPackageJson`.
  - Support `skipFormat`.
- **Version claims:** prefer peer ranges plus a tested matrix over pinned majors.

## Executable design

- **`bin`:**
  - Declare `"bin": { "nx-ionic-hook": "./out-tsc/lib/src/cli/ionic-hook.js" }`, with a shebang in that file.
  - npm puts every ancestor `node_modules/.bin` on `PATH` during `npm run`, so the generated script becomes `nx-ionic-hook <app>:ionic-hook-build`.
- **Workspace root:** climb from `process.cwd()` to the nearest `nx.json`, falling back to `NX_WORKSPACE_ROOT`.
- **Nx binary:** `require.resolve('nx/bin/nx.js', { paths: [root] })`, spawned with `process.execPath`. This avoids `.bin`/`.cmd` problems on Windows and pnpm.
- **Native executor:** apply the same resolution to its CLI lookup.

## Packaging and publishing checklist

- **`package.json`:**
  - Name, `private: false`, MIT, `publishConfig.access: public`.
  - `repository`/`homepage`.
  - `main`, `bin`, `generators`, `executors`, `files`.
  - `peerDependencies` for `nx`/`@nx/devkit`, `@ionic/cli` and `cordova`.
- **Project files:** `project.json`, the tsconfigs, `jest.config.js`, and manifests pointing at compiled JS.
- **Workspace wiring:** the root tsconfig reference, the `eslint.config.mjs` glob, and the Sonar key.
- **Release:** release-please config and manifest entries.
- **README.**
- **Publish step:** missing from the repo, so it needs a decision.
- **Tarball check:** run `npm pack --dry-run`.

## Size estimate against the 400-line review budget

The port is about 4,500–5,000 authored lines, specs included, so the budget will be exceeded
without chaining.

| # | Slice | Approx. lines |
|---|---|---|
| 1 | Package scaffold and release wiring | ~150–200 |
| 2 | `native` executor, in sub-slices | ~300 each |
| 3 | `ionic-hook` executor | |
| 4 | `bin` + `cli/lib` helpers + root/nx resolution | ~350 |
| 5 | Generalized shared target builders | |
| 6 | `init` generator | ~250 |
| 7 | `app` generator, in 2–3 sub-slices | |
| 8 | README and publish workflow | |

## Risks

- There is no npm publish step in nx-tools.
- The `app` generator's `../../` layout bug ships if it is ported unchanged.
- Windows and pnpm behavior is unverified.
- The local and public copies will drift, so a sync policy needs to be stated.
- The recent Angular/Ionic/Cordova majors need a supported-range statement.
- The work is about 12–14 chained slices unless the scope is cut.

## Open Questions

1. Which meaning of "single config file" applies?
2. Is `migrate-app` out of v1? (Recommended: yes.)
3. Does the `app` generator ship in v1, or only `init`, the executors and the `bin`?
4. How are releases published: a workflow job with `NPM_TOKEN`/provenance, or manual?
5. Which Angular/Ionic/Cordova ranges are supported?
6. Is Windows support a v1 goal?

## Answers (user, 2026-10-16)

1. **Single config file:** interpretation 1. The generated app has exactly one `config.xml`,
   one `src/environments/environment.ts` and one `src/environments/environment.prod.ts`,
   like a stock Ionic/Cordova app. There are no per-environment variants.
2. **`migrate-app`:** out of v1. Migration of BdE-shaped apps stays in the private bde-nx plugin.
3. **`app` generator:** ships in v1 and produces the generic app above.
4. **Publishing:** stays manual (`npm publish` by the maintainer), as with nx-sonar. release-please keeps
   opening release PRs and tags only. No publish job is added; this is not a gap to fix.
5. **Supported versions:** current majors only. Peer dependencies are `nx`/`@nx/devkit` `^23`, and the
   `app` generator targets Angular 22, Ionic 9 and Cordova 13 (android@15). Support for later majors
   is added once it has been tested.
6. **Windows:** supported in v1. The `bin` and the `native` executor resolve CLIs with
   `require.resolve` and spawn them via `process.execPath`, never through `node_modules/.bin`, so they
   work on Windows and pnpm. iOS still requires macOS, which is a Cordova constraint.

## Ready for Proposal

Yes, once questions 1–4 are answered.
