# Apply progress: nx-ionic-cordova-plugin

## Delivery

- delivery_strategy: `auto-chain`
- chain_strategy: `feature-branch-chain` (tracker `feat/nx-ionic-cordova`; PR 1 targets the tracker, later PRs target the previous slice branch)
- Review budget: 400 changed lines per slice
- Mode: Strict TDD (runner `npm run test:ci`)

## Slice 1: Scaffold and wiring (branch `feat/nx-ionic-cordova-01-scaffold`)

Tasks 1.1-1.6 complete. Slices 3-12 pending (slice 2 below).

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1/1.3 | `src/generators/shared/plugin-entry.spec.ts` | Unit | N/A (new) | Written; failed with "Cannot find module './plugin-entry'" (1 suite failed) | 4/4 passed | 4 cases (name parity, two suffixes, no private scope) | None needed |
| 1.2/1.5 | `src/manifest.spec.ts` | Unit | N/A (new) | Written alongside the config files it reads | 3/3 passed | 3 cases (identity, compiled paths, peers) | None needed |
| 1.4 | n/a (config wiring) | - | N/A | Covered by lint, typecheck and build gates | Gates green | Skipped: purely structural config | None needed |

Deviation from strict order: `package.json` and the other scaffold files were written before `manifest.spec.ts` because the spec reads them and jest needs the config to run at all. The manifest spec therefore passed on its first run; its assertions were not observed failing. The `plugin-entry` spec was observed RED before `plugin-entry.ts` existed.

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec nx run nx-ionic-cordova:test` - 2 suites, 7 tests passed |
| Runtime harness | `npm exec nx run nx-ionic-cordova:build` succeeded and emitted `out-tsc/lib/src/index.js` and `generators/shared/plugin-entry.js`; `nx show projects` lists `nx-ionic-cordova` through the workspace project graph |
| Rollback boundary | Delete `tools/nx-ionic-cordova`; revert `tsconfig.json`, `eslint.config.mjs`, `release-please-config.json`, `.release-please-manifest.json`, `package-lock.json` |

### Gate results

- `npm run test:ci`: nx-ionic-cordova and nx-sonar test targets passed.
- `npm run typecheck`: passed.
- `npm exec -- nx run-many -t lint`: nx-ionic-cordova passes. nx-sonar fails with 3 `Unused eslint-disable directive` errors in the git-ignored `tools/nx-sonar/coverage/lcov-report/*.js`; reproduced on the clean baseline, so it is pre-existing and unrelated. (Plain `npm exec nx run-many -t lint` lets npm swallow `-t`; the `--` form is required.)
- `nx run nx-ionic-cordova:build`: passed.

### Notes

- `package-lock.json` churn (about 190 lines) comes from adding the workspace with `nx` and `@nx/devkit` as peers: npm now treats those trees as non-dev (`dev: true` becomes `devOptional`). It is generated and excluded from the authored count.
- Changed lines excluding the lockfile are about 260 additions and 1 deletion, under the 400 budget.
- `src/index.ts` re-exports the executor ids; the nx-sonar-style `createNodes` is not added (the open question about Nx 23 and a plugin without it is task 8.5).

## Slice 2: Resolver (branch `feat/nx-ionic-cordova-02-resolver`)

Tasks 2.1-2.5 complete. Slices 3-12 pending.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 2.1 | `src/shared/resolve-cli.spec.ts` | Unit (temp dirs) | N/A (new) | Failed with "Cannot find module './resolve-cli'" | Passed | 6 cases (nested climb, nearest wins, env fallback, nx.json over env, throw, empty env unset) | Import sort fixed by eslint |
| 2.2 | same | Unit (injected deps) | N/A (new) | Same RED run | Passed | 7 cases (string bin, object bin, no `.bin`, resolve from root, missing package, missing bin name, `exports` fallback) | None needed |
| 2.3 | same | Unit (injected spawn) | N/A (new) | Same RED run | Passed | 5 cases (execPath + entry first, `;`/`&&`/`$()` stays one element with `shell:false`, exit status, null status gives 1, unresolved spawns nothing) | None needed |
| 2.4 | `src/shared/resolve-cli.ts` | - | - | - | Whole suite green | - | Extracted `locateManifest` |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 3 suites, 25 tests passed (18 new) |
| Runtime harness | Temp-dir specs for `findWorkspaceRoot`; resolution and spawn use injected deps, so no process is spawned (explicitly N/A for a real spawn; slice 3 exercises the executor path) |
| Rollback boundary | Delete `tools/nx-ionic-cordova/src/shared` |

### Gate results

- `npm run test:ci`, `npm run typecheck`, `npm exec -- nx run nx-ionic-cordova:lint`: passed.

### Notes

- Design `ResolverDeps` is `{ resolve, readJson, spawn, execPath }`. Fallback when `exports` blocks `package.json` (`ERR_PACKAGE_PATH_NOT_EXPORTED`): resolve the main entry, climb to the directory whose manifest `name` equals the package.
- Any other resolve failure is rethrown as an error naming the package, with the original as `cause`.
- Unlike the private source, nothing here reads `node_modules/.bin`.

## Slice 3: `native` core (branch `feat/nx-ionic-cordova-03-native-core`)

Tasks 3.1-3.6 complete.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 3.1/3.2 | `src/executors/native/lib/build-argv.spec.ts` (ported) | Unit | N/A (new) | Failed: "Cannot find module './build-argv'" (3 suites failed, 25 prior tests passing) | 8/8 | 8 cases (serial last, plain emulator, device/unset ignore serial, plugin order, git URL one element) | None |
| 3.3 | `lib/resolve-cwd.spec.ts` | Unit | N/A (new) | Failed: "Cannot find module './resolve-cwd'" | 4/4 | 4 cases (cwd, second project, unset, unknown) | Dropped private localisation commentary |
| 3.4/3.5 | `executor.spec.ts` | Unit (mocked `spawnCli`) | N/A (new) | Failed: "Cannot find module './executor'" | 7/7 | 7 cases (default cordova, cli-to-package map x3, exit 1, unresolved CLI, no project) | None |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 6 suites, 44 tests passed (19 new) |
| Runtime harness | N/A for a real spawn: executor specs mock `spawnCli`; the resolver specs cover the spawn contract |
| Rollback boundary | Delete `tools/nx-ionic-cordova/src/executors`; restore `executors.json` to `"executors": {}` |

### Notes

- No `node_modules/.bin`, `@bde` ids or localisation commentary. Emulator targeting arrives in slice 4 (`buildArgv` keeps its optional serial parameter).
- A missing CLI is caught: error log naming CLI and package, `{ success: false }`. A missing project throws, per the spec.
- Risk: `executors.json` points schemas at `./src/...` but `package.json#files` publishes only `out-tsc/lib` (same as nx-sonar). Fix in the packaging slice.

## Slice 4: Emulator and plugin add/rm (branch `feat/nx-ionic-cordova-04-native-emulator-plugins`)

Tasks 4.1-4.6 complete. Slices 5-12 pending.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 4.1/4.2 | `lib/android-emulator.spec.ts` (ported) | Unit (injected adb runner) | N/A (new) | Suite failed: module `./android-emulator` missing | 12/12 | 12 cases (first/many/offline/physical/CRLF/lookalike serials, `ANDROID_HOME` > `ANDROID_SDK_ROOT` > PATH, empty unset, adb failure) | Prettier-formatted port |
| 4.4 | `executor.spec.ts` | Unit (mocked `spawnCli`, `listRunningEmulators`) | 44 prior tests passing | 4 failed (target last, several logged, android from `args`, none warns once) | 65/65 | 4 targeting cases + 3 no-query cases (device, ios, unset deploy) | None |
| 4.3 | `executor.spec.ts` (+ `build-argv.spec.ts` from slice 3) | Unit | same | Not observed RED: `build-argv` already implements `plugin` (slice 3); the 2 new executor cases (`;`/`&&`/`$()` stays one element, omitted `--plugin` invents nothing) passed on first run | Passed | 2 cases | None |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 7 suites, 65 tests passed (21 new) |
| Runtime harness | Fake adb via injected runner; no real adb or emulator spawned |
| Rollback boundary | Delete `lib/android-emulator*`; revert `executor.ts` and `executor.spec.ts` |

### Task 4.5 finding: `native-run` discovery

Checked empirically with `@ionic/cli@7.2.1` and `native-run` in a scratch project. `@ionic/cli` does not depend on `native-run`; it calls `which('native-run')` on `PATH` (`lib/native-run.js`) and otherwise tells the user to install it globally.
- PATH without `node_modules/.bin`: `native-run cannot be found within PATH`.
- PATH with `node_modules/.bin` first: found.

So a workspace-local `native-run` is NOT found when `nx` is launched without npm (no `.bin` on PATH). Not fixed here (out of slice scope). Recommended follow-up: have `spawnCli` pass `env` with `<root>/node_modules/.bin` prepended to `PATH` (an env entry, not the spawned command, so the "no `.bin` command path" rule holds), or document a global `native-run` requirement in the README (slice 12).

### Notes

- Emulator targeting is ported from the private source with `logger.warn`/`logger.info` and the native-run #409 comment; it runs inside the executor's `try`.

## Slice 5: `ionic-hook` executor (branch `feat/nx-ionic-cordova-05-ionic-hook`)

Tasks 5.1-5.4 complete (5.4 is the carried native-run follow-up). Slices 6-12 pending.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 5.4 | `src/shared/resolve-cli.spec.ts` | Unit (injected env, spawn) | 66 prior tests passing | 3 failed (prepend, `Path` casing, no PATH) | 69/69 | 4 cases (+ no mutation of the injected env) | None |
| 5.1/5.2 | `ionic-hook/executor.spec.ts`, `lib/map-ionic-hook-options.spec.ts` (trimmed port) | Unit (mocked `runExecutor`) | 69 prior tests passing | 2 suites failed: modules `./executor`, `./map-ionic-hook-options` missing | 82/82 | web, cordova, config fallback, live, conflict, PORT x2, failed result, missing project | `plugin-entry` already holds `IONIC_HOOK_EXECUTOR`; nothing to extract |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 9 suites, 82 tests passed (13 new) |
| Runtime harness | N/A: Nx `runExecutor` is mocked and spawn is injected; the bin that drives this executor is slice 6 |
| Rollback boundary | Commit 1: `resolve-cli.ts` env change. Commit 2: delete `src/executors/ionic-hook`; revert `executors.json` |

### Gate results

`npm run test:ci`, `npm run typecheck`, `npm exec -- nx run-many -t lint`: all exit 0.

### Notes

- The private specs were trimmed to the spec scenarios (duplicated triangulation cases dropped) and the long commentary was condensed to stay under budget.


## Slice 6: `bin` and `cli/lib` (branch `feat/nx-ionic-cordova-06-bin-cli`)

Tasks 6.1-6.5 complete. Slices 7-12 pending.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 6.1 | `cli/lib/*.spec.ts` (trimmed port) | Unit | 82 prior tests passing | Suites failed: modules missing | 88/88 | project forms, config forms, trailing flag, look-alikes | Helpers condensed |
| 6.2/6.3 | `cli/ionic-hook.spec.ts` | Unit (injected deps) | 88 passing | Failed: "Cannot find module './ionic-hook'" | 91/91 (1 message fix after first GREEN run) | no target, no root, exit 3 propagates, nx via resolver | None |
| 6.4 | `manifest.spec.ts` | Unit (reads `project.json`) | 91 passing | 1 failed (no chmod step) | 92/92 | n/a | None |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 13 suites, 92 tests passed (10 new) |
| Runtime harness | Built bin: no args exits 1 with usage; from `/tmp` exits 1 naming the missing root; `nx-ionic-cordova:nonexistent` runs the real nx and exits 1; file is `-rwxr-xr-x` with `#!/usr/bin/env node` |
| Rollback boundary | Delete `src/cli`; restore `project.json` `build` target; drop `manifest.spec.ts` block |

### Notes

- `build` is now `nx:run-commands` (chmod 755 of the bin) depending on `compile` (the former `@nx/js:tsc` build). Node-based chmod keeps it shell-neutral.
- The bin does not read `__dirname`, `node_modules/.bin/nx`, or `swc`; nx runs via `spawnCli('nx','nx')`.

## Slice 7: Shared target builders (branch `feat/nx-ionic-cordova-07-shared-builders`)

Tasks 7.1-7.5 complete. Slices 8-12 pending.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 7.1 | `build-live-reload-configurations.spec.ts` (trimmed port) | Unit | 92 passing | 4 suites failed: modules missing | 128/128 | app root, base arrays kept, non-array base | None |
| 7.2 | `build-native-target.spec.ts` | Unit (through `buildArgv`) | 92 passing | same run | 128/128 | 16 ionic + 4 cordova-res command lines, `android@15`, no per-env/`--buildConfig`, deploy | None |
| 7.3 | `build-ionic-hook-{targets,scripts}.spec.ts` | Unit | 92 passing | same run | 128/128 | executor ids, `nx-ionic-hook shop:...`, no swc or relative path | None |
| 7.4 | builders | - | - | - | all green | - | Doc comments condensed; ids from `plugin-entry` |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 17 suites, 128 tests passed (36 new) |
| Runtime harness | N/A: pure builders with no I/O; native configs are checked through the real `buildArgv` |
| Rollback boundary | Delete `src/generators/shared/build-*` |

### Notes

- Native configs: `ios-build-test/ante` merged into `ios-build-debug`; `--buildConfig` dropped. `WORKSPACE_NPM_SCOPE` helper not ported (`@bde`).
- Gates: `test:ci`, `typecheck`, `nx run-many -t lint` all exit 0.

## Slice 8: `init` and `versions.ts` (branch `feat/nx-ionic-cordova-08-init`)

Tasks 8.1-8.6 complete. Slices 9-12 pending.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 8.1 | `utils/versions.spec.ts`, `shared/plugin-entry.spec.ts` | Unit | 128 passing | `./versions` missing, `isPluginEntry` not exported | 141/141 | majors, no package in both groups, both entry shapes, look-alike | None |
| 8.2-8.4 | `generators/init/generator.spec.ts` | Unit (`createTreeWithEmptyWorkspace`) | 128 passing | Failed: "Cannot find module './generator'" | 141/141 | string and object entries, re-run unchanged, missing nx.json, deps split, newer kept, skipFormat, install callback | None |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 19 suites, 141 tests passed (13 new) |
| Runtime harness | Scratch workspace with the built plugin in `nx.json`: `nx show projects` exits 0, no warnings, isolated and not |
| Rollback boundary | Delete `src/generators/init`, `src/utils`; revert `generators.json` and the `isPluginEntry` addition |

### Findings

- 8.1 (registry, 2026-10): `@angular/*` 22.2.3, `@ionic/angular` 9.0.8, `@ionic/angular-toolkit` 13.0.0, `ionicons` 8.1.0, `cordova` 13.0.0, `cordova-android` 15.1.0, `@ionic/cordova-builders` 13.0.0, `@ionic/cli` 7.2.1, `cordova-res` 0.15.4, `native-run` 2.0.3, `@angular-builders/jest` 22.0.1 (peers `build-angular ^22`, `jest ^30`), `@angular-eslint/builder` 22.6.0 (peer `eslint ^9 || ^10`). `typescript` latest is 7.0.2, so `~6.0.0` is deliberate (starter agrees).
- 8.1 gaps: `zone.js` omitted (starter has none); `cordova-android`/`ios` are per-app platforms, not root packages; `eslint` is left to the workspace.
- 8.5: Nx 23.2 `loaded-nx-plugin.js` wraps `createNodes` only `if (createNodesImpl)`. Runtime-confirmed: registering the built plugin without `createNodes` gives a clean `nx show projects`, exit 0, no warnings.

### Notes

- Gates: `test:ci`, `typecheck`, `nx run-many -t lint` all exit 0. About 300 insertions and 2 deletions plus bookkeeping.
- `isPluginEntry` was added to `plugin-entry.ts` (slice 1 had only the constants).

## Slice 9: `app` options, depth and `project.json` (branch `feat/nx-ionic-cordova-09-app-options`)

Tasks 9.1-9.5 complete. `generator.ts` and its registration moved to slice 10 (task 10.0) per 9.5, to stay under 400 lines.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 9.1/9.2 | `app/lib/normalize-app-options.spec.ts` | Unit (`createTreeWithEmptyWorkspace`) | 141 passing | "Cannot find module './normalize-app-options'" | 169/169 | defaults, explicit values, depths `.`/`apps`/`apps/mobile`, 5 invalid ids, missing, existing | None |
| 9.3 | `app/lib/build-app-project-json.spec.ts` | Unit | 141 passing | same run, module missing | 169/169 | 8 executors, live configs, no `@bde`, depth 1/2/3 `$schema`, tags | Native-config assertion fixed (regex matched `-prod`) |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 21 suites, 169 tests passed (28 new) |
| Runtime harness | N/A: pure functions plus a read-only tree lookup; the generator wiring is slice 10 |
| Rollback boundary | Delete `src/generators/app` |

### Notes

- Private `widgetId` is public `appId` (required, reverse-DNS). Nothing hardcodes `../../`; `$schema` uses `offsetFromRoot`. Target paths stay workspace-root relative.
- Deviations from the private `project.json`: no `polyfills` (starter has none, no zone.js); `test.tsConfig` is `<appRoot>/tsconfig.spec.json` (builder resolves from the workspace root; unverified at runtime until slice 10/11).

## Slice 10: Wiring templates (branch `feat/nx-ionic-cordova-10-wiring-templates`)

Tasks 10.0-10.5 complete. Slices 11-12 pending.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 10.0/10.4 | `app/generator.spec.ts` | Unit (`createTreeWithEmptyWorkspace`) | 169 passing | "Cannot find module './generator'" | 16/16 (1 fix: `addProjectConfiguration` needs `root`) | project, identity, ionic.config, depths `.`/`apps`/`apps/mobile`, invalid id, existing name | None |
| 10.1-10.3 | same | same | same | same run | 16/16 | single config.xml, package.json keys, offsets, `skipFormat`, second app leaves first intact | None |
| 10.0 registration | `manifest.spec.ts` | Unit (reads `generators.json`) | 5 passing | 1 failed (`app` missing) | 6/6 | `init` and `app` | None |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `npm exec -- nx run nx-ionic-cordova:test` - 44 app/manifest tests passed; `test:ci`, `typecheck`, `nx run-many -t lint` exit 0 |
| Runtime harness | N/A: Tree-based generator specs; a real `nx g` run waits for the slice 11 sources |
| Rollback boundary | Delete `app/generator*`, `app/files`; revert the `generators.json` `app` entry and the `manifest.spec.ts` block |

### Notes

- About 307 insertions before bookkeeping. `tsconfig` extends `<offset>tsconfig.base.json`; `setup-jest.ts` imports `jest-preset-angular/setup-jest`.
- Templates only; the `files` build `assets` entry stays in task 11.4. Generated `tsconfig.angular.json` references `src/main.ts`, added in slice 11.
- Deviations from private: no aliases, `polyfills`, localization or per-env config files; `ionic.config.json` keeps `capacitor.enabled=false`.

## Slice 11: Starter source templates and assets copy (branch `feat/nx-ionic-cordova-11-starter-templates`)

Tasks 11.1-11.5 complete. Slice 12 pending. Commit 1 of the slice is the carried `f4e06fa0` (`jest-preset-angular` in the init devDependencies).

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 11.1/11.2 | `app/starter-files.spec.ts` | Unit (`createTreeWithEmptyWorkspace`) | app specs passing | 5 failed (templates absent) | 5/5 | exact file set, no `test-setup.ts`, main and routes content, Jest-only specs, favicon bytes, no `@bde`/translate/alias | None |
| 11.3 | same | same | same | same run | 5/5 | n/a | None |
| 11.4 | `manifest.spec.ts` | Unit (reads `project.json`) | 6 passing | 1 failed (no `assets`) | 7/7 | n/a: one config entry | None |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and result | `nx run nx-ionic-cordova:test -- starter-files` 5/5; `-- manifest` 7/7 |
| Runtime harness | `nx run nx-ionic-cordova:build`: `out-tsc/lib/src/generators/app/files` holds 26 files, `cmp` shows the favicon byte-identical, no compiled `.ts` |
| Rollback boundary | Revert the two slice commits (`files/src/**`, `starter-files.spec.ts`; `project.json` `assets`, `manifest.spec.ts` block) |

### Notes

- Sources are fetched verbatim from `ionic-team/starters@main`; the starter specs needed no Jest adaptation (`describe/it/expect` globals, `TestBed` under `jest-preset-angular`). Only `environment.ts` changed in place (starter comments restored). The pre-commit Prettier hook reformatted the html/scss templates (whitespace only).
- All `.ts` templates use the `__tmpl__` suffix, so tsc, jest and lint ignore them. Assets live on the `compile` target (`@nx/js:tsc` `assets`).
- A first build failed because two `.ts` templates lacked the suffix (shell typo); tsc caught it and it was fixed before commit. The generated specs are not executed under Jest here; running them in a generated app is a verify-phase item.
- Gates: `test:ci`, `typecheck`, `nx run-many -t lint`, `nx run nx-ionic-cordova:build` all exit 0.

## Slice 12: README and pack check (branch `feat/nx-ionic-cordova-12-readme-pack`)

Tasks 12.1-12.5 complete. All 12 slices done.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 12.1/12.2 | `packaging.spec.ts` | Unit (reads manifests, `files`, sources, workflows) | manifest specs passing | 1 failed (4 schemas not in `files`) | 6/6 | manifest paths, schemas, compiled entries, no sources, no `@bde`/`.bin` spawn, no `npm publish` | Coupling regex narrowed to code lines and `spawn*(...bin)`: comments and the PATH prepend matched first |
| 12.3 | README | N/A (documentation) | - | - | - | iOS lines checked against `build-native-target.ts` | None |

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Pack check | `nx run nx-ionic-cordova:build` then `npm pack --dry-run`: 101 files; compiled JS, executable `ionic-hook.js` (0755), both manifests, 4 `schema.json`, app templates incl. `favicon.png`, README, package.json; no plugin specs (only the generated-app `*.spec.ts__tmpl__` templates) |
| Rollback boundary | Revert the two slice commits (`files` entries, `packaging.spec.ts`; README) |

### Notes

- Closes the carried gap: `schema` paths pointed at `src/` while only `out-tsc/lib` shipped; each `schema.json` is now listed in `files`, as nx-sonar does.
- Publishing stays manual; no publish automation added. Verify-phase items: run the generated app specs in a generated app; a real `nx g` run.
