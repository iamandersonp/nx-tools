# ionic-cordova-hook Specification

## Requirements

### Requirement: Hook-to-target mapping

The `ionic-hook` executor MUST map the Ionic CLI hook to an Nx target: `build` without platform maps to `build`; `build` with platform maps to `ionic-cordova-build` with `platform` forwarded; `serve` maps to `serve`, forwarding only `host` and `port`.

#### Scenario: Web build
- GIVEN `hook: build`, no platform, configuration `production`
- THEN the target is `build` under `production`

#### Scenario: Cordova build
- GIVEN `hook: build`, `platform: android`
- THEN the target is `ionic-cordova-build` with option `platform=android`

#### Scenario: Plain serve
- GIVEN `hook: serve`, host `0.0.0.0`, port 8100
- THEN the target is `serve` with only `host` and `port`

### Requirement: Live reload configuration

A `serve` hook with a platform MUST run configuration `live-<platform>`. Combining a platform with a requested configuration MUST throw an error naming both.

#### Scenario: Live serve
- GIVEN `hook: serve`, `platform: ios`
- THEN configuration `live-ios` is used

#### Scenario: Conflict
- GIVEN `hook: serve`, `platform: android`, configuration `production`
- THEN the executor throws and runs nothing

### Requirement: Configuration source and PORT

The configuration MUST come from `buildConfiguration`, else the context configuration. For a serve hook with a port, the executor MUST set `process.env.PORT` to that port before running. The result MUST be success only if every yielded result succeeds. It MUST throw when `projectName` is unset.

#### Scenario: Fallback configuration
- GIVEN no `buildConfiguration` and context configuration `production`
- THEN the mapped target runs under `production`

#### Scenario: Port wins
- GIVEN env `PORT=300` and serve port 8100
- THEN `process.env.PORT` is `8100`

#### Scenario: Failed result
- GIVEN the mapped target yields one failing result
- THEN the executor returns `{ success: false }`

### Requirement: Argument normalization

`nx-ionic-hook` MUST remove every `--project`, `--project=<v>` and `-p <v>` token, and MUST rewrite `--configuration <c>`, `--configuration=<c>`, `-c <c>` and `-c=<c>` to `--buildConfiguration=<c>`. A trailing valueless configuration flag is dropped; other tokens are unchanged. The result MUST be `run <target>` plus the normalized tokens.

#### Scenario: Project stripped
- GIVEN forwarded `--project=app --platform=android`
- THEN the vector is `run t --platform=android`

#### Scenario: Prod configuration
- GIVEN forwarded `-c production`
- THEN the vector contains `--buildConfiguration=production`

#### Scenario: Dangling flag
- GIVEN forwarded `--platform=ios --configuration`
- THEN the flag is dropped

### Requirement: Executable and root resolution

The `nx-ionic-hook` bin MUST find the workspace root by climbing from cwd to the nearest `nx.json`, falling back to `NX_WORKSPACE_ROOT`. It MUST resolve `nx/bin/nx.js` from that root, spawn it via `process.execPath` with cwd at the root and inherited stdio, and exit with the child's status (1 if none). It MUST NOT use `node_modules/.bin`, `__dirname` climbing or swc-register.

#### Scenario: Nested cwd
- GIVEN cwd is `apps/shop` and `nx.json` is two levels up
- THEN the root is that directory

#### Scenario: Env fallback
- GIVEN no `nx.json` above cwd and `NX_WORKSPACE_ROOT` is set
- THEN that value is the root

#### Scenario: No root
- GIVEN neither source yields a root
- THEN it prints an error and exits 1

#### Scenario: Missing target
- GIVEN no target argument
- THEN it prints usage and exits 1

#### Scenario: Exit propagation
- GIVEN nx exits 3
- THEN the bin exits 3
