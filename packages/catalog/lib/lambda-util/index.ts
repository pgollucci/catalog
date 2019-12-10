export function env(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    } else {
      throw new Error(`${name} is required`);
    }
  }

  return value;
}