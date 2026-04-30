/**
 * interpolate
 *
 * Replaces every `{{key}}` placeholder in `template` with the corresponding
 * value from `vars`.  Unrecognised placeholders are left as-is so callers can
 * detect missing substitutions.
 *
 * @example
 * interpolate("Hello, {{name}}!", { name: "Ayaan" })
 * // => "Hello, Ayaan!"
 */
export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match;
  });
}
