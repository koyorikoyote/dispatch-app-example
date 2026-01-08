/**
 * Validates and filters contact input to only allow digits, '+', '-', and spaces
 * @param value - The input string to validate
 * @returns Filtered string containing only valid characters
 */
export function filterContactInput(value: string): string {
  return value.replace(/[^0-9+\-\s]/g, "");
}
