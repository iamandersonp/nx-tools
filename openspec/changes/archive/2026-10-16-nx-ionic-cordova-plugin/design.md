# Design: Public `@iamandersonp/nx-ionic-cordova` plugin

## Technical Approach

Fork and generalize the private bde-nx plugin into `tools/nx-ionic-cordova`. Use `tools/nx-sonar` as the template. Pure helpers are ported with their specs. Every subprocess goes through one new resolver module. The `app` generator moves from string builders to Nx `generateFiles` templates. Each template follows the Ionic `angular-standalone` starter. Paths come from `offsetFromRoot`.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Package shape | Copy nx-sonar: solution `tsconfig.json` (commonjs, `moduleResolution: node`), `tsconfig.lib.json` -> `out-tsc/lib`, `@nx/js:tsc`, manifests -> `./out-tsc/lib/src/...js`, schemas -> `./src/...` | ESM, `exports` | Nx loads the plugin as CJS. nx-sonar ships this shape. |
| CLI spawn | `src/shared/resolve-cli.ts` resolves `<pkg>/package.json` with `require.resolve(..., { paths: [root] })`, reads its `bin`, and spawns `spawnSync(process.execPath, [entry, ...argv], { shell: false })` | `node_modules/.bin/<cli>`, `shell: true`, hardcoded `bin/` subpaths | `.bin` gives `.cmd` shims on Windows and may be missing under pnpm. Reading `bin` keeps us out of package internals. |
| Workspace root (bin) | Climb from `process.cwd()` to the nearest `nx.json`. Fall back to `NX_WORKSPACE_ROOT`, then throw. | Climb from `__dirname` | The Ionic CLI sets cwd to the app. Inside `node_modules`, `__dirname` points at the package, not the workspace. |
| Executor ids | `src/generators/shared/plugin-entry.ts` exports `PLUGIN_NAME`, `NATIVE_EXECUTOR = \`${PLUGIN_NAME}:native\``, `IONIC_HOOK_EXECUTOR` | String literals per builder | One source of truth. A parity spec checks it against `package.json#name` and the `executors.json` keys. |
| Hook script | `nx-ionic-hook <app>:ionic-hook-build` / `serve`, using the `bin` field | `node -r @swc-node/register <path>` | npm puts the ancestor `.bin` dirs on PATH. No relative path, no swc. |
| App files | `generateFiles` from `src/generators/app/files/**` with the `__tmpl__` suffix. The build copies them via `@nx/js:tsc` `assets` into `out-tsc/lib/src/generators/app/files`. | Keep JSON string builders | Matches the starter file-for-file. `join(__dirname, 'files')` works both under ts-jest (source) and compiled. |
| Native configs | Keep the private target set minus per-env variants. Rename `*-test/ante` to `*-debug`/`*-prod`. Drop `--buildConfig` (Cordova reads `build.json` automatically). Keep `android@15`. | Per-env configs | This is the "single config" answer. |
| App targets | The generated `project.json` carries these targets:<br>- `build`: `@angular/build:application`<br>- `serve`: `@angular/build:dev-server`<br>- `test`: `@angular-builders/jest:run`<br>- `lint`: `@angular-eslint/builder:lint`<br>- `@ionic/cordova-builders:cordova-build`<br>- `ionic-hook-build`/`ionic-hook-serve`, plus `native` (plugin executors) | Starter `ng test`/Vitest | Resolved Q4: Nx tooling is kept. |
| Version policy | `src/utils/versions.ts` constants target the current majors only: Angular 22, `@ionic/angular` 9, `@ionic/angular-toolkit` 13, `ionicons` 8, Cordova 13 (`android@15`), TypeScript ~6.0. Peers are `nx`/`@nx/devkit` `^23`. `addDependenciesToPackageJson(..., keepExistingVersions = true)`. Runtime packages go to `dependencies`, tooling to `devDependencies`, both at the root. | Pinning inside the app's `package.json` | Proposal Q4: the app's `package.json` has no dependencies. Init never downgrades. |
| `main`/registration | `index.ts` exports nothing inferred (no `createNodes`). `init` registers `{ plugin }` with nx-sonar's pattern. | Skip registration | The proposal requires registration. `createNodes` comes later. |

## Data Flow

    ionic cordova build ─→ npm run ionic:build (cwd=app)
       └─→ nx-ionic-hook app:ionic-hook-build [fwd]
             findWorkspaceRoot ─→ resolveCli('nx') ─→ execPath nx.js run …
                └─→ ionic-hook executor ─→ runExecutor(build|serve)
    nx run app:native:<cfg> ─→ native executor
       resolveCwd(project root) + buildArgv ─→ spawnCli(ionic|cordova|cordova-res)

## File Changes

Origin: P = ported as-is (plus specs), G = generalized, N = new.

| Path under `tools/nx-ionic-cordova/` | Origin |
|---|---|
| `package.json`, `project.json`, `tsconfig*.json`, `jest.config.js`, `executors.json`, `generators.json`, `README.md` | N (nx-sonar shape). `bin`, peers `nx`/`@nx/devkit ^23`, `files` adds schemas |
| `src/index.ts` | N |
| `src/shared/resolve-cli.ts` | N |
| `src/executors/native/{schema.json,schema.d.ts,lib/build-argv,lib/android-emulator}` | P |
| `src/executors/native/{executor,lib/resolve-cwd}` | G (spawnCli; doc without localization) |
| `src/executors/ionic-hook/**` | P |
| `src/cli/lib/*` | P |
| `src/cli/ionic-hook.ts` | G (shebang `#!/usr/bin/env node`, resolver) |
| `src/generators/shared/{build-live-reload-configurations}` | P |
| `src/generators/shared/{build-native-target,build-ionic-hook-targets,build-ionic-hook-scripts}` | G |
| `src/generators/shared/plugin-entry.ts`, `src/generators/init/**` | N (pattern from nx-sonar) |
| `src/utils/versions.ts` | N (new; nx-sonar has no equivalent) |
| `src/generators/app/{generator,schema.*,lib/normalize-app-options,lib/build-app-project-json}` | G (`appId` required, `offsetFromRoot`, no aliases) |
| `src/generators/app/files/**` | N |

