/** Options accepted by the `ionic-hook` executor. */
export interface IonicHookExecutorSchema {
  /** Which Ionic CLI hook invoked this executor. */
  hook: 'build' | 'serve';
  /** The target platform (e.g. `android`, `ios`) forwarded by the Ionic CLI. */
  platform?: string;
  /** The dev-server host, used by the serve hook only. */
  host?: string;
  /** The dev-server port, used by the serve hook only. Numeric: Nx coerces `--port=8100`. */
  port?: number;
  /** The configuration the Ionic CLI requested; Nx reserves `--configuration` for the hook target itself. */
  buildConfiguration?: string;
}
