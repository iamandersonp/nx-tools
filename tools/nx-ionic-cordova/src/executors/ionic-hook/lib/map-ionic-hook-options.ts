/** The Ionic CLI hook arguments the mapping needs. */
export interface IonicHookMappingInput {
  hook: 'build' | 'serve';
  /** Present for a Cordova build or live-reload serve. */
  platform?: string;
  /** The Nx configuration to run the mapped target under. */
  configuration?: string;
  /** Forwarded for `serve` only. */
  host?: string;
  /** Forwarded for `serve` only. */
  port?: number;
}

/** The Nx target to run in place of the Ionic CLI's own `ng run` call. */
export interface MappedIonicHookTarget {
  target: string;
  configuration?: string;
  options: Record<string, string | number>;
}

/**
 * Maps an Ionic CLI hook call to an Nx target.
 *
 * A build with a platform runs `ionic-cordova-build` (which requires `platform`); without one, `build`.
 * A serve runs `serve` and forwards only `host` and `port`; with a platform it runs the `live-<platform>`
 * configuration, so the device loads the Cordova runtime from the dev-server it live-reloads from.
 *
 * @throws {Error} when a serve carries both a platform and a configuration, because Nx applies one
 *   configuration per run and `live-<platform>` occupies it
 */
export function mapIonicHookToNxTarget(input: IonicHookMappingInput): MappedIonicHookTarget {
  if (input.hook === 'serve') {
    return mapServeHook(input);
  }

  const options: Record<string, string> = {};
  if (input.platform) {
    options.platform = input.platform;
  }
  return { target: input.platform ? 'ionic-cordova-build' : 'build', configuration: input.configuration, options };
}

function mapServeHook(input: IonicHookMappingInput): MappedIonicHookTarget {
  const options: Record<string, string | number> = {};
  if (input.host) {
    options.host = input.host;
  }
  if (input.port) {
    options.port = input.port;
  }

  if (!input.platform) {
    return { target: 'serve', configuration: input.configuration, options };
  }

  const live = `live-${input.platform}`;
  if (input.configuration) {
    throw new Error(
      `Live reload serves the '${live}' configuration only; the requested '${input.configuration}' configuration cannot be combined with --platform.`
    );
  }
  return { target: 'serve', configuration: live, options };
}
