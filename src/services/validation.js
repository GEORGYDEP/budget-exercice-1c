/**
 * Service de validation des montants et du budget
 */

export class ValidationService {
  constructor() {
    this.tolerance = 0.01; // Tolérance pour les comparaisons de montants (1 centime)
  }

  /**
   * Compare deux montants avec tolérance
   */
  compareAmounts(amount1, amount2, tolerance = this.tolerance) {
    return Math.abs(amount1 - amount2) <= tolerance;
  }

  /**
   * Valide un montant dans une rubrique
   */
  validateBudgetItem(placedAmount, expectedAmount) {
    if (placedAmount === null || placedAmount === undefined) {
      return {
        isValid: false,
        error: 'no_amount',
        message: 'Aucun montant n\'a été placé'
      };
    }

    if (this.compareAmounts(placedAmount, expectedAmount)) {
      return {
        isValid: true,
        error: null,
        message: 'Montant correct'
      };
    }

    return {
      isValid: false,
      error: 'wrong_amount',
      message: `Montant incorrect. Attendu: ${this.formatAmount(expectedAmount)}€, Placé: ${this.formatAmount(placedAmount)}€`
    };
  }

  /**
   * Valide l'ensemble du budget
   */
  validateBudget(placedAmounts, expectedBudget) {
    const results = {
      isComplete: true,
      isCorrect: true,
      items: {},
      totals: {},
      errors: []
    };

    // Valider les entrées
    expectedBudget.entrees.forEach(item => {
      const validation = this.validateBudgetItem(
        placedAmounts[item.libelle],
        item.montantAttendu
      );
      
      results.items[item.libelle] = validation;
      
      if (!validation.isValid) {
        results.isCorrect = false;
        if (validation.error === 'no_amount') {
          results.isComplete = false;
        }
        results.errors.push({
          rubrique: item.libelle,
          type: 'entree',
          ...validation
        });
      }
    });

    // Valider les sorties fixes
    expectedBudget.sorties_fixes.forEach(item => {
      const validation = this.validateBudgetItem(
        placedAmounts[item.libelle],
        item.montantAttendu
      );
      
      results.items[item.libelle] = validation;
      
      if (!validation.isValid) {
        results.isCorrect = false;
        if (validation.error === 'no_amount') {
          results.isComplete = false;
        }
        results.errors.push({
          rubrique: item.libelle,
          type: 'sortie_fixe',
          ...validation
        });
      }
    });

    // Valider les sorties variables
    expectedBudget.sorties_variables.forEach(item => {
      const validation = this.validateBudgetItem(
        placedAmounts[item.libelle],
        item.montantAttendu
      );
      
      results.items[item.libelle] = validation;
      
      if (!validation.isValid) {
        results.isCorrect = false;
        if (validation.error === 'no_amount') {
          results.isComplete = false;
        }
        results.errors.push({
          rubrique: item.libelle,
          type: 'sortie_variable',
          ...validation
        });
      }
    });

    // Calculer les totaux
    results.totals = this.calculateTotals(placedAmounts, expectedBudget);

    return results;
  }

  /**
   * Calcule les totaux du budget
   */
  calculateTotals(placedAmounts, expectedBudget) {
    let totalEntrees = 0;
    let totalSorties = 0;

    // Calculer le total des entrées
    expectedBudget.entrees.forEach(item => {
      const amount = placedAmounts[item.libelle];
      if (amount !== null && amount !== undefined) {
        totalEntrees += amount;
      }
    });

    // Calculer le total des sorties (fixes + variables)
    [...expectedBudget.sorties_fixes, ...expectedBudget.sorties_variables].forEach(item => {
      const amount = placedAmounts[item.libelle];
      if (amount !== null && amount !== undefined) {
        totalSorties += amount;
      }
    });

    const solde = totalEntrees - totalSorties;
    const expectedSolde = expectedBudget.totaux.solde;

    return {
      entrees: {
        actual: totalEntrees,
        expected: expectedBudget.totaux.total_entrees,
        isCorrect: this.compareAmounts(totalEntrees, expectedBudget.totaux.total_entrees)
      },
      sorties: {
        actual: totalSorties,
        expected: expectedBudget.totaux.total_sorties,
        isCorrect: this.compareAmounts(totalSorties, expectedBudget.totaux.total_sorties)
      },
      solde: {
        actual: solde,
        expected: expectedSolde,
        isCorrect: this.compareAmounts(solde, expectedSolde),
        isPositive: solde > 0,
        isNegative: solde < 0,
        isBalanced: this.compareAmounts(solde, 0)
      }
    };
  }

