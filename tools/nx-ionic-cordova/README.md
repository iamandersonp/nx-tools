# @iamandersonp/nx-ionic-cordova

An Nx plugin for Ionic/Cordova workspaces. It scaffolds an Ionic Angular
application wired to Nx, runs Cordova, Ionic and `cordova-res` commands scoped
to one app, and maps the Ionic CLI `ionic:build` and `ionic:serve` hooks to Nx
targets.

## What it provides

| Piece     | Name                                        | Purpose                                                                             |
| --------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Generator | `@iamandersonp/nx-ionic-cordova:init`       | Registers the plugin in `nx.json` and adds the Angular, Ionic and Cordova packages. |
| Generator | `@iamandersonp/nx-ionic-cordova:app`        | Scaffolds an Ionic/Cordova application.                                             |
| Executor  | `@iamandersonp/nx-ionic-cordova:native`     | Runs a Cordova, Ionic or `cordova-res` command from the app root.                   |
| Executor  | `@iamandersonp/nx-ionic-cordova:ionic-hook` | Redirects an Ionic CLI hook call into the matching Nx target.                       |
| Bin       | `nx-ionic-hook`                             | Entry point the app's `ionic:build` and `ionic:serve` scripts call.                 |

## Requirements

- Nx 23 (`nx` and `@nx/devkit` `^23`).
- Node as declared by the workspace `engines`.
- Angular 22, Ionic 9 and Cordova 13. Only these current majors are supported.
- TypeScript `~6.0`. `@angular/build`, `@angular-devkit/build-angular`, `@ionic/angular-toolkit` and
  `typescript-eslint` peer on `typescript` `<6.1`, so a newer TypeScript breaks the install.
- iOS builds need macOS and Xcode.

## Install

```bash
nx add @iamandersonp/nx-ionic-cordova
```

`nx add` installs the package and runs `init`, which registers the plugin in
`nx.json` and adds the Angular, Ionic and Cordova packages to the root
`package.json`: runtime packages go to `dependencies` and tooling to
`devDependencies`. Versions already in the file are kept. Running `init` again
changes nothing.

## Generate an app

```bash
nx g @iamandersonp/nx-ionic-cordova:app my-app --appId=com.acme.shop --directory=apps
```

| Option        | Type    | Default | Description                                                                        |
| ------------- | ------- | ------- | ---------------------------------------------------------------------------------- |
| `name`        | string  | prompt  | The Nx project name (first argument). A name, not a path.                          |
| `appId`       | string  | prompt  | Required reverse-DNS widget id. No default: a wrong id is a store-identity defect. |
| `directory`   | string  | `apps`  | The directory the app is generated under, inside the workspace.                    |
| `displayName` | string  | `name`  | The name shown on-device.                                                          |
| `prefix`      | string  | `app`   | The Angular selector prefix.                                                       |
| `tags`        | string  |         | Comma-separated Nx project tags.                                                   |
| `skipFormat`  | boolean | `false` | Skip formatting the generated files.                                               |

The app has a single `config.xml`, `environment.ts` and `environment.prod.ts`
(swapped by the `production` build configuration). Its sources equal the Ionic
`angular-standalone` blank starter. The app `package.json` holds only the
`ionic:build` and `ionic:serve` scripts and no dependencies: they live in the
workspace root `package.json`.

### Targets

| Target                                 | Executor                                    | Purpose                                                                  |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `build`, `serve`                       | `@angular/build`                            | Web build and dev server, with `production` and `live-*` configurations. |
| `test`                                 | `@angular-builders/jest`                    | Unit tests, zoneless like the app.                                       |
| `lint`                                 | `@angular-eslint/builder`                   | Uses the app `eslint.config.js` (Ionic starter rules).                   |
| `native`                               | `@iamandersonp/nx-ionic-cordova:native`     | Cordova operations, selected by configuration.                           |
| `ionic-hook-build`, `ionic-hook-serve` | `@iamandersonp/nx-ionic-cordova:ionic-hook` | Targets the Ionic CLI hooks run.                                         |
| `ionic-cordova-build`                  | `@ionic/cordova-builders`                   | Cordova web build.                                                       |

