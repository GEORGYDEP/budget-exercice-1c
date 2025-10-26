/**
 * Service de calcul et gestion des scores
 */

export class ScoringService {
  constructor() {
    // Pondération des parties
    this.weights = {
      part1: 30, // Quiz documents
      part2: 40, // Budget
      part3: 30  // Quiz final
    };
  }

  /**
   * Calcule le score total sur 100
   */
  calculateTotalScore(part1Score, part2Score, part3Score) {
    return Math.round(part1Score + part2Score + part3Score);
  }

  /**
   * Calcule le score pour la partie 1 (Quiz documents)
   * @param {number} correctAnswers - Nombre de réponses correctes
   * @param {number} totalQuestions - Nombre total de questions
   * @returns {number} Score sur 30
   */
  calculatePart1Score(correctAnswers, totalQuestions) {
    if (totalQuestions === 0) return 0;
    return Math.round((correctAnswers / totalQuestions) * this.weights.part1);
  }

  /**
   * Calcule le score pour la partie 2 (Budget)
   * @param {number} correctItems - Nombre de montants corrects
   * @param {number} totalItems - Nombre total de rubriques
   * @param {boolean} balanceCorrect - Le solde est-il correct
   * @returns {number} Score sur 40
   */
  calculatePart2Score(correctItems, totalItems, balanceCorrect = true) {
    if (totalItems === 0) return 0;
    
    // 35 points pour les rubriques, 5 points pour le solde correct
    const itemsScore = (correctItems / totalItems) * 35;
    const balanceScore = balanceCorrect ? 5 : 0;
    
    return Math.round(itemsScore + balanceScore);
  }

  /**
   * Calcule le score pour la partie 3 (Quiz final)
   * @param {number} correctAnswers - Nombre de réponses correctes
   * @param {number} totalQuestions - Nombre total de questions
   * @returns {number} Score sur 30
   */
  calculatePart3Score(correctAnswers, totalQuestions) {
    if (totalQuestions === 0) return 0;
    return Math.round((correctAnswers / totalQuestions) * this.weights.part3);
  }

  /**
   * Retourne un message basé sur le score total
   */
  getScoreMessage(totalScore) {
    if (totalScore >= 90) {
      return 'Excellent ! Tu as une maîtrise exceptionnelle de la gestion budgétaire.';
    } else if (totalScore >= 75) {
      return 'Très bien ! Tu comprends bien les principes de gestion d\'un budget.';
    } else if (totalScore >= 60) {
      return 'Bien ! Continue à t\'entraîner pour améliorer tes compétences.';
    } else if (totalScore >= 50) {
      return 'Pas mal ! Avec un peu plus de pratique, tu vas progresser.';
    } else {
      return 'Continue à apprendre ! La gestion budgétaire demande de la pratique.';
    }
  }

  /**
   * Retourne une note basée sur le score (A, B, C, D, E)
   */
  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'E';
  }

  /**
   * Calcule le pourcentage de réussite
   */
  calculatePercentage(score, maxScore) {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Génère des statistiques détaillées
   */
  generateStats(scores) {
    const { part1, part2, part3, total } = scores;
    
    return {
      total: {
        score: total,
        maxScore: 100,
        percentage: this.calculatePercentage(total, 100),
        grade: this.getGrade(total)
      },
      parts: {
        documents: {
          score: part1,
          maxScore: this.weights.part1,
          percentage: this.calculatePercentage(part1, this.weights.part1)
        },
        budget: {
          score: part2,
          maxScore: this.weights.part2,
          percentage: this.calculatePercentage(part2, this.weights.part2)
        },
        quiz: {
          score: part3,
          maxScore: this.weights.part3,
          percentage: this.calculatePercentage(part3, this.weights.part3)
        }
      },
      strengths: this.identifyStrengths(scores),
      weaknesses: this.identifyWeaknesses(scores)
    };
  }

  /**
   * Identifie les points forts
   */
  identifyStrengths(scores) {
    const strengths = [];
    const { part1, part2, part3 } = scores;
    
    if (this.calculatePercentage(part1, this.weights.part1) >= 80) {
      strengths.push('Identification des documents');
    }
    if (this.calculatePercentage(part2, this.weights.part2) >= 80) {
      strengths.push('Gestion du budget');
    }
    if (this.calculatePercentage(part3, this.weights.part3) >= 80) {
      strengths.push('Compréhension globale');
    }
    
    return strengths;
  }

  /**
   * Identifie les points à améliorer
   */
  identifyWeaknesses(scores) {
    const weaknesses = [];
    const { part1, part2, part3 } = scores;
    
    if (this.calculatePercentage(part1, this.weights.part1) < 60) {
      weaknesses.push('Identification des documents');
    }
    if (this.calculatePercentage(part2, this.weights.part2) < 60) {
      weaknesses.push('Gestion du budget');
    }
    if (this.calculatePercentage(part3, this.weights.part3) < 60) {
      weaknesses.push('Compréhension globale');
    }
    
    return weaknesses;
  }
}
