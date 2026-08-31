export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 12;

export const PASSWORD_MESSAGES = {
  minLength: `A senha precisa ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`,
  maxLength: `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  uppercase: "A senha precisa ter pelo menos uma letra maiúscula.",
  number: "A senha precisa ter pelo menos um número.",
  specialCharacter: "A senha precisa ter pelo menos um caractere especial.",
} as const;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
const HAS_SPECIAL_CHARACTER = /[^\p{L}\p{N}\s]/u;

export function getPasswordValidationErrors(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) errors.push(PASSWORD_MESSAGES.minLength);
  if (password.length > PASSWORD_MAX_LENGTH) errors.push(PASSWORD_MESSAGES.maxLength);
  if (!HAS_UPPERCASE.test(password)) errors.push(PASSWORD_MESSAGES.uppercase);
  if (!HAS_NUMBER.test(password)) errors.push(PASSWORD_MESSAGES.number);
  if (!HAS_SPECIAL_CHARACTER.test(password)) errors.push(PASSWORD_MESSAGES.specialCharacter);

  return errors;
}

export function isPasswordValid(password: string): boolean {
  return getPasswordValidationErrors(password).length === 0;
}
