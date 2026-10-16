# Delta for ionic-cordova-native-executor

## ADDED Requirements

### Requirement: CLI resolution without .bin

The executor MUST resolve the chosen CLI (`cordova`, `ionic` or `cordova-res`; default `cordova`) with `require.resolve` from the workspace root and spawn it through `process.execPath`. It MUST NOT spawn anything under `node_modules/.bin`, and MUST NOT use a shell string or `npx`.

#### Scenario: Spawn goes through the Node binary
- GIVEN `cli` is `ionic`
- WHEN the executor runs
- THEN the spawned program is `process.execPath` and its first argument is the resolved `ionic` entry file
- AND no spawned path contains `node_modules/.bin`

#### Scenario: CLI not installed
- GIVEN the chosen CLI cannot be resolved from the workspace root
- WHEN the executor runs
- THEN it returns `{ success: false }` with an error naming the missing CLI, and spawns nothing

#### Scenario: Windows and pnpm
- GIVEN the platform is `win32` or the CLI is not hoisted
- WHEN the executor runs
- THEN resolution and spawning follow the same path, with no `.cmd` shim involved

### Requirement: Argument vector

The executor MUST pass `[command, ...args, plugin?, platform?, deployFlag?]` as an array, in that order. `deploy: device` adds `--device`, `deploy: emulator` adds `--emulator`, unset adds neither.

#### Scenario: Plugin and platform ordering
- GIVEN `command: cordova`, `args: [plugin, add]`, `plugin: cordova-plugin-x`
- WHEN the vector is built
- THEN it equals `[cordova, plugin, add, cordova-plugin-x]`

#### Scenario: Emulator deploy
- GIVEN `deploy: emulator` and a resolved serial `emulator-5554`
- WHEN the vector is built
- THEN `--emulator` is followed by `--target=emulator-5554`, last

#### Scenario: Serial ignored for device
- GIVEN `deploy: device` and a serial
- WHEN the vector is built
- THEN no `--target` is present

### Requirement: Working directory and result

The executor MUST run with the invoking project's root as cwd, inherit stdio, and report `success` only when the child exits zero. It MUST fail with a descriptive error when `projectName` is unset or the project is unknown.

#### Scenario: Project scoped cwd
- GIVEN project `shop` rooted at `apps/shop`
- WHEN the executor runs
- THEN cwd is `<workspaceRoot>/apps/shop`

#### Scenario: Missing project
- GIVEN `context.projectName` is unset
- WHEN the executor runs
- THEN it throws an error stating a project is required

#### Scenario: Non-zero exit
- GIVEN the child exits 1
- THEN the result is `{ success: false }`

### Requirement: Android emulator targeting

For an Android run with `deploy: emulator`, the executor MUST pick the first running emulator reported by `adb devices` (state exactly `device`, serial `emulator-<n>`) and pass it as `--target`. adb MUST be located via `ANDROID_HOME`, else `ANDROID_SDK_ROOT` (empty counts as unset), else `PATH`. It MUST NOT fail when adb is missing or fails.

#### Scenario: Several emulators
- GIVEN adb lists `emulator-5554` and `emulator-5556`
- THEN `emulator-5554` is targeted and an info log names the ignored one

#### Scenario: None running or adb missing
- GIVEN no emulator is running or adb cannot run
- THEN the run proceeds with plain `--emulator` and one warning is logged

#### Scenario: Non-ready entries
- GIVEN adb lists `emulator-5554 offline` and a physical device
- THEN neither is selected

### Requirement: Plugin add and remove

The generated `native` target MUST provide `plugin-add` and `plugin-rm` configurations running `ionic cordova plugin add|rm` from the app root, taking the spec from `--plugin`.

#### Scenario: Add via command line
- GIVEN `nx run app:native:plugin-add --plugin=cordova-plugin-camera`
- THEN the vector ends with `plugin add cordova-plugin-camera`

#### Scenario: Missing spec
- GIVEN `--plugin` is omitted
- THEN the executor does not invent a value; the CLI reports the error
