# Design: nx-ionic-cordova release hardening

## Technical Approach

Close the archived change's verify follow-ups with small, test-first edits inside `tools/nx-ionic-cordova`. Name and directory guards go in `normalizeAppOptions`, which already runs before any write. One template line removes `TS151001`. `packaging.spec.ts` gains release-wiring and `e2e`-target checks. A plain Node ESM smoke script under `e2e/` proves the tarball end to end. It runs as a local, uncached `e2e` target. It stays out of `src/**`, so `test`, `typecheck`, `lint`, `npm pack` and `ci.yml` never see it. README and `versions.ts` get documentation only. Specs: the three deltas in this change folder.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Name rule | `/^[A-Za-z][^\s/\\:]*$/` in `normalizeAppOptions`, checked after `appId` and before the existing-project check | Nx `^[a-zA-Z][^:]*$` (allows `/`); a stricter npm-name regex | Matches exploration option A exactly, with no extra semantic change |
| Directory rule | Reject an absolute value (`/`, `\` or `X:` prefix) or any `..` segment after splitting on `/` and `\`. `.` stays valid (it is already tested) | `path.resolve` against `tree.root` | Pure string logic, the same on every OS and in the in-memory tree |
| Schema | Description-only changes. No `pattern` | A JSON `pattern` | Nx would reject the value first with a generic "does not match pattern" message and hide the `--directory` hint |
| `TS151001` | Add `"esModuleInterop": true` to `files/tsconfig.spec.json__tmpl__` | `allowSyntheticDefaultImports`; `module: CommonJS` | Smallest flag ts-jest's raw-option check accepts. Keeps `Preserve` and `Bundler` |
| Smoke format | `e2e/smoke.mjs`: plain Node ESM, no dependencies, `spawnSync(process.execPath, [entry, ...argv], { shell: false })` | TypeScript script; a separate `*-e2e` project; a bash script | Needs no build or transpiler. Uses the same Windows-safe pattern as `resolve-cli.ts`. A `tools/*` project would add workspace churn |
| npm and nx entries | npm: `process.env.npm_execpath`, else `npm-cli.js` beside `process.execPath` (`node_modules/npm/bin` on Windows, `../lib/node_modules/npm/bin` on POSIX), else throw. nx: `createRequire(<ws>/package.json).resolve('nx/package.json')`, then its `bin.nx` | Spawning `npm`, `npx` or `.bin/nx` | `.cmd` shims need a shell on Windows |
| Temp and cleanup | `mkdtempSync(join(tmpdir(), 'nx-ionic-cordova-e2e-'))`, removed in `finally` with `rmSync({ recursive, force })`. `NX_IONIC_CORDOVA_E2E_KEEP=1` keeps it and prints the path | A fixed directory | Nothing is left behind, and a failure can still be inspected |
| Child env | `{ ...process.env, NX_DAEMON: 'false', NX_NO_CLOUD: 'true', NX_TUI: 'false', CI: 'true', FORCE_COLOR: '0' }` | Inherit everything unchanged | No prompts, daemon or ANSI codes in the captured output |
| Target | `nx:run-commands`, `command: "node tools/nx-ionic-cordova/e2e/smoke.mjs"`, `dependsOn: ["build"]`, `cache: false` | Calling `build` inside the script | Nx owns ordering, and the script only packs |
| Lint and typecheck | The script is not linted or typechecked. Prettier still formats it through the pre-commit hook | Extending the `eslint.config.mjs` glob | The lint rules use the TS parser, and `lint.args` is fixed to `src/**/*.ts`. This is the same treatment as `jest.config.js` |
| Release test placement | A new top-level `describe('release wiring')` in `packaging.spec.ts`, reading the root files through `WORKSPACE_ROOT` | A new spec file | Keeps all packaging contracts in one place |

## Data Flow

    nx run nx-ionic-cordova:e2e ─→ build (dependsOn)
      └─→ smoke.mjs  [tmp = mkdtemp]
           npm pack -w tools/nx-ionic-cordova --pack-destination tmp --json ─→ <tgz>
           npm exec --yes create-nx-workspace@23 -- ws --preset=apps --nxCloud=skip
                --packageManager=npm --interactive=false --skipGit      (cwd tmp)
           npm i -D <tgz> ─→ nx g @iamandersonp/nx-ionic-cordova:init
           nx g …:app apps/bad --appId=com.example.bad   EXPECT exit≠0, output has --directory, no apps/apps
           nx g …:app demo --appId=com.example.demo ─→ npm install
           nx run demo:build | demo:test (captured, assert !/TS151001/) | demo:lint
      finally rmSync(tmp)

Each step goes through `run(step, entry, argv, cwd)`. The output is captured with `stdio: 'pipe'` and `maxBuffer: 256 MiB`, then echoed. A non-zero status throws `Smoke step "<step>" failed (exit N)`. The script ends with `process.exitCode = 1` on any throw.

## File Changes

| File | Action | Description | ~Lines |
|---|---|---|---|
| `tools/nx-ionic-cordova/src/generators/app/lib/normalize-app-options.ts` | Modify | `PROJECT_NAME` regex, `assertInsideWorkspace`, and the docs | 30 |
| `…/app/lib/normalize-app-options.spec.ts` | Modify | `it.each` rejects plus valid `demo-app`/`apps/mobile` | 35 |
| `…/app/generator.spec.ts` | Modify | Writes nothing for `apps/demo` and `../outside`; checks `esModuleInterop` | 20 |
| `…/app/files/tsconfig.spec.json__tmpl__` | Modify | `"esModuleInterop": true` | 1 |
| `…/app/schema.json` | Modify | `name` and `directory` descriptions | 4 |
| `tools/nx-ionic-cordova/src/packaging.spec.ts` | Modify | `release wiring`, `e2e` target shape, not in `ci.yml`, `e2e/` not published | 50 |
| `tools/nx-ionic-cordova/e2e/smoke.mjs` | Create | The smoke script | 150 |
| `tools/nx-ionic-cordova/project.json` | Modify | `e2e` target | 8 |
| `tools/nx-ionic-cordova/src/utils/versions.ts` | Modify | The TypeScript `~6.0` comment | 4 |
| `tools/nx-ionic-cordova/README.md` | Modify | Requirements, Install, app option table, Publishing | 20 |

Total: about 320 changed lines, under the 400-line budget.

## Interfaces / Contracts

The new error messages:

- `Option "name" must be a project name, not a path; received "<v>". It must start with a letter and contain no "/", "\", ":" or whitespace. Put the location in --directory, e.g. --directory=apps/mobile.`
- `Option "directory" must be a relative path inside the workspace; received "<v>".`

The README changes:

- **Requirements:** add `typescript ~6.0`, because `@angular/build`, `@angular-devkit/build-angular`, `@ionic/angular-toolkit` and `typescript-eslint` peer on `<6.1`.
- **Install:** state that runtime packages go to `dependencies`, tooling to `devDependencies`, and existing versions are kept.
- **Option table:** `name` is "not a path", and `directory` is "inside the workspace".
- **Publishing:** run `nx run nx-ionic-cordova:e2e` before a release. It needs the registry and takes about 5–8 minutes.

## Testing Strategy

| Layer | What | Approach (strict TDD) |
|---|---|---|
| Unit | The name and directory rules | Spec `it.each` cases: `apps/demo`, `apps\demo`, `a:demo`, `my app`, `1demo`, `-demo` throw `/--directory/`. `../outside`, `a/../../x`, `/abs` and `C:\x` throw `/directory/`. `demo-app` with `apps/mobile` gives the root `apps/mobile/demo-app`. RED before the guard |
| Unit | Generator, no writes | `tree.listChanges()` is empty after the rejection. RED with the template assertion `esModuleInterop === true` |
| Unit | Packaging | Every config package key exists in the manifest, and `tools/nx-ionic-cordova` has `component: nx-ionic-cordova` and manifest equals `package.json#version`. This is a characterization test: prove RED by temporarily breaking a key, then restore it. `targets.e2e.cache === false` and `dependsOn` contains `build` (RED before `project.json`). No workflow matches `/nx-ionic-cordova:e2e\|(-t\|--targets?)[ =][^\n]*\be2e\b/`, which leaves `--stop-agents-after="e2e"` alone. `isPublished('e2e/smoke.mjs') === false` |
| E2E | Tarball smoke | `nx run nx-ionic-cordova:e2e`. Its RED is a run before the template fix that fails on `TS151001`; it goes green after. Run manually, never in CI |
| Pack | Not shipped | `npm pack --dry-run -w tools/nx-ionic-cordova` lists no `e2e/` entry (verify phase) |

## Threat Matrix

| Boundary | Applicability | Design response | Planned RED tests |
|---|---|---|---|
| Subprocess argv composition | Applicable (smoke script) | Argv arrays, `shell: false`, `execPath` plus a JS entry. The tarball path and app names are separate elements | Covered by the e2e run. No unit harness for `.mjs` (accepted) |
| Binary resolution | Applicable | `npm_execpath`, then the `npm-cli.js` candidates, then a throw naming each path tried. nx comes from the workspace's `nx/package.json` `bin` | e2e run. A missing npm gives a clear throw |
| Filesystem scope | Applicable | Writes only inside `mkdtemp`, removed in `finally`. The generator rejects `..` and absolute directories | Unit: the directory rejects above |
| Documentation-like paths | N/A | Nothing is classified or executed by name | none |
| Git selection / commit / push / PR | N/A | `--skipGit`. No VCS automation | none |

## Migration / Rollout

No migration required. One PR of about 320 lines, or two slices if review prefers: (1) fixes and unit tests, about 170 lines; (2) the smoke script and target, about 160 lines.

## Open Questions

- [ ] The exact `create-nx-workspace@23` non-interactive flags (`--interactive=false`, `--skipGit`, `--packageManager`). Validate on the first smoke run and adjust only the argv.
- [ ] Whether `demo:lint` needs the root ESLint packages that `init` already adds. The first run confirms it.
