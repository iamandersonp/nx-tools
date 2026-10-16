# Changelog

## [1.0.1](https://github.com/iamandersonp/nx-tools/compare/nx-ionic-cordova-v1.0.0...nx-ionic-cordova-v1.0.1) (2026-10-16)


### Bug Fixes

* **nx-ionic-cordova:** normalize the bin path so npm publish stops warning ([742b954](https://github.com/iamandersonp/nx-tools/commit/742b954f6eaf22424650c1bffe6308b8ab7d4ea9))

## 1.0.0 (2026-10-16)


### Features

* **nx-ionic-cordova:** add current-major package versions and plugin entry matcher ([eefa1c4](https://github.com/iamandersonp/nx-tools/commit/eefa1c4c61ff90aa7c7fdd39b2e8177ae98ecda4))
* **nx-ionic-cordova:** add init generator that registers the plugin and adds packages ([43efce7](https://github.com/iamandersonp/nx-tools/commit/43efce743e359d17b1e7aa49a0042d381edb021a))
* **nx-ionic-cordova:** add ionic-hook target and script builders ([4a133c4](https://github.com/iamandersonp/nx-tools/commit/4a133c458eeeedd8fc7591dc30743af732f7a1a3))
* **nx-ionic-cordova:** add native and live-reload target builders ([daddb25](https://github.com/iamandersonp/nx-tools/commit/daddb25950b7e7d10411882e0e39dbf765eb62ad))
* **nx-ionic-cordova:** add native executor spawning CLIs through the resolver ([af77173](https://github.com/iamandersonp/nx-tools/commit/af77173893a0d5fda1ff3fd3af0d3039e5a267b9))
* **nx-ionic-cordova:** add the ionic-hook executor ([3243427](https://github.com/iamandersonp/nx-tools/commit/3243427ec8a8cae6b16d278f8f25dd2149a18bfe))
* **nx-ionic-cordova:** add the nx-ionic-hook bin ([d6ce4d5](https://github.com/iamandersonp/nx-tools/commit/d6ce4d53cd3b50f1e32b50849ff5ae6da0d580ec))
* **nx-ionic-cordova:** add the single source of executor ids ([fdc241b](https://github.com/iamandersonp/nx-tools/commit/fdc241b286ab9e5b5434440afe0c61f3943f4b6f))
* **nx-ionic-cordova:** detect running Android emulators through adb ([375c0d9](https://github.com/iamandersonp/nx-tools/commit/375c0d95b8e09eb738a33fafc61e9b6938d5671a))
* **nx-ionic-cordova:** generate the Ionic blank starter sources with the app generator ([bca5760](https://github.com/iamandersonp/nx-tools/commit/bca5760879e5334e20c22af1cb23732d3d7462ab))
* **nx-ionic-cordova:** generate the starter ESLint config so the lint target works ([118a1d2](https://github.com/iamandersonp/nx-tools/commit/118a1d2da2107e7cfea29b328d40484c9e161007))
* **nx-ionic-cordova:** normalize app options and build project.json from depth ([743c6aa](https://github.com/iamandersonp/nx-tools/commit/743c6aa04b93837ffb9cf6d2a142b52e5a173389))
* **nx-ionic-cordova:** normalize Ionic CLI arguments for nx run ([84dd0a4](https://github.com/iamandersonp/nx-tools/commit/84dd0a429b8579341cebb6a557baaa353b26b739))
* **nx-ionic-cordova:** port native argv builder and schema ([0394752](https://github.com/iamandersonp/nx-tools/commit/039475277499a6ee01aaa1f69427cc7bc2200fc2))
* **nx-ionic-cordova:** resolve and spawn CLIs through process.execPath ([dbc9702](https://github.com/iamandersonp/nx-tools/commit/dbc9702c8c07efc2ca053e7e48a51a68e3f04cea))
* **nx-ionic-cordova:** resolve the native executor cwd from the invoking project ([0c384c7](https://github.com/iamandersonp/nx-tools/commit/0c384c75f270faaaf3e8a3c7a5419f9edcf1d775))
* **nx-ionic-cordova:** scaffold app wiring files with the app generator ([e6b2e86](https://github.com/iamandersonp/nx-tools/commit/e6b2e86a46f89a9119a3193a8ed634b273d9b51f))
* **nx-ionic-cordova:** scaffold the plugin project and wire it into the workspace ([43da4b5](https://github.com/iamandersonp/nx-tools/commit/43da4b55c596cc01b97c022c6b062735327deb2b))
* **nx-ionic-cordova:** target the running Android emulator in the native executor ([695c466](https://github.com/iamandersonp/nx-tools/commit/695c466ded178565b269e50c6478a2d3f8759e17))


### Bug Fixes

* **nx-ionic-cordova:** add jest-preset-angular to the init devDependencies ([1a87fb2](https://github.com/iamandersonp/nx-tools/commit/1a87fb252a3a932853def0154f1151d33ec309dc))
* **nx-ionic-cordova:** declare build outputs and reset emitDeclarationOnly in generated app ([0cace19](https://github.com/iamandersonp/nx-tools/commit/0cace190e62e1c466f02d68e8137467ed1fb576a))
* **nx-ionic-cordova:** expose workspace binaries to spawned CLIs ([402c73d](https://github.com/iamandersonp/nx-tools/commit/402c73d4cb38d6f743510e12d2b98feee1262229))
* **nx-ionic-cordova:** install @angular/build and jest-environment-jsdom in init ([14fed9f](https://github.com/iamandersonp/nx-tools/commit/14fed9f807487c444af6e4b483f5a7c485bbce70))
* **nx-ionic-cordova:** make the generated test target run zoneless from the project root ([f8452e2](https://github.com/iamandersonp/nx-tools/commit/f8452e21274fb43b2be0513f90fff403fd88d6ee))
* **nx-ionic-cordova:** publish every schema the manifests reference ([26f46e3](https://github.com/iamandersonp/nx-tools/commit/26f46e3de19a0a956df41410e6c0bf68f52dcdce))
* **nx-ionic-cordova:** reject path-like app names and enable esModuleInterop for specs ([d003f4f](https://github.com/iamandersonp/nx-tools/commit/d003f4f31c97b10159e36fcf1da11c895a924250))
