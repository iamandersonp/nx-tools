# Exploration: nx-ionic-cordova release hardening

Follow-ups from the archived change `2026-10-16-nx-ionic-cordova-plugin` (verify W1–W3, S1–S3, task 13.9)
that block the first release of `@iamandersonp/nx-ionic-cordova`. Registry data checked on 2026-10-16.
A real Windows/pnpm run stays manual and out of scope.

## Current State

- `src/packaging.spec.ts` checks the `files` whitelist, the schemas and the workflows. Nothing reads
  `release-please-config.json` or `.release-please-manifest.json`, so the "Release entries" scenario has no
  test. Both files already contain `tools/nx-ionic-cordova` (manifest `0.0.0`).
- `ci.yml` runs `nx run-many -t test build typecheck` on PRs and `main`. It already passes
  `--stop-agents-after="e2e"`.
- The plugin tsconfigs include `src/**` only, and unit Jest matches `*.spec|test.*`. A file such as
  `e2e/smoke.e2e.mjs` is invisible to `test`, `typecheck`, `lint` and `npm pack`.

## Item 1: packaging e2e and "Release entries"

**Unit test, recommended in every case.** Add a `release wiring` block to `packaging.spec.ts`, about 25 lines
with no network:

- `config.packages['tools/nx-ionic-cordova']` exists;
- the manifest has the same key;
- every config package has a manifest key.

**Smoke script.** It runs with argv arrays and no shell:

1. `nx run nx-ionic-cordova:build`.
2. `npm pack -w tools/nx-ionic-cordova` into a temp directory.
3. `create-nx-workspace@23 --preset=apps --nxCloud=skip`.
4. `npm i -D <tgz>`, then `nx g …:init`, then `nx g …:app demo --appId=com.example.demo`, then `npm install`.
5. `nx run demo:build`, `demo:test` and `demo:lint`.

Cost and constraints:

- **Runtime:** an estimated 5–8 minutes.
- **Network:** it needs the npm registry.
- **Native toolchain:** none, because no `cordova platform add` runs.
- **`nx add`:** not coverable without a registry, so the script installs the tarball and runs `init`.
- **Extra assertions:** no `TS151001` in the `demo:test` output (item 2), and a path-like app name must
  fail (item 3).

| Option | Pros | Cons | Effort |
|---|---|---|---|
| A. Local `e2e` Nx target only | Simple, no CI cost | No automatic gate, so it can rot | Low |
| B. A plus `e2e.yml` (`workflow_dispatch`, PR path filter `tools/nx-ionic-cordova/**`, weekly cron) | Catches upstream drift without slowing every PR | A new workflow to maintain | Medium |
| C. `e2e` in the `ci.yml` `run-many` | Always gated | Adds 5–8 minutes and heavy installs to every PR | Low code, high cost |

A separate `*-e2e` project is not recommended. `tools/*` is an npm workspace glob, so a new project would add
inferred targets and lockfile churn.

## Item 2: TS151001 in the generated app

- **Cause:** ts-jest (`legacy/config/config-set.js`) warns when `module` is not CommonJS, Node16 or NodeNext
  and neither `esModuleInterop` nor `allowSyntheticDefaultImports` is set in the raw options. The generated
  `tsconfig.spec.json` uses `module: "Preserve"` with neither flag. TS 6 defaults them to true, but ts-jest
  reads the raw options.
- **Fix:** add `"esModuleInterop": true` to `tsconfig.spec.json__tmpl__`, with a RED assertion in
  `generator.spec.ts`.
- **Unconfirmed:** the "ts-compiler warnings" from the verify report were not reproduced. The smoke output
  will confirm.

## Item 3: path given as `name`

- **Current behaviour:** `normalizeAppOptions` checks only `appId` and uniqueness, then joins `directory` and
  `name`. A slash leaks into:
  - the project name;
  - the app `package.json` name, which becomes an invalid npm name;
  - `ionic.config.json`;
  - the default `displayName` and the `config.xml` `<name>`.
