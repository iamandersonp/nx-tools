# Proposal: nx-ionic-cordova release hardening

## Intent

The archived change `2026-10-16-nx-ionic-cordova-plugin` left verify follow-ups (W1–W3, S1–S3, task 13.9) that block the first release of `@iamandersonp/nx-ionic-cordova`: untested release wiring, no tarball-level proof, a ts-jest `TS151001` warning in generated apps, path-like `name` values leaking into identities, and docs/spec drift about root dependencies and the TypeScript range.

## Scope

### In Scope
- `release wiring` unit block in `packaging.spec.ts` (config and manifest entries agree).
- Local-only smoke script exposed as an `e2e` Nx target on `nx-ionic-cordova` (`cache: false`, `dependsOn: build`): pack, fresh Nx 23 workspace, install tarball, `init`, `app demo`, then `demo:build|test|lint` exit 0, no `TS151001` in `demo:test`, and a path-like app name fails.
- `"esModuleInterop": true` in the generated `tsconfig.spec.json`.
- `app` rejects a path-like `name` (`/`, `\`, `:`, whitespace, non-letter first character) with an error pointing to `--directory`, and rejects a `directory` that escapes the workspace (`..`).
- README: `init` writes runtime packages to root `dependencies` and tooling to `devDependencies`; requirements state `typescript ~6.0` and why.
- `versions.ts` comment: TypeScript stays `~6.0` because the Angular 22 toolchain peers `<6.1`.

### Out of Scope
- Any version range change.
- New workflow or adding `e2e` to `ci.yml`.
- Real Windows/pnpm run, `nx add` via registry, release/publish.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `ionic-cordova-init-generator`: "Root devDependencies" becomes runtime set in `dependencies`, tooling in `devDependencies`.
- `ionic-cordova-app-generator`: "Options and validation" adds `name`/`directory` rejection; generated spec tsconfig sets `esModuleInterop`.
- `ionic-cordova-plugin-packaging`: local `e2e` smoke target; README documents the TypeScript range rationale.

## Approach

Test-first. Unit RED for each fix (`packaging.spec.ts`, `generator.spec.ts`, normalization spec). The smoke script spawns argv arrays without a shell; its RED is the pre-fix `TS151001` run. It lives outside `src/**`, so it stays out of `test`, `typecheck`, `lint` and the tarball.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `tools/nx-ionic-cordova/src/packaging.spec.ts` | Modified | Release wiring block |
| `tools/nx-ionic-cordova/src/generators/app/**` | Modified | Validation, spec tsconfig template |
| `tools/nx-ionic-cordova/src/utils/versions.ts` | Modified | Comment |
| `tools/nx-ionic-cordova/e2e/**`, `project.json` | New/Modified | Smoke script, `e2e` target |
| `tools/nx-ionic-cordova/README.md` | Modified | Dependencies, TypeScript note |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Smoke rots without a gate | Med | Accepted; run before each release |
| Upstream drift/network breaks smoke | Med | Kept out of `ci.yml` |
| Validation rejects a legitimate name | Low | Error names `--directory` as the path |

## Rollback Plan

Revert the commits; nothing is published and no CI or range changes. The `e2e` target is removable without side effects.

## Dependencies

- npm registry access for the local smoke only.

## Success Criteria

- [ ] `npm run test:ci`, build, typecheck and lint pass.
- [ ] `nx run nx-ionic-cordova:e2e` exits 0 locally with all smoke assertions.
- [ ] Delta specs match README and `init` behavior.

## Size Estimate

~280 changed lines: fixes + release test ~100, smoke + target ~180. Fits one 400-line review.

## Proposal question round

Resolved by the user (2026-10-16): item 3 option A, item 1 option A, TypeScript stays `~6.0`. No open product questions.
