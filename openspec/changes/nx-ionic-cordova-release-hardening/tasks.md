# Tasks: nx-ionic-cordova release hardening

Spec tags: APP = ionic-cordova-app-generator, PKG = ionic-cordova-plugin-packaging, INIT = ionic-cordova-init-generator.
All paths are relative to `tools/nx-ionic-cordova` unless stated. Strict TDD: each behaviour task is RED test first, then GREEN.
Focused test command base: `npm exec nx run nx-ionic-cordova:test -- --testPathPattern=<pattern>`.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~320 (fixes + unit tests ~170, smoke script + target ~150) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR. Optional fallback: PR 1 = Phases 1-2 (~170), PR 2 = Phases 3-4 (~150) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain (only if the fallback split is taken) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain (unused unless a measured diff exceeds 400 lines)
400-line budget risk: Low

If the measured diff exceeds 400 lines during apply, stop and split at the Phase 2 / Phase 3 boundary before opening the PR; do not take a size exception silently.

### Suggested Work Units

| Unit | Goal | Est. lines | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Name/directory validation, `esModuleInterop`, release wiring and `e2e` target checks | ~170 | `... --testPathPattern=generators/app\|packaging` | Nx `Tree` in memory | Revert the unit-level commits |
| 2 | Docs: README, `versions.ts` comment | ~25 | `... --testPathPattern=packaging` | Readback | Revert README and comment |
| 3 | Smoke script and `e2e` target | ~160 | `... --testPathPattern=packaging` | `nx run nx-ionic-cordova:e2e` (manual) | Remove `e2e/` and the target |

## Phase 1: Unit-level fixes and tests

