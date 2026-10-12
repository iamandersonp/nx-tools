/**
 * Turns the effective scanner properties into the scanner's command-line
 * arguments: one `-D<key>=<value>` entry per property.
 *
 * Each entry is a single argv element, so a value holding a glob, a space
 * or an equals sign reaches the scanner unchanged; nothing here is quoted
 * or escaped because nothing is ever parsed by a shell.
 *
 * @param properties the effective scanner properties
 * @return one argument per property, in the properties' order
 */
export function toScannerArgs(properties: Readonly<Record<string, string>>): string[] {
  return Object.entries(properties).map(([key, value]) => `-D${key}=${value}`);
}
