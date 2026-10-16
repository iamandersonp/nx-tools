# Apply progress: nx-ionic-cordova release hardening

Status: 18/18 tasks complete (phases 1-4). Mode: Strict TDD.

## Evidence per task

| Task | RED | GREEN |
|------|-----|-------|
| 1.1/1.2 name and directory guards | 11 new `normalize-app-options` cases failed (6 names, 5 directories) | All 221 tests pass after `PROJECT_NAME` and `assertInsideWorkspace` |
| 1.3/1.4 template and schema | 3 `esModuleInterop` assertions failed (one per directory depth) | 226 pass after the template line. Schema is description-only |
| 1.3 no-write guard test | The first version compared `listChanges()` to `[]`, which fails because the fixture workspace already has changes. The test was wrong, not production code. It now compares the changed paths before and after the rejection | Passes |
| 1.5 init characterization | Not needed: `init/generator.spec.ts` already asserts dependencies vs devDependencies, kept versions, and no duplicates | No change |
| 1.6 release wiring | Temporary break: renamed the manifest key `tools/nx-ionic-cordova`. Both release-wiring tests failed. Restored | Passes |
| 1.7/3.3 e2e target | `targets.e2e` assertion failed before the `project.json` target existed (1 failed, 230 passed) | 231 pass after task 3.3 |
| 2.x docs | Readback only | Prettier check clean |
| 4.1 smoke RED | Template line reverted, `nx run nx-ionic-cordova:e2e` failed with `Smoke step "demo:test" reported TS151001` (exit 1, 1m23s) | Line restored |
| 4.2 smoke GREEN | n/a | Exit 0, `[smoke] passed in 64s` (about 71s wall time) |

## Smoke run (GREEN)

- Command: `TMPDIR=<disk path> npm exec -- nx run nx-ionic-cordova:e2e`, exit 0, 64s in the script.
- `demo:build`, `demo:test` (2 suites, 2 tests) and `demo:lint` all passed. No `TS151001` in output.
- `app apps/bad` was rejected with `Option "name" must be a project name, not a path; received "apps/bad" ...` and the `--directory=apps/mobile` hint. No `apps/apps` written.
- `create-nx-workspace@23` argv worked unchanged (`--preset=apps --nxCloud=skip --packageManager=npm --interactive=false --skipGit`).
- Environment note: `/tmp` is a 7.8G tmpfs with about 1.7G free here, and the install failed with `EDQUOT` (-122). Set `TMPDIR` to a larger disk. The script uses `os.tmpdir()`.
- No temporary directories are left behind.

## Gates

`npm run test:ci`, `npm run typecheck`, `npm exec -- nx run-many -t lint` and `nx run nx-ionic-cordova:build` all exit 0. `npm pack --dry-run -w tools/nx-ionic-cordova` lists no `e2e/` entry.

## Deviations

None from the design. Task 1.7 target assertion went green with task 3.3, as planned.
