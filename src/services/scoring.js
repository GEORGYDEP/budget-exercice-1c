/**
 * Service de calcul et gestion des scores
 */

export class ScoringService {
  constructor() {
    // Nouvelle pondération des parties (total /80)
    // Chaque partie est notée sur 20 points
    this.weights = {
      part1: 20, // Quiz documents (10 questions)
      part2: 20, // Dépenses (13 montants)
      part3: 20, // Revenus (2 montants)
      part4: 20  // Quiz final (questions de synthèse)
    };
  }

  /**
   * Calcule le score total sur 80 (4 parties × 20 points)
   */
  calculateTotalScore(part1Score, part2Score, part3Score, part4Score) {
    // Return with 1 decimal place
    return parseFloat((part1Score + part2Score + part3Score + part4Score).toFixed(1));
  }

  /**
   * Calcule le score pour la partie 1 (Quiz documents)
   * @param {number} correctAnswers - Nombre de réponses correctes
   * @param {number} totalQuestions - Nombre total de questions
   * @returns {number} Score sur 20 (avec 1 décimale)
   */
  calculatePart1Score(correctAnswers, totalQuestions) {
    if (totalQuestions === 0) return 0;
    const score = (correctAnswers / totalQuestions) * this.weights.part1;
    return parseFloat(score.toFixed(1));
  }

  /**
   * Calcule le score pour la partie 2 (Dépenses)
   * @param {number} correctItems - Nombre de montants corrects (sur 13)
   * @param {number} totalItems - Doit être 13 (nombre de dépenses)
   * @returns {number} Score sur 20 (avec 1 décimale)
   */
  calculatePart2Score(correctItems, totalItems = 13) {
    if (totalItems === 0) return 0;

    // Score basé uniquement sur le nombre de montants corrects
    // Formule: (montants corrects / 13) × 20
    const score = (correctItems / totalItems) * this.weights.part2;
    return parseFloat(score.toFixed(1));
  }

  /**
   * Calcule le score pour la partie 3 (Revenus)
   * @param {number} correctItems - Nombre de revenus corrects
   * @param {number} totalItems - Nombre total de revenus (2)
   * @returns {number} Score sur 20 (avec 1 décimale)
   */
  calculatePart3Score(correctItems, totalItems = 2) {
    if (totalItems === 0) return 0;
    const score = (correctItems / totalItems) * this.weights.part3;
    return parseFloat(score.toFixed(1));
  }

  /**
   * Calcule le score pour la partie 4 (Quiz final)
   * @param {number} correctAnswers - Nombre de réponses correctes
   * @param {number} totalQuestions - Nombre total de questions
   * @returns {number} Score sur 20 (avec 1 décimale)
   */
  calculatePart4Score(correctAnswers, totalQuestions) {
    if (totalQuestions === 0) return 0;
    const score = (correctAnswers / totalQuestions) * this.weights.part4;
    return parseFloat(score.toFixed(1));
  }

  /**
   * Retourne un message basé sur le score total (sur 80)
   */
  getScoreMessage(totalScore) {
    const percentage = (totalScore / 80) * 100;

    if (percentage >= 90) {
      return 'Excellent ! Tu as une maîtrise exceptionnelle de la gestion budgétaire.';
    } else if (percentage >= 75) {
      return 'Très bien ! Tu comprends bien les principes de gestion d\'un budget.';
    } else if (percentage >= 60) {
      return 'Bien ! Continue à t\'entraîner pour améliorer tes compétences.';
    } else if (percentage >= 50) {
      return 'Pas mal ! Avec un peu plus de pratique, tu vas progresser.';
    } else {
      return 'Continue à apprendre ! La gestion budgétaire demande de la pratique.';
    }
  }

  /**
   * Retourne une note basée sur le score (A, B, C, D, E)
   */
  getGrade(score, maxScore = 80) {
    const percentage = (score / maxScore) * 100;

    if (percentage >= 90) return 'A';
    if (percentage >= 75) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
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
    const { part1, part2, part3, part4, total } = scores;

    return {
      total: {
        score: total,
        maxScore: 80,
        percentage: this.calculatePercentage(total, 80),
        grade: this.getGrade(total, 80)
      },
      parts: {
        documents: {
          score: part1,
          maxScore: this.weights.part1,
          percentage: this.calculatePercentage(part1, this.weights.part1)
        },
        depenses: {
          score: part2,
          maxScore: this.weights.part2,
          percentage: this.calculatePercentage(part2, this.weights.part2)
        },
        revenus: {
          score: part3,
          maxScore: this.weights.part3,
          percentage: this.calculatePercentage(part3, this.weights.part3)
        },
        quiz: {
          score: part4,
          maxScore: this.weights.part4,
          percentage: this.calculatePercentage(part4, this.weights.part4)
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
    const { part1, part2, part3, part4 } = scores;

    if (this.calculatePercentage(part1, this.weights.part1) >= 80) {
      strengths.push('Identification des documents');
    }
    if (this.calculatePercentage(part2, this.weights.part2) >= 80) {
      strengths.push('Gestion des dépenses');
    }
    if (this.calculatePercentage(part3, this.weights.part3) >= 80) {
      strengths.push('Gestion des revenus');
    }
    if (this.calculatePercentage(part4, this.weights.part4) >= 80) {
      strengths.push('Compréhension globale');
    }

    return strengths;
  }

  /**
   * Identifie les points à améliorer
   */
  identifyWeaknesses(scores) {
    const weaknesses = [];
    const { part1, part2, part3, part4 } = scores;

    if (this.calculatePercentage(part1, this.weights.part1) < 60) {
      weaknesses.push('Identification des documents');
    }
    if (this.calculatePercentage(part2, this.weights.part2) < 60) {
      weaknesses.push('Gestion des dépenses');
    }
    if (this.calculatePercentage(part3, this.weights.part3) < 60) {
      weaknesses.push('Gestion des revenus');
    }
    if (this.calculatePercentage(part4, this.weights.part4) < 60) {
      weaknesses.push('Compréhension globale');
    }

    return weaknesses;
  }
}
