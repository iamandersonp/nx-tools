# Apply progress: nx-ionic-cordova-plugin

## Delivery

- delivery_strategy: `auto-chain`
- chain_strategy: `feature-branch-chain` (tracker `feat/nx-ionic-cordova`; PR 1 targets the tracker, later PRs target the previous slice branch)
- Review budget: 400 changed lines per slice
- Mode: Strict TDD (runner `npm run test:ci`)

## Slice 1: Scaffold and wiring (branch `feat/nx-ionic-cordova-01-scaffold`)

Tasks 1.1-1.6 complete. Slices 2-12 pending.

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
