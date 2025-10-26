import { describe, it, expect } from 'vitest';
import { ScoringService } from '../src/services/scoring.js';

describe('Quiz Final Scoring', () => {
  it('devrait calculer le score sur 30', () => {
    const service = new ScoringService();
    const score = service.calculatePart3Score(5, 5);
    expect(score).toBe(30);
  });
});
