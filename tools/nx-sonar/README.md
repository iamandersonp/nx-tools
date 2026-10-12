# @iamandersonp/nx-sonar

An Nx plugin that runs the Sonar scanner for every project that opts in.
Each project declares only its Sonar `projectKey`; the plugin infers the
`sonar` target and derives the scanner properties from the Nx project graph,
so no `sonar-project.properties` file is needed.

## What it provides

| Piece     | Name                                   | Purpose                                                                                                 |
| --------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Inference | `createNodes`                          | Adds a `sonar` target to each project whose `project.json` declares `targets.sonar.options.projectKey`. |
| Executor  | `@iamandersonp/nx-sonar:sonar`         | Derives the scanner properties and runs the scanner.                                                    |
| Generator | `@iamandersonp/nx-sonar:init`          | Registers the plugin in `nx.json`. `nx add` runs it.                                                    |
| Generator | `@iamandersonp/nx-sonar:configuration` | Adds a `sonar` target to one project.                                                                   |

## Requirements

The executor runs the workspace-local scanner binary
`node_modules/.bin/sonar`. Install the scanner as a development dependency:

```bash
npm install --save-dev @sonar/scan
```

## Install

```bash
nx add @iamandersonp/nx-sonar
```

`nx add` installs the package and runs the `init` generator. To register the
plugin in a workspace where the package is already installed:

```bash
nx g @iamandersonp/nx-sonar:init
```

`init` adds `{ "plugin": "@iamandersonp/nx-sonar" }` to `nx.json` `plugins` when no
entry for the plugin exists, as a string or as an object. Running it again
changes nothing.

### Project key prefix

A workspace that names its Sonar projects with a common prefix declares it
once, as a plugin option:

```bash
nx g @iamandersonp/nx-sonar:init --projectKeyPrefix=my-org-
```

```json
{
  "plugins": [
    {
      "plugin": "@iamandersonp/nx-sonar",
      "options": { "projectKeyPrefix": "my-org-" }
    }
  ]
}
```

`init` sets or updates `options.projectKeyPrefix` on the existing entry, and
keeps its position and its other settings. The prefix is read only by the
`configuration` generator; it never changes which targets are inferred.

## Opt a project in

```bash
nx g @iamandersonp/nx-sonar:configuration --project=my-lib
```

This writes a `sonar` target to `my-lib/project.json`:

```json
"sonar": {
  "options": {
    "projectKey": "my-org-my-lib"
  }
}
```

- The default `projectKey` is the `projectKeyPrefix` followed by the Nx
  project name, or the project name alone when no prefix is configured.
  `--projectKey` sets it explicitly.
- `--projectName` sets the Sonar project name; when omitted, the executor
  uses the key.
- `--tsconfig`, `--lcovReportPath` and the `--extra*` options are the
  executor's own, and are copied to the target as given.
- The target never names an `executor`: the plugin infers it from the key.

The generator fails when the project does not exist, when another project
already declares the same `projectKey` (a Sonar key identifies one analysis
on the server), or when the project already has a `sonar` target. Pass
`--overwrite` to replace an existing target as a whole.

It warns, without failing, when the project root has none of
`tsconfig.sonar.json`, `tsconfig.lib.json` or `tsconfig.app.json` and no
`--tsconfig` is given; the analysis would then read no tsconfig. It does not
create one.

When it finishes, it prints the next steps:

1. Create the project with that key on your Sonar server, unless your token
   may provision projects on first analysis.
2. Check the derived properties with `nx run my-lib:sonar --dryRun`.

You can also write the target by hand: any `sonar` target with
`options.projectKey` opts the project in.

## Run the analysis

```bash
nx run my-lib:sonar            # one project
nx run-many -t sonar           # every project that opted in
nx run my-lib:sonar --dryRun   # print the properties, skip the scanner
```

The inferred target sets `cache: false`. A target that names a different
executor is left alone, so a project migrating from another Sonar integration
keeps its own target until it drops that executor.

## Executor options

| Option                    | Type       | Effect                                                                    |
| ------------------------- | ---------- | ------------------------------------------------------------------------- |
| `projectKey`              | `string`   | Required. The Sonar project key; also what opts the project in.           |
| `projectName`             | `string`   | The Sonar project name. Defaults to `projectKey`.                         |
| `tsconfig`                | `string`   | Replaces the default tsconfig, relative to the project root.              |
| `lcovReportPath`          | `string`   | Replaces the default lcov report path, relative to the project root.      |
| `dryRun`                  | `boolean`  | Prints the effective `key=value` properties and does not run the scanner. |
| `extraSources`            | `string[]` | Appended to `sonar.sources`.                                              |
| `extraTests`              | `string[]` | Appended to `sonar.tests`.                                                |
| `extraTestInclusions`     | `string[]` | Appended to `sonar.test.inclusions`.                                      |
| `extraTsconfigPaths`      | `string[]` | Appended to `sonar.typescript.tsconfigPaths`, after the chosen tsconfig.  |
| `extraExclusions`         | `string[]` | Appended to `sonar.exclusions`.                                           |
| `extraCoverageExclusions` | `string[]` | Appended to `sonar.coverage.exclusions`.                                  |

The `extra*` options add entries after the defaults and never replace them.

## Derived defaults

Paths are relative to the project root.

| Property                                       | Default                                                                                                              |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `sonar.projectBaseDir`                         | The project root, as an absolute path.                                                                               |
| `sonar.sources`, `sonar.tests`                 | The project's `sourceRoot`, relative to its root.                                                                    |
| `sonar.test.inclusions`                        | `<sourceRoot>/**/*.spec.ts`                                                                                          |
| `sonar.exclusions`                             | `**/*.spec.ts`                                                                                                       |
| `sonar.coverage.exclusions`                    | `**/*.d.ts`                                                                                                          |
| `sonar.cpd.exclusions`                         | `**/*.html`                                                                                                          |
| `sonar.javascript.lcov.reportPaths`            | `coverage/lcov.info`                                                                                                 |
| `sonar.sourceEncoding`, `sonar.projectVersion` | `UTF-8`, `1.0`                                                                                                       |
| `sonar.typescript.tsconfigPaths`               | The first of `tsconfig.sonar.json`, `tsconfig.lib.json` and `tsconfig.app.json` that exists; omitted when none does. |

Point `tsconfig` at a tsconfig that lists files. A solution-style
`tsconfig.json` (`files: []` with `references`) gives the analysis no type
information.

When the lcov report is missing, the executor warns with its path and still
runs the scanner, without coverage.

## Server and credentials

The plugin never reads, logs or passes credentials. The scanner reads its own
environment variables, inherited from the shell that runs Nx:

| Variable         | Read by the scanner for   |
| ---------------- | ------------------------- |
| `SONAR_HOST_URL` | The Sonar server URL.     |
| `SONAR_TOKEN`    | The authentication token. |

Export them before running a non-dry-run analysis. `--dryRun` needs neither.
