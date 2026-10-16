# Archive Report: nx-ionic-cordova-plugin

**Archived on**: 2026-10-16
**Archive status**: Intentional partial archive with warnings (task 13.9 open by explicit user decision)
**Artifact store**: hybrid (openspec in nx-tools + Engram project `bde-nx`, topic keys `sdd/nx-ionic-cordova-plugin/*`)
**Repository**: nx-tools, branch `feat/nx-ionic-cordova-13-fix-generated-app`, HEAD `0c1bb6b2` (unchanged since verification)
**Archive path**: `openspec/changes/archive/2026-10-16-nx-ionic-cordova-plugin/`

## Gates at Close

| Gate | Result |
|------|--------|
| Native review receipt (`reviewGate`) | Absent. Receipt-driven review is off in this repository; delivery follows ordinary repository policy. |
| Verify verdict | PASS WITH WARNINGS (`verify-report.md`, `verdict: pass_with_warnings`, 0 blockers, 0 CRITICAL) |
| CRITICAL issues | 0 |
| Task completion | 72/73 checked. One open item: 13.9 (intentional, see below). |
| Requirements / scenarios | 24/24 requirements, 61/61 scenarios (counted from the archived delta specs) |

### Intentional Partial Archive

Task `13.9` (`FOLLOW-UP (deferred): add a packaging-level e2e smoke script or test`) is intentionally left unchecked. It is genuine deferred work, not a stale checkbox, so it was not reconciled. The user explicitly approved archiving with this task open and recorded it as a tracked follow-up. Per the archive policy, this archive is intentional-with-warnings.

## Specs Synced to Main Specs

The main `openspec/specs/` directory was empty, so each delta spec was copied byte-for-byte as a new main spec (Mechanical Copy Contract). All five are ADDED capabilities.

| Domain | Action | Requirements | Scenarios |
|--------|--------|--------------|-----------|
| `ionic-cordova-native-executor` | Created | 5 | 14 |
| `ionic-cordova-hook` | Created | 5 | 16 |
| `ionic-cordova-init-generator` | Created | 3 | 7 |
| `ionic-cordova-app-generator` | Created | 6 | 14 |
| `ionic-cordova-plugin-packaging` | Created | 5 | 10 |

Note: the copied main specs keep the delta headers (`# Delta for {domain}` and `## ADDED Requirements`). Normalizing them to main-spec headings would break the byte-identity readback, so that is deferred as a follow-up.

## Archive Contents

- proposal.md, exploration.md, design.md, tasks.md, apply-progress.md, verify-report.md
- specs/ (5 delta specs, as listed above)
- archive-report.md (this file, additive)

## Verify Findings at Close

Source: `verify-report.md` (intermediate snapshot at HEAD `0c1bb6b2`, observation #4885). No later commit touched the change after verification, so these remain open.

**Warnings (open)**
- W1: Task 13.9 open (e2e smoke script/test). The "Release entries" scenario has no covering test.
- W2: `nx run demo:test` emits ts-jest `TS151001` (esModuleInterop) noise in the generated `tsconfig.spec.json`. Exit is 0.
- W3: "Windows and pnpm" behavior is covered only by unit tests with injected dependencies. No real win32/pnpm run.

**Suggestions (open)**
- S1: A path-like `name` (for example `app apps/a/b/deep`) creates a project named `apps/a/b/deep`. Consider rejecting or documenting.
- S2: Re-check the `typescript ~6.0` and `@angular-builders/jest ^22` ranges when upstream majors move.
- S3: `init` installs runtime packages in root `dependencies`. Document this.

## Follow-ups

1. Task 13.9: add a packaging-level e2e smoke script or test (covers W1 and W2/W6 context).
2. W2: set `esModuleInterop` in the generated `tsconfig.spec.json`.
3. W3: real win32/pnpm validation.
4. S1 to S3 as listed above.
5. Normalize the main-spec headers copied from the delta specs (`# Delta for …`, `## ADDED Requirements`) in a separate, non-archive change.

## Discrepancies Recorded

- Engram spec observation #4834 (written at planning time) states "22 requirements, 61 scenarios". The archived files count 24 requirements and 61 scenarios. The file counts are authoritative for the final state, and the verify report agrees with them.
- Engram tasks observation #4846 is a planning snapshot with no checkboxes. Completion was read from the persisted `tasks.md`, which is authoritative.
- Engram apply-progress observation #4852 lists "commit verify-report.md" as pending. It was not done. The verify report is archived as an untracked file per the launch instruction, and nothing was committed, pushed, or staged.

## Observation IDs (Traceability)

| Artifact | Engram observation | Topic key |
|----------|--------------------|-----------|
| explore | #4825 | `sdd/nx-ionic-cordova-plugin/explore` |
| proposal | #4830 | `sdd/nx-ionic-cordova-plugin/proposal` |
| spec | #4834 | `sdd/nx-ionic-cordova-plugin/spec` |
| design | #4842 | `sdd/nx-ionic-cordova-plugin/design` |
| tasks | #4846 | `sdd/nx-ionic-cordova-plugin/tasks` |
| apply-progress | #4852 | `sdd/nx-ionic-cordova-plugin/apply-progress` |
| verify-report | #4885 | `sdd/nx-ionic-cordova-plugin/verify-report` |

## Working Tree State

- Nothing committed, pushed, or staged. No source under `tools/` was touched.
- Moved (unstaged deletions): the 10 tracked files of `openspec/changes/nx-ionic-cordova-plugin/`.
- Created (untracked): the archive folder `openspec/changes/archive/2026-10-16-nx-ionic-cordova-plugin/` and `openspec/specs/{5 domains}/spec.md`.
