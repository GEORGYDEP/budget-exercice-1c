import { describe, it, expect } from 'vitest';
import { ScoringService } from '../src/services/scoring.js';

describe('Quiz Documents Scoring', () => {
  it('devrait calculer le score sur 20', () => {
    const service = new ScoringService();
    const score = service.calculatePart1Score(10, 10);
    expect(score).toBe(20);
  });

  it('devrait calculer 50% de bonnes réponses', () => {
    const service = new ScoringService();
    const score = service.calculatePart1Score(5, 10);
    expect(score).toBe(10);
  });
});
