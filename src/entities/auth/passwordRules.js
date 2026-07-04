export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include 1 uppercase letter and 1 special character';

const PASSWORD_RULE_PATTERN = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export const validatePasswordStrength = (password) => {
  if (!PASSWORD_RULE_PATTERN.test(password || '')) {
    throw new Error(PASSWORD_RULE_MESSAGE);
  }
};
