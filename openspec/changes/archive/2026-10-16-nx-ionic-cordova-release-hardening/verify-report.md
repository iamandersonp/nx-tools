# Verify report: nx-ionic-cordova-release-hardening

HEAD: 67158587aea338c8e5d99563e0b7220b26ee4dc8 (branch fix/nx-ionic-cordova-release-hardening). Mode: Strict TDD.

## Verdict: PASS WITH WARNINGS (0 CRITICAL, 2 WARNING, 2 SUGGESTION)

## Gates (all exit 0)
- npm run test:ci: 0 (nx-ionic-cordova: 24 suites, 231 tests pass; nx-sonar pass)
- npm run typecheck: 0
- nx run-many -t lint: 0
- nx run nx-ionic-cordova:build: 0
- npm pack --dry-run -w tools/nx-ionic-cordova: no e2e/ entry

## Smoke (TMPDIR=/mnt/Almacenamiento/.tmp-e2e)
- nx run nx-ionic-cordova:e2e: exit 0, 88s wall (script reports 84s)
- TS151001: absent from output
- Path-like name rejected: `Option "name" must be a project name, not a path; received "apps/bad"` with --directory hint
- demo:build, demo:test, demo:lint passed. Temp dir removed; git tree clean.

## Scenario compliance: 24/24
App generator 12 (all validation scenarios in normalize-app-options.spec.ts and generator.spec.ts; esModuleInterop in generator.spec.ts; No TS151001 by smoke). Init 4 (existing init/generator.spec.ts characterization). Packaging 8 (packaging.spec.ts, README readback, smoke, pack dry-run).
RENAMED init requirement: delta consistent (FROM matches `### Requirement: Root devDependencies` at openspec/specs/ionic-cordova-init-generator/spec.md:24; archive must apply the rename).
Smoke excluded from CI and tarball: confirmed.

## Findings
WARNING
1. tools/nx-ionic-cordova/README.md (Publishing, last paragraph): says "about 5-8 minutes"; measured 71-88s. Update the estimate.
2. README e2e note should document the small-/tmp EDQUOT: yes, recommend adding "If /tmp is a small tmpfs, set TMPDIR to a larger disk" (EDQUOT observed in apply and previously here).
SUGGESTION
1. .github/workflows/ci.yml:25 contains `--stop-agents-after="e2e"` (Nx Cloud agent target name, does not invoke the target). The packaging.spec.ts regex correctly ignores it; consider a comment noting this.
2. Task 1.7/design: dependency placement for init is only characterized, not newly tested (acceptable per task 1.5).
