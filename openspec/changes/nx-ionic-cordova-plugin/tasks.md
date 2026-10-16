# Tasks: Public `@iamandersonp/nx-ionic-cordova` plugin

Spec tags: NAT = native-executor, HOOK = hook, INIT = init-generator, APP = app-generator, PKG = plugin-packaging.
Private source to port (read-only): `/mnt/Almacenamiento/asbmain/tools/nx-ionic-cordova/src`. Template project: `tools/nx-sonar`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~3,500 total (12 slices, 180-390 each) |
| 400-line budget risk | High (total); Medium per slice (slices 9 and 11 sit near the cap) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → ... → PR 12 (one per slice) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

Needs a choice before apply: stacked-to-main, feature-branch-chain, or size-exception. Slices 1-12 are ordered by dependency, so any chain strategy works. If a slice measures above 400 lines, split it before PR; do not take size-exception silently.

### Suggested Work Units

| Unit | Goal | Est. lines | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Scaffold, workspace and release wiring, `plugin-entry` | ~180 | `npm exec nx run nx-ionic-cordova:test` | `npm exec nx show projects` lists the project | Delete `tools/nx-ionic-cordova` and revert 4 root files |
| 2 | Resolver | ~220 | `... test --testPathPattern=resolve-cli` | Spec with temp dirs | Remove `src/shared` |
| 3 | `native` core | ~300 | `... --testPathPattern=executors/native` | Mocked spawn | Remove `executors/native` + manifest entry |
| 4 | Emulator, plugin add/rm | ~280 | `... --testPathPattern=android-emulator\|native` | Fake adb | Revert files in slice |
| 5 | `ionic-hook` executor | ~200 | `... --testPathPattern=executors/ionic-hook` | Mocked `runExecutor` | Remove `executors/ionic-hook` |
| 6 | `bin` + `cli/lib` | ~300 | `... --testPathPattern=cli` | Run compiled bin with no target (usage, exit 1) | Remove `src/cli` + `bin` field |
| 7 | Shared target builders | ~330 | `... --testPathPattern=generators/shared` | N/A (pure functions) | Remove `generators/shared/build-*` |
| 8 | `init` + `versions.ts` | ~300 | `... --testPathPattern=generators/init` | `createTreeWithEmptyWorkspace` | Remove `generators/init`, `utils` |
| 9 | `app` schema, normalize, depth, `project.json` | ~380 | `... --testPathPattern=generators/app` | Tree at depths 1/2/3 | Remove `generators/app` (sans files) |
| 10 | Wiring templates | ~350 | `... --testPathPattern=generators/app` | Tree: exactly one `config.xml` | Remove wiring templates |
| 11 | Starter source templates + `assets` copy | ~390 | `... --testPathPattern=generators/app` and `nx run nx-ionic-cordova:build` | Build output has `files/**` | Remove source templates + `assets` entry |
| 12 | README + pack check | ~250 | `... --testPathPattern=packaging` | `npm pack --dry-run` | Revert README + packaging spec |

Every slice ends with its gate tasks: `npm run test:ci`, `npm run typecheck`, `npm exec nx run-many -t lint`, plus `npm run prettier-staged`. They are listed once per slice below. Commit per slice: conventional `feat(nx-ionic-cordova): ...`, no AI attribution.

## Slice 1: Scaffold and wiring (~180 lines) [PKG]

- [x] 1.1 RED: `src/generators/shared/plugin-entry.spec.ts` asserts `PLUGIN_NAME === package.json#name` and `NATIVE_EXECUTOR`/`IONIC_HOOK_EXECUTOR` suffixes. [PKG manifest]
- [x] 1.2 Create `package.json` (public, MIT, peers `nx`/`@nx/devkit` `^23`, `bin`, `files`, compiled manifests), `project.json` (`@nx/js:tsc`), `tsconfig.json`, `tsconfig.lib.json`, `jest.config.js`, empty `executors.json`/`generators.json`, `src/index.ts`, copying the nx-sonar shape. [PKG manifest, build targets]
- [x] 1.3 GREEN: `src/generators/shared/plugin-entry.ts`.
- [x] 1.4 Wiring: root `tsconfig.json` reference, `eslint.config.mjs` glob, `release-please-config.json`, `.release-please-manifest.json` (`0.0.0`), `package-lock.json`. No publish job. [PKG wiring]
- [x] 1.5 RED/GREEN spec: manifest paths are not `.ts`; peers are `^23`. [PKG compiled targets, peers]
- [x] 1.6 Gates: test:ci, typecheck, lint, `nx build nx-ionic-cordova`.

## Slice 2: Resolver (~220 lines) [NAT, HOOK]

