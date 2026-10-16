```yaml
schema: gentle-ai.verify-result/v1
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
warnings: 3
requirements: 24/24
scenarios: 61/61
head: 0c1bb6b2c6e4bc46b753d1ad8822fd9eda5f1b4b
test_command: npm run test:ci
test_exit_code: 0
build_command: npm exec -- nx run nx-ionic-cordova:build
build_exit_code: 0
```

# Verification Report (re-verify after slice 13)

**Change**: nx-ionic-cordova-plugin
**Mode**: Strict TDD
**Branch / HEAD**: `feat/nx-ionic-cordova-13-fix-generated-app` @ `0c1bb6b2`
**Verdict**: PASS WITH WARNINGS

## Gates (repo root)
| Gate | Exit |
|---|---|
| `npm run test:ci` | 0 (24 suites, 209 tests passed in nx-ionic-cordova; was 199) |
| `npm run typecheck` | 0 |
| `npm exec -- nx run-many -t lint` | 0 |
| `npm exec -- nx run nx-ionic-cordova:build` | 0 |
| `npm pack --dry-run -w tools/nx-ionic-cordova` | 0, 101 files: bin `out-tsc/lib/src/cli/ionic-hook.js`, `executors.json`, `generators.json`, four `schema.json`, `out-tsc/lib/src/generators/app/files/**` (including `eslint.config.js`) |

## E2E smoke (fresh Nx 23.2.0 workspace, packed tarball, no workarounds)
| Step | Exit |
|---|---|
| `create-nx-workspace@23 e2e --preset=apps --nxCloud=skip --interactive=false` | 0 |
| `npm i -D <tarball>`; `nx g ...:init` (installs tooling) | 0 / 0 |
| `nx g ...:app demo --appId=com.example.demo` then `npm install` | 0 / 0 |
| `nx run demo:build --skip-nx-cache` | 0 (bundle in `apps/demo/www`) |
| `nx run demo:test --skip-nx-cache` | 0 (2 tests passed) |
| `nx run demo:lint --skip-nx-cache` | 0 |
| Depth 3, name as path: `app apps/a/b/deep` (build/test/lint) | 0 / 0 / 0 |
| Depth 3, `app deep2 --directory=apps/a/b/c` (build/test/lint) | 0 / 0 / 0 |
| Installed bin mode | `-rwxr-xr-x` |

Not run: `nx add` (needs a published package; the tarball install plus `init` was used instead).

## Prior criticals
| ID | Status |
|---|---|
| C1 build outputs | Fixed (8d93ef9b), runtime confirmed |
| C2 emitDeclarationOnly | Fixed (8d93ef9b), runtime confirmed |
| C3 @angular/build missing | Fixed (ef42972b), runtime confirmed |
| C4 jest env, zoneless, tsConfig, setup-jest | Fixed (ef42972b, 958ac800), runtime confirmed |
| W1 lint config | Fixed (7e4ae908); README line 63 consistent |
| W4, W5, S1 | Fixed (2132f790, ef42972b) |

## Spec compliance
All 61 scenarios across the 5 specs (native executor 14, hook 16, init 7, app generator 14, packaging 10) remain covered by passing unit tests, and the two previously PARTIAL requirements (Root devDependencies, Starter-equivalent sources) are now confirmed at runtime by the smoke above. Compliance: 61/61, 24/24 requirements. Private repo `/mnt/Almacenamiento/asbmain` untouched; the working tree here holds only this untracked report.

## Issues
**CRITICAL**: none.

**WARNING**
- W1. Task 13.9 (e2e smoke script/test) is still open (`tasks.md:153`); the unit suite alone cannot catch generated-app regressions (accepted follow-up). Also leaves the "Release entries" scenario without a covering test.
- W2. `nx run demo:test` emits ts-jest `TS151001` (esModuleInterop) and ts-compiler warnings; exit is 0. Consider setting `esModuleInterop` in the generated `tsconfig.spec.json`.
- W3. "Windows and pnpm" scenario is covered by unit tests with injected dependencies only; no real win32/pnpm run.

**SUGGESTION**
- S1. Passing a path as `name` (`app apps/a/b/deep`) yields a project named `apps/a/b/deep`; consider rejecting or documenting.
- S2. Re-check `typescript ~6.0` and `@angular-builders/jest ^22` ranges when upstream majors move.
- S3. `init` installs runtime packages at root `dependencies`; document it.

## Verdict
PASS WITH WARNINGS. No blockers; ready for sdd-archive (13.9 stays as a tracked follow-up).
