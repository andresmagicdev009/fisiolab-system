import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validates an Ecuadorian national ID (cédula) using the modulo-10 algorithm.
 *
 * Rules:
 *  1. Must be exactly 10 digits.
 *  2. Province code (first 2 digits) must be 01–24.
 *  3. Third digit must be 0–5 (natural person).
 *  4. Weighted sum of first 9 digits must produce a check digit equal to digit 10.
 *
 * Coefficients: [2,1,2,1,2,1,2,1,2]
 * If product > 9 → subtract 9.
 * checkDigit = (sum % 10 === 0) ? 0 : 10 - (sum % 10)
 */
@ValidatorConstraint({ name: 'cedulaEcuatoriana', async: false })
export class CedulaEcuatorianaConstraint implements ValidatorConstraintInterface {
  validate(cedula: unknown, _args: ValidationArguments): boolean {
    if (typeof cedula !== 'string' || !/^\d{10}$/.test(cedula)) return false;

    const digits = cedula.split('').map(Number);

    const provinceCode = digits[0] * 10 + digits[1];
    if (provinceCode < 1 || provinceCode > 24) return false;

    if (digits[2] > 5) return false;

    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    const sum = coefficients.reduce((acc, coef, i) => {
      const product = digits[i] * coef;
      return acc + (product > 9 ? product - 9 : product);
    }, 0);

    const checkDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
    return checkDigit === digits[9];
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'La cédula ecuatoriana ingresada no es válida';
  }
}