Not ported: `migrate-app/**`, `to-workspace-package-name`, and the localization paths. The app's `package.json` name becomes the plain `<name>`.

Root changes: `tsconfig.json` (references), `eslint.config.mjs` (glob), `release-please-config.json`, `.release-please-manifest.json` (`0.0.0`), `package-lock.json`.

## Interfaces / Contracts

```ts
export function findWorkspaceRoot(cwd?: string, env?: NodeJS.ProcessEnv, exists?: (p: string) => boolean): string;
export function resolveCliEntry(pkg: string, binName: string, root: string, deps?: ResolverDeps): string;
export function spawnCli(pkg: string, binName: string, argv: string[], opts: { root: string; cwd: string }, deps?: ResolverDeps): number;
```

`ResolverDeps` injects `resolve`, `readJson`, `spawn` and `execPath`, so tests never touch disk or spawn a process.

The `app` schema takes `name` and `appId` (both required), plus `directory` (default `apps`), `displayName` (default `name`), `prefix` and `tags`.

Templates are verified against `ionic-team/starters@main` (GitHub tree API, 2026-10-16). The generated app is
`angular-standalone/base` overlaid with `angular-standalone/official/blank`, where the overlay replaces base
files that have the same path.

- **App sources** (taken from the starter):
  - from base: `src/{index.html,main.ts,global.scss,theme/variables.scss}`, `src/assets/{icon/favicon.png,shapes.svg}`, `src/environments/environment{,.prod}.ts` and `src/app/app.component.scss`;
  - from blank: `src/app/{app.component.ts,app.component.html,app.routes.ts}` and `src/app/home/home.page.{ts,html,scss,spec.ts}`;
  - `src/app/app.component.spec.ts`, from base.
- **Workspace-level files:** the starter's root files (`.browserslistrc`, `.editorconfig`, `.gitignore`, `.vscode/*`) belong to the workspace and are not generated.
- **Replaced by the Nx wiring below:** `angular.json`, `eslint.config.js`, `package.json` and the starter's tsconfigs.
- **Not generated:** `src/test-setup.ts`. It is Vitest-specific, and Jest uses `setup-jest.ts` instead (resolved question 4 keeps the Jest tooling).
- **Unchanged:** the starter's own specs, apart from their test bootstrap. Nx wiring: `project.json`, `tsconfig{,.app,.spec,.angular}.json`, `jest.config.js`, `setup-jest.ts`, `ionic.config.json`, a single `config.xml` (`id=<appId>`), and a `package.json` holding name, hook scripts and `cordova: { plugins: {}, platforms: [] }`.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | resolver | Injected deps. `argv[0] === execPath`. No path contains `.bin`. String and object `bin`. Root climb, env fallback and throw cases use temp dirs from `fs.mkdtempSync`. |
| Unit | executors | `jest.mock('node:child_process')` / the resolver. The ported specs stay green. |
| Unit | generators | `createTreeWithEmptyWorkspace()`. Idempotent `init` (string and object entries). `app` at depths 1, 2 and 3 checks `extends`, `$schema` and the jest mapper offsets. Exactly one `config.xml`. A missing `appId` throws. |
| Packaging | tarball | A spec checks that `files` covers every manifest path and schema. Slice 12 runs `npm pack --dry-run` and confirms that `bin`, `files/**` and the executable entry are listed. |

## Threat Matrix

| Boundary | Applicability | Design response | Planned RED tests |
|---|---|---|---|
| Documentation-like paths | N/A | Nothing is classified or executed by name | none |
| Git repository selection / commit / push / PR | N/A | No VCS automation | none |
| Subprocess argv composition | Applicable | Argv is an array, `shell: false`, and plugin specs stay a single element | A spec with `;`/`&&` in `--plugin` asserts one argv element |
| Binary resolution | Applicable | `execPath` plus the resolved JS entry. A missing package returns an error naming the package plus `{ success: false }` | Missing-package spec. Spec that `.bin` is never used. |
| Root discovery | Applicable | No `nx.json` and no env var: exit 1 with a message | Throw spec |

## Migration / Rollout

No migration required. Chained slices, each ≤400 lines:

1. Scaffold, wiring and empty manifests, plus `plugin-entry`
2. Resolver
3. `native` core
4. Emulator and plugin add/rm
5. `ionic-hook` executor
6. `bin` and `cli/lib`
7. Shared target builders
8. `init` and `versions.ts`
9. `app` schema, normalize, depth and `project.json`
10. Wiring templates (config, tsconfigs, jest, `package.json`, environments)
11. Starter source templates and the build `assets` copy
12. README and pack check

This splits proposal slice 10, because the starter templates alone approach the budget.

## Open Questions

- [ ] Can `@ionic/cli` find `native-run` when `nx` is not launched via npm, since `.bin` is then missing from PATH? Validate in slice 4.
- [ ] Exact ranges for `@angular-builders/jest` and `@angular-eslint`. Assumed `^22`; check against the registry in slice 8.
- [ ] Does Nx 23 accept a registered plugin with no `createNodes` without warnings? Validate in slice 8.
