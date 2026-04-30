/**
 * Replaces {{key}} placeholders in a template string with values from vars.
 * Unknown placeholders are left unchanged.
 */
export function interpolate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key: string) => vars[key] ?? `{{${key}}}`
  );
}