- **Nx 23:** `determineProjectNameAndRootOptions` treats `directory` as the full root and derives `name` from
  its last segment. Its validator `^[a-zA-Z][^:]*$` still accepts slashes.
- **Related gap:** `directory` is not checked for escaping the workspace (`..`).

| Option | Pros | Cons | Effort |
|---|---|---|---|
| A. Reject `/`, `\`, `:`, whitespace and a non-letter first character; the error points to `--directory` | Small, explicit, no semantic change | The user must type `--directory` | Low (~35 lines) |
| B. Derive the name from the last segment and the directory from the rest | Familiar Nx feel | Ambiguous against the default `directory=apps` | Medium |
| C. Adopt the Nx 23 directory-first model | Full parity | Breaking change to the unreleased API; spec and README rewrite | High (60+ lines) |

## Item 4: README

`init` writes the runtime packages to root `dependencies`: the `@angular/*` runtime set, `@ionic/angular`,
`ionicons`, `rxjs` and `tslib`. Tooling goes to `devDependencies`, and existing versions are kept. The README
"Install" section does not say this.

The spec requirement "Root devDependencies" (`ionic-cordova-init-generator`) is inaccurate. It needs a
MODIFIED delta.

## Item 5: version ranges

Every range in `versions.ts` matches the current registry majors:

| Package | Range | Registry |
|---|---|---|
| `@angular/*` | ^22 | 22.2.3 |
| `@angular-builders/jest` | ^22 | 22.0.1 |
| `@ionic/angular` | ^9 | 9.0.8 |
| `ionicons` | ^8.1 | 8.1.0 |
| `cordova` | ^13 | 13.0.0 |
| `cordova-android` | 15 | 15.1.0 |
| `jest-preset-angular` | ^17 | 17.0.3, which peers on Angular `>=20 <23` |
| `eslint` | ^10.10 | 10.12.0 |
| `typescript-eslint` | ^8.61 | 8.71.2 |

The one exception is **`typescript ~6.0`**. The registry's latest is 7.0.2, but `@angular/build`,
`@angular-devkit/build-angular`, `@ionic/angular-toolkit` and `typescript-eslint` peer on `<6.1`. It must stay
at `~6.0`, so the fix is a documentation note in the `versions.ts` comment and the README requirements.

Optional: `@angular-builders/jest` has a non-optional peer on `@angular/platform-browser-dynamic ^22`. npm and
pnpm install it automatically.

## Recommendation

- **Item 1:** the unit test plus option B, with the smoke asserting no `TS151001`.
- **Item 2:** add `esModuleInterop: true`.
- **Item 3:** option A, plus a guard against `directory` escaping the workspace.
- **Item 4:** the README paragraph and the MODIFIED spec delta.
- **Item 5:** documentation only.

Deliver in two slices. The first holds the fixes and the release test, about 100 lines. The second holds the
smoke script and workflow, about 220 lines.

## Risks

- **Drift:** caret ranges and the network can make the smoke fail because of upstream changes. Keep it out of
  the PR-blocking `ci.yml`.
- **Workflow scan:** `packaging.spec.ts` scans every workflow for `npm publish`.
- **Script TDD:** the script's RED is the pre-fix `TS151001` run.

## Decisions for the user

1. Item 3 behaviour: A, B or C.
2. Item 1 e2e home: A, B or C.
3. Confirm that TypeScript stays at `~6.0`, which the Angular 22 toolchain forces.

## Answers (user, 2026-10-16)

1. **Item 3:** option A. Reject path-like names with an error that points to `--directory`, and reject a `directory` that escapes the workspace.
2. **Item 1:** option A. The smoke is a local `e2e` Nx target only, with no new workflow.
3. **TypeScript:** stays at `~6.0`, because the Angular 22 toolchain forces it. Document it; this is not a policy exception.
