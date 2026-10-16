/**
 * The npm name of this plugin. A spec keeps it equal to `package.json#name`,
 * so every executor id below stays in step with the published package.
 */
export const PLUGIN_NAME = '@iamandersonp/nx-ionic-cordova';

/** The executor that runs one native Cordova CLI command for an app. */
export const NATIVE_EXECUTOR = `${PLUGIN_NAME}:native`;

/** The executor that maps an Ionic CLI hook to an Nx target. */
export const IONIC_HOOK_EXECUTOR = `${PLUGIN_NAME}:ionic-hook`;