- [x] 2.1 RED `src/shared/resolve-cli.spec.ts`: `findWorkspaceRoot` nested climb, env fallback, throw (temp dirs). [HOOK root resolution]
- [x] 2.2 RED: `resolveCliEntry` string and object `bin`; `argv[0] === execPath`; no path has `.bin`; missing package error names the package. [NAT resolution]
- [x] 2.3 RED: `spawnCli` with `;`/`&&` in an arg stays one element, `shell: false`. [Threat: argv]
- [x] 2.4 GREEN `src/shared/resolve-cli.ts` with injected `ResolverDeps`; REFACTOR.
- [x] 2.5 Gates.

## Slice 3: `native` core (~300 lines) [NAT]

- [x] 3.1 Port `schema.json`, `schema.d.ts`, `lib/build-argv.ts` and spec (private source). [NAT argv]
- [x] 3.2 RED: argv ordering, emulator `--target` last, no `--target` for device.
- [x] 3.3 RED `lib/resolve-cwd.spec.ts`: project cwd, missing `projectName` throws, unknown project. [NAT cwd]
- [x] 3.4 RED `executor.spec.ts`: spawn through `spawnCli`; missing CLI returns `{success:false}` and spawns nothing; exit 1 fails. [NAT result]
- [x] 3.5 GREEN `lib/resolve-cwd.ts`, `executor.ts`; register in `executors.json`.
- [x] 3.6 Gates.

## Slice 4: Emulator and plugin add/rm (~280 lines) [NAT]

- [x] 4.1 Port `lib/android-emulator.ts` and spec. RED: first `emulator-<n>` in state `device`, multiple log, offline/physical ignored, none/adb failure warns once. [NAT emulator]
- [x] 4.2 RED: adb lookup order `ANDROID_HOME` → `ANDROID_SDK_ROOT` → PATH; empty counts as unset.
- [x] 4.3 RED: `--plugin` yields `plugin add <spec>`, one argv element; omitted `--plugin` invents nothing. [NAT plugin]
- [x] 4.4 GREEN wiring in executor.
- [x] 4.5 Validate open question: `native-run` discovery without `.bin` on PATH; record the outcome in the PR.
- [x] 4.6 Gates.

## Slice 5: `ionic-hook` executor (~200 lines) [HOOK]

- [x] 5.1 Port `schema.*` and spec; RED for all mapping scenarios (web, cordova, serve, `live-<platform>`, conflict throws, fallback config, `PORT`, failed result, missing project). [HOOK mapping, live reload, config/PORT]
- [x] 5.2 GREEN `executor.ts`; register in `executors.json`; REFACTOR with `plugin-entry`.
- [x] 5.3 Gates.
- [x] 5.4 RED/GREEN `spawnCli` passes the child an env with `<root>/node_modules/.bin` first on PATH (`path.delimiter`, PATH key casing kept); the command stays `execPath` + entry. [NAT resolver, native-run follow-up from 4.5]

## Slice 6: `bin` and `cli/lib` (~300 lines) [HOOK, PKG]

- [x] 6.1 Port `src/cli/lib/*` and specs. RED: strip `--project`/`-p`, rewrite `-c`/`--configuration` to `--buildConfiguration`, drop dangling flag. [HOOK normalization]
- [x] 6.2 RED `ionic-hook.spec.ts`: no target prints usage, exit 1; no root exits 1; child exit 3 propagates; spawn via `execPath` with cwd at root. [HOOK executable]
- [x] 6.3 GREEN `src/cli/ionic-hook.ts` with the `#!/usr/bin/env node` shebang; `package.json#bin` points to compiled file.
- [x] 6.4 RED/GREEN: built bin is executable (`chmod` in build or assets step). [PKG bin runnable]
- [x] 6.5 Gates plus `nx build` and run the compiled bin without args.

## Slice 7: Shared target builders (~330 lines) [APP]

- [x] 7.1 Port `build-live-reload-configurations` and spec.
- [x] 7.2 RED `build-native-target.spec.ts`: add/rm, build, live, install, plugin-add/rm and resource configurations; `android@15`; no `-test`/`-ante` per-env configs; executor string has no `@bde`. [APP native configs]
- [x] 7.3 RED `build-ionic-hook-targets.spec.ts` and `build-ionic-hook-scripts.spec.ts`: `nx-ionic-hook shop:ionic-hook-build`, no swc, no relative path. [APP package.json]
- [x] 7.4 GREEN the three builders using `plugin-entry`.
- [x] 7.5 Gates.

## Slice 8: `init` and `versions.ts` (~300 lines) [INIT]