The `native` target defaults to the read-only `info` command. Run a
configuration with `nx run my-app:native:<configuration>`:

| Configuration                              | Runs (through `ionic cordova`, or `cordova-res`)                |
| ------------------------------------------ | --------------------------------------------------------------- |
| `android-add`, `android-rm`                | `platforms add android@15`, `platform rm android`               |
| `android-build`, `android-build-debug`     | `build android`, `build android --debug`                        |
| `android-build-prod`                       | `build android --prod --release`                                |
| `ios-add`, `ios-rm`                        | `platforms add ios`, `platform rm ios`                          |
| `ios-build`                                | `build ios`                                                     |
| `ios-build-debug`                          | `build ios --prod --device --debug`                             |
| `ios-build-prod`                           | `build ios --prod --device --release`                           |
| `install-android`, `install-ios`           | `run android`, `run ios`, deployed to a device                  |
| `live-android`, `live-ios`                 | `run android -l`, `run ios -l --external`, deployed to a device |
| `plugin-add`, `plugin-rm`                  | `plugin add`, `plugin rm`, with `--plugin=<spec>`               |
| `resgenerate`, `res-generate`              | `cordova-res resources`, `cordova-res --copy`                   |
| `res-generate-android`, `res-generate-ios` | `cordova-res android --type adaptive-icon`, `cordova-res ios`   |

Add or remove a Cordova plugin:

```bash
nx run my-app:native:plugin-add --plugin=cordova-plugin-camera
nx run my-app:native:plugin-rm --plugin=cordova-plugin-camera
```

Target an Android emulator instead of a device:

```bash
nx run my-app:native:install-android --deploy=emulator
```

## `native` executor

The command runs with the project root as its working directory, so the
`config.xml` and `platforms` of that app are the ones used. The CLI is resolved
from the workspace root and started through Node, never through
`node_modules/.bin`.

| Option     | Type     | Default   | Description                                                                                                 |
| ---------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `command`  | string   |           | Required. The CLI subcommand, e.g. `build`, `platform`.                                                     |
| `cli`      | enum     | `cordova` | `cordova`, `ionic` or `cordova-res`.                                                                        |
| `args`     | string[] | `[]`      | Extra arguments appended after the command.                                                                 |
| `plugin`   | string   |           | A Cordova plugin spec (package name, git URL or path), appended after `args` and before the platform.       |
| `platform` | string   |           | A platform name such as `android` or `ios`, appended after the command.                                     |
| `deploy`   | enum     |           | `device` appends `--device`, `emulator` appends `--emulator`, last in the arguments. Unset appends neither. |

## `ionic-hook` executor and `nx-ionic-hook`

The Ionic CLI runs the app's `ionic:build` and `ionic:serve` npm scripts
instead of `ng`. It always forwards its own `--project=<name>`, which collides
with the reserved `--project` flag of `nx run`. The generated scripts therefore
call the `nx-ionic-hook` bin, which finds the workspace root, runs
`nx run <project>:ionic-hook-build` (or `-serve`) and forwards the Ionic
arguments to the `ionic-hook` executor.

| Option               | Type           | Description                                           |
| -------------------- | -------------- | ----------------------------------------------------- |
| `hook`               | enum           | Required. `build` or `serve`.                         |
| `platform`           | string         | The platform the Ionic CLI forwarded, e.g. `android`. |
| `host`, `port`       | string, number | Dev-server host and port, used by `serve` only.       |
| `buildConfiguration` | string         | The configuration the mapped target runs under.       |

## Windows and pnpm

CLIs are started with Node and an argument array, with no shell, so paths with
spaces and Windows quoting behave the same as on POSIX. They are resolved from
the package's own `bin` field, which also works with the pnpm virtual store.

## Publishing

Publishing is manual. This repository has no workflow that runs `npm publish`.

Before a release, run `nx run nx-ionic-cordova:e2e`. It packs the plugin, installs
the tarball into a throwaway workspace and builds, tests and lints a generated
app. It needs registry access and takes about 5-8 minutes. CI does not run it.
