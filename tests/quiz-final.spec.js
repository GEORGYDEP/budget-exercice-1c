import { describe, it, expect } from 'vitest';
import { ScoringService } from '../src/services/scoring.js';

describe('Part 3 Revenue Scoring (Binary)', () => {
  it('devrait retourner 5 si toutes les réponses sont correctes', () => {
    const service = new ScoringService();
    const score = service.calculatePart3Score(2, 2); // 2 revenues corrects sur 2
    expect(score).toBe(5);
  });

  it('devrait retourner 0 si une réponse est incorrecte', () => {
    const service = new ScoringService();
    const score = service.calculatePart3Score(1, 2); // 1 revenue correct sur 2
    expect(score).toBe(0);
  });

  it('devrait retourner 0 si aucune réponse est correcte', () => {
    const service = new ScoringService();
    const score = service.calculatePart3Score(0, 2); // 0 revenue correct sur 2
    expect(score).toBe(0);
  });
});