- [x] 8.1 Create `src/utils/versions.ts` constants; check `@angular-builders/jest` and `@angular-eslint` ranges against the registry (open question).
- [x] 8.2 RED `init.spec.ts`: single entry (string and object), re-run unchanged, missing `nx.json` created. [INIT registration]
- [x] 8.3 RED: devDependencies added, newer version kept (`keepExistingVersions`), `skipFormat`, install callback returned. [INIT deps, skipFormat]
- [x] 8.4 GREEN `generators/init/{generator,schema.json,schema.d.ts}`; register in `generators.json`.
- [x] 8.5 Validate that Nx 23 accepts a plugin with no `createNodes` without warnings (open question).
- [x] 8.6 Gates.

## Slice 9: `app` options, depth and `project.json` (~380 lines) [APP]

- [x] 9.1 RED `normalize-app-options.spec.ts`: missing `appId` throws with no writes; `Not Valid` throws naming the option; existing project throws; defaults (`apps`, `app`, `displayName`). [APP options]
- [x] 9.2 RED: depth 1, 2, 3 yield `../`, `../../`, `../../../` via `offsetFromRoot`. [APP depth]
- [x] 9.3 RED `build-app-project-json.spec.ts`: each target's executor string, `live-android`/`live-ios`, no `@bde`. [APP targets]
- [x] 9.4 GREEN `schema.*`, `lib/normalize-app-options.ts`, `lib/build-app-project-json.ts` (`generator.ts` and registration moved to slice 10 per 9.5).
- [x] 9.5 Gates. Measure the diff; if over 400, move `generator.ts` wiring into slice 10.

## Slice 10: Wiring templates (~350 lines) [APP]

- [x] 10.0 RED/GREEN `generator.ts` (moved from 9.4): validate, `addProjectConfiguration` from `buildAppProjectJson`, register in `generators.json`.
- [x] 10.1 RED `generator.spec.ts`: exactly one `config.xml` with widget id and display name; no `config*.xml` variant or `build-*_ENV.json`. [APP single config, identity]
- [x] 10.2 RED: app `package.json` has name, hook scripts, `cordova: {plugins:{}, platforms:[]}` and no dependency keys. [APP package.json]
- [x] 10.3 RED: tsconfigs, `jest.config.js`, `setup-jest.ts` offsets at depths 1/2/3; `skipFormat`; re-run for another name leaves other projects intact. [APP depth, format]
- [x] 10.4 GREEN `files/` (`config.xml__tmpl__`, `ionic.config.json__tmpl__`, `package.json__tmpl__`, `tsconfig*.json__tmpl__`, `jest.config.js__tmpl__`, `setup-jest.ts__tmpl__`, environments) via `generateFiles`.
- [x] 10.5 Gates.

## Slice 11: Starter source templates and assets copy (~390 lines) [APP, PKG]

- [x] 11.1 RED: generated tree contains the starter file set listed in design "Interfaces / Contracts" (index.html, main.ts, global.scss, theme, assets, app and home files, specs); no `src/test-setup.ts`. [APP starter-equivalent]
- [x] 11.2 RED: no file contains localization plugin, `TRANSLATION_PATH`, `@shared/*` alias or `@bde`. [APP no extras, PKG clean sources]
- [x] 11.3 GREEN `files/src/**` templates, verbatim from `ionic-team/starters@main` (base + blank overlay), with the Jest bootstrap adaptation for the starter specs.
- [x] 11.4 Add `assets` entry to `project.json` copying `files/**` into `out-tsc/lib/src/generators/app/files`.
- [x] 11.5 Gates plus `nx build nx-ionic-cordova`; confirm templates in the build output.

## Slice 12: README and pack check (~250 lines) [PKG]

- [x] 12.1 RED `packaging.spec.ts`: `files` covers every manifest path, schema and templates; no spec or source outside `files`; repo-wide check finds no `@bde`/`es.bde`/`asb` default/`.bin` spawn; no workflow runs `npm publish`. [PKG tarball, no coupling, wiring]
- [x] 12.2 GREEN: adjust `files` and `.npmignore` as needed.
- [x] 12.3 Write `tools/nx-ionic-cordova/README.md`: requirements, `nx add`, `init` and `app` options tables, `native` and `ionic-hook` executor options, supported majors, manual-publish note. [PKG README]
- [x] 12.4 Run `npm exec nx run nx-ionic-cordova:build` then `npm pack --dry-run` in `tools/nx-ionic-cordova`; confirm compiled JS, manifests, schemas, template files, README and executable `bin` are listed, and no specs.
- [x] 12.5 Final gates: test:ci, typecheck, lint, build; confirm bde-nx has no diff. No publish automation is added.
