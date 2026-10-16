# Proposal: Public `@iamandersonp/nx-ionic-cordova` plugin

## Intent

Ionic/Cordova support for Nx exists only inside bde-nx as a private plugin. That plugin is loaded from TypeScript source, tied to the `@bde` scope and per-environment configs, and fails on Windows/pnpm. Publish a generic, installable plugin (`nx add @iamandersonp/nx-ionic-cordova`) for stock Ionic/Cordova apps.

## Scope

### In Scope
- Package at `tools/nx-ionic-cordova`, following `tools/nx-sonar`: public, MIT, out-tsc build, manifests pointing at compiled JS, `files`, peer deps `nx`/`@nx/devkit` `^23`, release-please entries, README.
- `native` executor (build/run/emulate, plugin add/rm). CLIs are resolved with `require.resolve` and spawned via `process.execPath`.
- `ionic-hook` executor, plus the `nx-ionic-hook` `bin` that replaces the swc-register shim. The workspace root comes from the nearest `nx.json` above cwd, with `NX_WORKSPACE_ROOT` as fallback.
- `init` generator: idempotent plugin registration, devDependencies, `skipFormat`.
- `app` generator: Angular 22 / Ionic 9 / Cordova 13 (android@15), Android + iOS. It has exactly one `config.xml`, `environment.ts` and `environment.prod.ts`, and relative paths come from the `directory` depth. `--appId` is required.

### Out of Scope
- `migrate-app`, `to-workspace-package-name`, and per-environment variants.
- `cordova-plugin-localization-strings` and `TRANSLATION_PATH`. They are dropped from the generic template, not made optional.
- Publish job, `NPM_TOKEN`, provenance. Publishing stays a manual `npm publish`.
- Majors other than the current ones. Inferred targets (`createNodes`) are a possible later step.
- Any change to bde-nx's private plugin.

## Capabilities

### New Capabilities
- `ionic-cordova-native-executor`: runs Cordova/native CLIs across platforms.
- `ionic-cordova-hook`: the `ionic-hook` executor and the `nx-ionic-hook` bin.
- `ionic-cordova-init-generator`: `nx add` setup.
- `ionic-cordova-app-generator`: the generic app scaffold.
- `ionic-cordova-plugin-packaging`: package contract (manifests, `files`, `bin`, peers, release wiring).

### Modified Capabilities
None.

## Approach

Fork and generalize (exploration Approach A). Portable pieces are ported with their specs. BdE couplings are removed: the `@bde` executor strings, the `asb` default, `es.bde.*`, the per-env templates, and the fixed `../../`. Work is test-first.

**Drift policy:** there is no automatic sync. The public plugin is independent. Fixes may be ported by hand in either direction.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `tools/nx-ionic-cordova/**` | New | Plugin source, specs, manifests, README |
| `tsconfig.json`, `eslint.config.mjs` | Modified | Project reference, lint glob |
| `release-please-config.json`, `.release-please-manifest.json` | Modified | Package entry |
| `package-lock.json` | Modified | Workspace and devDeps |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Windows/pnpm CLI resolution is untested in CI | Med | Unit-test the resolver; never use `.bin` paths |
| Generated app breaks at depths other than 2 | Med | Depth-parameterized tests |
| Tarball misses files or `bin` | Med | `npm pack --dry-run` check before publishing |
| Public and private copies diverge | High (accepted) | Policy states it. bde-nx is unaffected |
| Upstream majors move | Med | Peer ranges limited to tested majors |

## Rollback Plan

- Each slice is an isolated revertable commit or PR. Workspace wiring lives only in slice 1.
- Before publishing: revert the slices. After publishing: `npm deprecate` the version, publish a fix, and use `npm unpublish` only within 72h.
- bde-nx keeps working regardless.

## Dependencies

- Nx 23 workspace (present). Maintainer npm credentials for the manual publish.

## Success Criteria

- [ ] `npm run test:ci`, `build`, `typecheck` and `lint` pass for the new project.
- [ ] `npm pack --dry-run` lists the compiled JS, manifests, schemas, README and the executable `bin`.
- [ ] `nx add` registers the plugin. `nx g app` at depths 1 and 3 produces correct relative paths and a single config set.
- [ ] Specs prove that no spawn goes through `node_modules/.bin`.
- [ ] bde-nx is unchanged.

## Delivery Outline (chained, ≤400 lines each)

1. Scaffold, workspace and release wiring, stub manifests
2. Root/CLI resolution helpers (`nx.json` climb, `require.resolve` + `execPath`)
3. `native` executor core (`build-argv`, `resolve-cwd`, schema)
4. `native` emulator and plugin add/rm
5. `ionic-hook` executor
6. `bin` + `cli/lib` helpers
7. Generalized shared target builders
8. `init` generator
9. `app` generator: schema, normalization, depth math, targets
10. `app` generator: templates (config.xml, environments, sources)
11. `app` generator: dependencies/optional features + full README + pack check

## Proposal question round

Assumptions are pending user review:
1. Localization plugin: **resolved, dropped from v1** (user, 2026-10-16).
2. App id: **resolved, `--appId` is required**, with no default (user, 2026-10-16). It is the store identity and cannot change after publishing.
3. Path aliases: **resolved, dropped** (user, 2026-10-16). Guiding principle from the user: apart from the
   Nx wiring and the single-environment layout, the `app` generator MUST produce the same app as the
   official Ionic Angular starter (`ionic start`). Any template decision not covered elsewhere defaults to
   whatever that starter generates.
4. Test/lint builders: **resolved, keep the Nx wiring of the current generator** (user, 2026-10-16). The
   starter principle covers the app's own sources and config, not its tooling. The app is a project inside
   an Nx monorepo, so it keeps the `project.json` targets the private generator emits:
   - `build`: `@angular/build:application`
   - `serve`: `@angular/build:dev-server`
   - `test`: `@angular-builders/jest:run`
   - `lint`: `@angular-eslint/builder:lint`
   - `@ionic/cordova-builders:cordova-build`, plus the plugin's own executors

   The starter's `ng test`/Vitest setup is not adopted. The generated `apps/<app>/package.json` carries
   no dependencies, only its name, the Ionic hook scripts and the Cordova metadata. Every dependency
   lives in the workspace root `package.json`, where `init` adds it.
5. Target users: **resolved, only new apps in an existing Nx workspace** (user, 2026-10-16). `init` does
   not adopt a standalone non-Nx Ionic project; such users run `nx init` first.
