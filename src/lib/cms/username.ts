export const USERNAME_RULES =
  "3 to 30 characters. Letters, numbers and single spaces only.";

const USERNAME_PATTERN = /^[A-Za-z0-9]+( [A-Za-z0-9]+)*$/;

export function validateUsername(raw: string): { value?: string; error?: string } {
  const value = raw.trim();
  if (value.length < 3 || value.length > 30) {
    return { error: "Use 3 to 30 characters." };
  }
  if (!USERNAME_PATTERN.test(value)) {
    return { error: "Use letters, numbers and single spaces only. No symbols or links." };
  }
  return { value };
}
