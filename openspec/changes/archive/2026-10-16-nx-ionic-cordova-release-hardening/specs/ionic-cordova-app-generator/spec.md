# Delta for ionic-cordova-app-generator

## MODIFIED Requirements

### Requirement: Options and validation

The `app` generator MUST require `name` and `appId`, and accept `directory` (default `apps`), `displayName`, `prefix` (default `app`), `tags` and `skipFormat`. It MUST fail without writing files when `appId` is missing or not a valid reverse-DNS id. It MUST fail without writing files when `name` contains `/`, `\`, `:` or whitespace, or does not start with a letter; the error MUST mention `--directory`. It MUST fail without writing files when `directory` resolves outside the workspace (for example via `..`). It MUST NOT adopt a standalone non-Nx project.

#### Scenario: Missing appId
- WHEN the generator runs without `appId`
- THEN it throws and the tree is unchanged

#### Scenario: Invalid appId
- GIVEN `appId` is `Not Valid`
- THEN it throws naming the option

#### Scenario: Existing project
- GIVEN project `name` already exists
- THEN it throws and writes nothing

#### Scenario: Path-like name with slash
- GIVEN `name` is `apps/demo`
- WHEN the generator runs
- THEN it throws an error mentioning `--directory` and the tree is unchanged

#### Scenario: Path-like name with backslash or colon
- GIVEN `name` is `apps\demo` or `a:demo`
- WHEN the generator runs
- THEN it throws an error mentioning `--directory` and the tree is unchanged

#### Scenario: Name with whitespace
- GIVEN `name` is `my app`
- WHEN the generator runs
- THEN it throws an error mentioning `--directory` and the tree is unchanged

#### Scenario: Name with non-letter first character
- GIVEN `name` is `1demo` or `-demo`
- WHEN the generator runs
- THEN it throws an error mentioning `--directory` and the tree is unchanged

#### Scenario: Valid name accepted
- GIVEN `name` is `demo-app` and `directory` is `apps/mobile`
- WHEN the generator runs
- THEN it succeeds and the project root is `apps/mobile/demo-app`

#### Scenario: Directory escapes workspace
- GIVEN `directory` is `../outside`
- WHEN the generator runs
- THEN it throws and the tree is unchanged

### Requirement: Generated spec tsconfig

The generated `tsconfig.spec.json` MUST set `"esModuleInterop": true` so ts-jest does not emit warning `TS151001` when running the app's `test` target.

#### Scenario: esModuleInterop set
- WHEN the app is generated
- THEN `tsconfig.spec.json` contains `compilerOptions.esModuleInterop` equal to `true`

#### Scenario: No TS151001 on test
- GIVEN a generated app in a fresh workspace
- WHEN `demo:test` runs
- THEN its output does not contain `TS151001`
