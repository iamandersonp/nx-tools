# Archive Report: nx-ionic-cordova-release-hardening

**Archived**: 2026-10-16
**Branch**: fix/nx-ionic-cordova-release-hardening
**HEAD at archive**: cd2d805c
**Artifact store**: hybrid (openspec files plus Engram topic `sdd/nx-ionic-cordova-release-hardening/archive-report`)
**Archive folder**: `openspec/changes/archive/2026-10-16-nx-ionic-cordova-release-hardening/`

## Final State at Close

Per the Final-State Authority hierarchy, the launch prompt's final-state facts outrank the verify-report snapshot.

- **Verification verdict**: PASS WITH WARNINGS, 0 CRITICAL. Source: `verify-report.md` (archived here), written at verification time. Its 2 WARNINGS are resolved at close:
  1. README e2e duration "5-8 minutes" was corrected to "a minute or two". Fixed in `cd2d805c`.
  2. README note on small-`/tmp` EDQUOT and `TMPDIR` was added. Fixed in `cd2d805c`.
- **Verify and apply attempts**: settled as passed (launch prompt, final-state fact).
- **Test counts**: the verify-report snapshot recorded `npm run test:ci` at 24 suites and 231 tests passing, at verification time. `cd2d805c` changed only `tools/nx-ionic-cordova/README.md` and `verify-report.md`, so no later test-count change is recorded. This is a snapshot figure, not a re-run at close.
- **Tasks**: `tasks.md` has 18 of 18 tasks checked (`- [x]`), 0 unchecked. The Task Completion Gate passed without reconciliation.
- **Native review**: RDD review mode is off. No `reviewGate` was present, so archive proceeded under ordinary repository policy.

## Specs Synced

| Main spec | Action | Details |
|-----------|--------|---------|
| `openspec/specs/ionic-cordova-init-generator/spec.md` | Renamed and modified | RENAMED `Root devDependencies` to `Root dependency placement`. MODIFIED replaced its body and scenarios with the delta block (runtime in `dependencies`, tooling in `devDependencies`, existing versions kept). |
| `openspec/specs/ionic-cordova-app-generator/spec.md` | Modified and added | MODIFIED replaced `Options and validation` (path-like and whitespace names, directory escape). `Generated spec tsconfig` was a MODIFIED entry with no matching main requirement, so it was appended as a new requirement. Flagged below. |
| `openspec/specs/ionic-cordova-plugin-packaging/spec.md` | Modified and added | MODIFIED replaced `Workspace and release wiring` (adds the release-entries unit test). ADDED `Local tarball smoke target` and `README dependency and TypeScript documentation`. |

Requirements not named in any delta were left untouched.

## Flags and Deviations

- **MODIFIED without a main match**: `Generated spec tsconfig` (app-generator delta) did not exist in the main spec. It was appended under `## Requirements` as a new requirement. The delta's MODIFIED label is inconsistent with the main spec; the content is new behavior, so append is the correct merge.
- **Merge method**: the three main specs were merged by a splicing script that copied delta block bytes verbatim, stripped the `(Previously: ...)` notes and the delta headers, and collapsed a doubled blank line. The script refused to write if any forbidden delta token survived or any delta block was not verbatim in the output. The staged result was copied into place with `cp`.
- **Engram observation IDs**: this executor had no Engram tool available. Artifacts were read from the filesystem (hybrid store, openspec files). No `mem_get_observation` IDs are recorded here. The orchestrator must save this report to Engram and record the IDs it read.

## Follow-ups (not blocking, from verify-report SUGGESTION)

1. `.github/workflows/ci.yml:25` contains `--stop-agents-after="e2e"`. This is the Nx Cloud agent target name and does not invoke the `e2e` target. The `packaging.spec.ts` regex already ignores it. Consider a comment that explains this.
2. Init dependency placement (`dependencies` vs `devDependencies`) is characterized by pre-existing tests only, not newly tested. Accepted per task 1.5.

## Commits (`git log --oneline develop..HEAD`)

```
cd2d805c docs(nx-ionic-cordova): correct the e2e duration and note the TMPDIR override
67158587 chore(openspec): record nx-ionic-cordova release hardening apply progress
6374de4d docs(nx-ionic-cordova): document dependency placement, the TypeScript range and the e2e step
79d91a0c test(nx-ionic-cordova): add a local tarball smoke and release wiring checks
d003f4f3 fix(nx-ionic-cordova): reject path-like app names and enable esModuleInterop for specs
b3d6c882 docs(openspec): plan the nx-ionic-cordova release hardening
```

## Artifacts Archived

- `proposal.md`, `exploration.md`, `design.md`, `tasks.md`, `apply-progress.md`, `verify-report.md` (intermediate snapshots, kept as history)
- `specs/ionic-cordova-app-generator/spec.md`, `specs/ionic-cordova-init-generator/spec.md`, `specs/ionic-cordova-plugin-packaging/spec.md` (delta specs, kept as history)
- `archive-report.md` (this file, additive, written after the move)

## Mechanical Readback

- Source snapshot to archive folder: `diff -r` empty (exit 0).
- Staged main specs to installed main specs: `diff -r` empty (exit 0) for all three.

## Traceability

- Engram artifacts to read (launch prompt): `sdd/nx-ionic-cordova-release-hardening/{proposal,spec,design,tasks,verify-report}`. Observation IDs: not recorded by this executor (no Engram tool).