  /**
   * Vérifie si un montant est valide (nombre positif)
   */
  isValidAmount(amount) {
    return typeof amount === 'number' && 
           !isNaN(amount) && 
           isFinite(amount) && 
           amount >= 0;
  }

  /**
   * Parse un montant depuis une chaîne
   */
  parseAmount(amountString) {
    if (typeof amountString === 'number') {
      return amountString;
    }

    // Nettoyer la chaîne
    const cleaned = String(amountString)
      .replace(/[^\d,.-]/g, '')  // Garder seulement chiffres, virgule, point et moins
      .replace(/,/g, '.');        // Remplacer virgule par point

    const parsed = parseFloat(cleaned);
    
    return this.isValidAmount(parsed) ? parsed : null;
  }

  /**
   * Formate un montant pour l'affichage
   */
  formatAmount(amount, decimals = 2) {
    if (!this.isValidAmount(amount)) {
      return '0.00';
    }
    return amount.toFixed(decimals);
  }

  /**
   * Calcule le score basé sur la validation
   */
  calculateScore(validationResults, totalItems) {
    if (totalItems === 0) return 0;

    let correctItems = 0;
    Object.values(validationResults.items).forEach(item => {
      if (item.isValid) {
        correctItems++;
      }
    });

    return correctItems;
  }

  /**
   * Génère un rapport de validation
   */
  generateReport(validationResults) {
    const report = {
      summary: {
        isComplete: validationResults.isComplete,
        isCorrect: validationResults.isCorrect,
        errorCount: validationResults.errors.length
      },
      details: {
        correctItems: [],
        incorrectItems: [],
        missingItems: []
      },
      totals: validationResults.totals,
      recommendations: []
    };

    // Classer les items
    Object.entries(validationResults.items).forEach(([rubrique, validation]) => {
      if (validation.isValid) {
        report.details.correctItems.push(rubrique);
      } else if (validation.error === 'no_amount') {
        report.details.missingItems.push(rubrique);
      } else {
        report.details.incorrectItems.push(rubrique);
      }
    });

    // Générer des recommandations
    if (report.details.missingItems.length > 0) {
      report.recommendations.push('Complète toutes les rubriques manquantes');
    }
    if (report.details.incorrectItems.length > 0) {
      report.recommendations.push('Vérifie les montants incorrects');
    }
    if (!validationResults.totals.solde.isCorrect) {
      report.recommendations.push('Le solde n\'est pas correct, vérifie tes calculs');
    }

    return report;
  }

  /**
   * Vérifie si le budget est équilibré
   */
  isBudgetBalanced(totals) {
    return totals.solde.isBalanced || totals.solde.isPositive;
  }

  /**
   * Calcule le taux de complétion du budget
   */
  getCompletionRate(validationResults) {
    const totalItems = Object.keys(validationResults.items).length;
    if (totalItems === 0) return 0;

    const filledItems = Object.values(validationResults.items).filter(
      item => item.error !== 'no_amount'
    ).length;

    return Math.round((filledItems / totalItems) * 100);
  }

  /**
   * Calcule le taux de précision du budget
   */
  getAccuracyRate(validationResults) {
    const totalItems = Object.keys(validationResults.items).length;
    if (totalItems === 0) return 0;

    const correctItems = Object.values(validationResults.items).filter(
      item => item.isValid
    ).length;

    return Math.round((correctItems / totalItems) * 100);
  }
}
