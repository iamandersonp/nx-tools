# nx-tools

[![Nx](https://img.shields.io/github/package-json/dependency-version/iamandersonp/nx-tools/dev/nx)](https://nx.dev)

An Nx monorepo that hosts public Nx plugins published under the `@iamandersonp` npm scope.

## Plugins

| Package                                                              | Version                                                                                                                             | Purpose                                                                                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`@iamandersonp/nx-sonar`](tools/nx-sonar/README.md)                 | [![npm](https://img.shields.io/npm/v/@iamandersonp/nx-sonar)](https://www.npmjs.com/package/@iamandersonp/nx-sonar)                 | Runs the Sonar scanner for every project that opts in, deriving the scanner properties from the Nx project graph.      |
| [`@iamandersonp/nx-ionic-cordova`](tools/nx-ionic-cordova/README.md) | [![npm](https://img.shields.io/npm/v/@iamandersonp/nx-ionic-cordova)](https://www.npmjs.com/package/@iamandersonp/nx-ionic-cordova) | Scaffolds Ionic/Cordova Angular apps wired to Nx and runs Cordova, Ionic and `cordova-res` commands scoped to one app. |

Each plugin's README documents its generators, executors and options.

## Repository structure

```text
nx-tools/
├── tools/                         # Publishable Nx plugins (npm workspaces)
│   ├── nx-sonar/
│   │   ├── src/
│   │   │   ├── executors/sonar/   # sonar executor
│   │   │   ├── generators/        # init, configuration and shared helpers
│   │   │   └── testing/           # shared test helpers
│   │   ├── executors.json
│   │   ├── generators.json
│   │   ├── CHANGELOG.md
│   │   └── README.md
│   └── nx-ionic-cordova/
│       ├── src/
│       │   ├── cli/               # nx-ionic-hook bin
│       │   ├── executors/         # native and ionic-hook executors
│       │   ├── generators/        # init, app (with files/ templates) and shared builders
│       │   ├── shared/            # CLI resolution and spawning
│       │   └── utils/             # package versions added by init
│       ├── executors.json
│       ├── generators.json
│       └── README.md
├── packages/                      # Reserved for future packages (empty)
├── openspec/                      # Spec-driven development artifacts
│   ├── config.yaml
│   ├── specs/                     # Binding capability specs
│   └── changes/archive/           # Completed changes
├── .github/workflows/             # ci, codeql and release-please
├── .git-hooks/                    # Versioned Git hooks (pre-commit, commit-msg, prepare-commit-msg)
├── .agents/ .claude/ .codex/      # AI agent configuration and Nx skills
│   .cursor/ .gemini/ .opencode/
├── nx.json                        # Nx configuration and inferred-target plugins
├── package.json                   # Workspace scripts and devDependencies
├── release-please-config.json     # Release Please packages
├── .release-please-manifest.json  # Current released versions
├── tsconfig.base.json
├── tsconfig.json                  # Solution file with project references
├── eslint.config.mjs
├── commitlint.config.js
└── AGENTS.md                      # Guide for AI agents working in this repo
```

## Requirements

- Node `>=22.22.3 <23` (see `.nvmrc`) and npm `>=10 <12`.

## Getting started

```bash
npm install
```

`postinstall` points Git at `.git-hooks`, so the hooks run on every commit.

## Scripts

| Command                 | What it does                                          |
| ----------------------- | ----------------------------------------------------- |
| `npm run test:ci`       | Runs every project's tests once.                      |
| `npm run test:coverage` | Runs every project's tests with coverage.             |
| `npm run typecheck`     | Checks Nx project references, then typechecks.        |
| `npm run lint`          | Lints every project.                                  |
| `npm run sonar`         | Runs the Sonar analysis, loading `.env.local` if set. |

Build a single plugin with `npm exec -- nx run <project>:build`, for example
`npm exec -- nx run nx-ionic-cordova:build`.

## Quality gates

- **pre-commit:** typecheck, tests with coverage, `lint --fix` and Prettier on staged files.
- **commit-msg:** Conventional Commits, enforced by commitlint.
- **CI** (`ci.yml`): `test`, `build` and `typecheck` on pull requests and on `main`.
- **CodeQL** (`codeql.yml`): on pushes and pull requests to `main` and `develop`.

## Branching and releases

- Work lands in `develop` through pull requests linked to an approved issue.
- `develop` is promoted to `main`. Release Please runs on `main` and opens a release PR and tag per package.
- Publishing to npm is manual (`npm publish` by the maintainer).

## License

[MIT](LICENSE)
