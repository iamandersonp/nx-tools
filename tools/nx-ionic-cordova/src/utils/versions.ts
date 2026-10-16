/** Angular 22 runtime packages an app imports. */
const ANGULAR_RANGE = '^22.0.0';

/** Packages the app ships: they go to the root `dependencies`. */
export const RUNTIME_DEPENDENCIES: Readonly<Record<string, string>> = {
  '@angular/common': ANGULAR_RANGE,
  '@angular/compiler': ANGULAR_RANGE,
  '@angular/core': ANGULAR_RANGE,
  '@angular/forms': ANGULAR_RANGE,
  '@angular/platform-browser': ANGULAR_RANGE,
  '@angular/router': ANGULAR_RANGE,
  '@ionic/angular': '^9.0.0',
  ionicons: '^8.1.0',
  rxjs: '~7.8.0',
  tslib: '^2.3.0'
};

/** Build, test and native tooling: it goes to the root `devDependencies`. */
export const DEV_DEPENDENCIES: Readonly<Record<string, string>> = {
  '@angular-builders/jest': '^22.0.0',
  '@angular-devkit/build-angular': ANGULAR_RANGE,
  '@angular-eslint/builder': '^22.0.0',
  '@angular/cli': ANGULAR_RANGE,
  '@angular/compiler-cli': ANGULAR_RANGE,
  '@ionic/angular-toolkit': '^13.0.0',
  '@ionic/cli': '^7.2.0',
  '@ionic/cordova-builders': '^13.0.0',
  cordova: '^13.0.0',
  'cordova-res': '^0.15.4',
  jest: '^30.0.0',
  'native-run': '^2.0.0',
  typescript: '~6.0.0'
};
