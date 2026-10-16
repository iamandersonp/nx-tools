/**
 * Options accepted by the `app` generator.
 */
export interface AppGeneratorSchema {
  /** The Nx project name. */
  name: string;
  /** The reverse-DNS application id written to `config.xml` as the widget id. */
  appId: string;
  /** The directory the application is generated under. Defaults to `apps`. */
  directory?: string;
  /** The name shown on-device. Defaults to `name`. */
  displayName?: string;
  /** The Angular selector prefix. Defaults to `app`. */
  prefix?: string;
  /** Comma-separated Nx project tags. */
  tags?: string;
  /** Skips formatting the generated files. */
  skipFormat?: boolean;
}
