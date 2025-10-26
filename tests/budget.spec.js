import { describe, it, expect } from 'vitest';
import { ValidationService } from '../src/services/validation.js';

describe('ValidationService', () => {
  it('devrait valider correctement un montant', () => {
    const service = new ValidationService();
    const result = service.validateBudgetItem(746.00, 746.00);
    expect(result.isValid).toBe(true);
  });

  it('devrait détecter un montant incorrect', () => {
    const service = new ValidationService();
    const result = service.validateBudgetItem(700.00, 746.00);
    expect(result.isValid).toBe(false);
  });
});