- [ ] 1.1 RED (APP "Options and validation"): in `src/generators/app/lib/normalize-app-options.spec.ts` add `it.each` cases: `apps/demo`, `apps\demo`, `a:demo`, `my app`, `1demo`, `-demo` throw `/--directory/`; directories `../outside`, `a/../../x`, `/abs`, `C:\x` throw `/directory/`; `demo-app` with `apps/mobile` yields root `apps/mobile/demo-app`; `.` directory still valid. Run and confirm the reject cases fail.
- [ ] 1.2 GREEN (APP): in `src/generators/app/lib/normalize-app-options.ts` add `PROJECT_NAME = /^[A-Za-z][^\s/\\:]*$/` checked after `appId` and before the existing-project check, and `assertInsideWorkspace` (reject absolute `/`, `\`, `X:` prefix, or any `..` segment after splitting on `/` and `\`). Use the exact error messages from design "Interfaces / Contracts". Update the function docs.
- [ ] 1.3 RED (APP): in `src/generators/app/generator.spec.ts` assert that `apps/demo` and `../outside` throw and `tree.listChanges()` is empty (no writes); assert generated `tsconfig.spec.json` has `compilerOptions.esModuleInterop === true`. Confirm the `esModuleInterop` assertion fails before the template change.
- [ ] 1.4 GREEN (APP): add `"esModuleInterop": true` to `src/generators/app/files/tsconfig.spec.json__tmpl__`. Update `name` and `directory` descriptions in `src/generators/app/schema.json` (description only, no `pattern`).
- [ ] 1.5 Characterization (INIT "Root dependency placement"): confirm `src/generators/init/generator.spec.ts` already asserts runtime set in `dependencies` and tooling in `devDependencies`, with existing versions kept and none duplicated. If an assertion is missing, add it RED-first and fix `init` only if it fails. No change expected.
- [ ] 1.6 Characterization (PKG "Workspace and release wiring"): in `src/packaging.spec.ts` add top-level `describe('release wiring')` reading root files via `WORKSPACE_ROOT`: every `release-please-config.json` package key exists in `.release-please-manifest.json`; `tools/nx-ionic-cordova` has `component: nx-ionic-cordova` and a manifest version equal to `package.json#version`. Temporary-break RED check: rename a manifest key (or change the version), confirm the test fails, restore it, confirm green.
- [ ] 1.7 RED then GREEN (PKG "Local tarball smoke target"): in `src/packaging.spec.ts` add: `project.json` `targets.e2e.cache === false` and `dependsOn` contains `build` (RED before 3.2); no workflow under `.github/workflows` matches `/nx-ionic-cordova:e2e|(-t|--targets?)[ =][^\n]*\be2e\b/`; `isPublished('e2e/smoke.mjs') === false`. The `e2e` target assertion stays RED until task 3.2; commit it together with 3.2 or mark it pending so the phase commit stays green.
- [ ] 1.8 Gate: run `npm run test:ci`, typecheck and lint for the project. Fix only the new code.

## Phase 2: Documentation

- [ ] 2.1 PKG "README dependency and TypeScript documentation": in `README.md` Requirements add `typescript ~6.0` and the reason (`@angular/build`, `@angular-devkit/build-angular`, `@ionic/angular-toolkit`, `typescript-eslint` peer on `<6.1`); in Install state runtime packages go to `dependencies`, tooling to `devDependencies`, existing versions kept; in the app option table mark `name` as "not a path" and `directory` as "inside the workspace"; in Publishing add "run `nx run nx-ionic-cordova:e2e` before a release (needs registry, ~5-8 minutes)".
- [ ] 2.2 In `src/utils/versions.ts` add the comment that TypeScript stays `~6.0` because the Angular 22 toolchain peers `<6.1`. No range change.
- [ ] 2.3 Readback: README and comment match the delta specs; run `npm run test:ci` once more (packaging tests must stay green).

## Phase 3: Smoke script and e2e target

- [ ] 3.1 Create `e2e/smoke.mjs` (plain Node ESM, no dependencies, outside `src/**`). Implement `run(step, entry, argv, cwd)` using `spawnSync(process.execPath, [entry, ...argv], { shell: false, stdio: 'pipe', maxBuffer: 256 MiB })`, echoing output and throwing `Smoke step "<step>" failed (exit N)` on non-zero. Resolve npm via `npm_execpath`, else `npm-cli.js` beside `process.execPath` (Windows `node_modules/npm/bin`, POSIX `../lib/node_modules/npm/bin`), else throw naming each path tried; resolve nx via `createRequire(<ws>/package.json).resolve('nx/package.json')` then `bin.nx`. Child env `{ ...process.env, NX_DAEMON: 'false', NX_NO_CLOUD: 'true', NX_TUI: 'false', CI: 'true', FORCE_COLOR: '0' }`. Use `mkdtempSync(join(tmpdir(), 'nx-ionic-cordova-e2e-'))`, remove in `finally` unless `NX_IONIC_CORDOVA_E2E_KEEP=1` (then print the path); set `process.exitCode = 1` on any throw.
- [ ] 3.2 Smoke steps in order: `npm pack -w tools/nx-ionic-cordova --pack-destination <tmp> --json`; `npm exec --yes create-nx-workspace@23 -- ws --preset=apps --nxCloud=skip --packageManager=npm --interactive=false --skipGit`; `npm i -D <tgz>`; `nx g @iamandersonp/nx-ionic-cordova:init`; `nx g ...:app apps/bad --appId=com.example.bad` must exit non-zero with `--directory` in output and no `apps/apps`; `nx g ...:app demo --appId=com.example.demo` then `npm install`; `nx run demo:build`, `demo:test` (assert output has no `TS151001`), `demo:lint`. Adjust only argv if the `create-nx-workspace@23` flags differ (design open question).
- [ ] 3.3 Add the `e2e` target to `project.json`: `nx:run-commands`, `command: "node tools/nx-ionic-cordova/e2e/smoke.mjs"`, `dependsOn: ["build"]`, `cache: false`. Task 1.7's target assertion now passes; run `npm run test:ci`.
- [ ] 3.4 Pack check: run `npm pack --dry-run -w tools/nx-ionic-cordova` after build and confirm no `e2e/` entry in the file list.

## Phase 4: Smoke evidence

- [ ] 4.1 RED evidence (PKG "TS151001 regression"): with the smoke script in place, temporarily revert only the `esModuleInterop` template line (task 1.4), run `nx run nx-ionic-cordova:e2e`, and record that it fails on `TS151001` in `demo:test`. Restore the line.
- [ ] 4.2 GREEN evidence (PKG "Happy path"): run `nx run nx-ionic-cordova:e2e` locally with registry access; record exit 0, the three `demo:*` results, the rejected path-like name, and elapsed time. Store the evidence in the PR description (not in a report file). If any step fails for a reason outside this change (upstream drift or network), note it and keep `e2e` out of CI.
- [ ] 4.3 Final gate: `npm run test:ci`, build, typecheck and lint pass; the working tree has no leftover temp directories.
