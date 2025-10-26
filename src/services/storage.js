/**
 * Service de persistance des données avec localStorage
 */

const STORAGE_KEY = 'budget-menage-jeu';
const STORAGE_VERSION = '1.0';

export class StorageService {
  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  /**
   * Vérifie si localStorage est disponible
   */
  checkAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage non disponible:', e);
      return false;
    }
  }

  /**
   * Sauvegarde l'état du jeu
   */
  saveState(state) {
    if (!this.isAvailable) return false;

    try {
      const data = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        state: state
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde:', e);
      return false;
    }
  }

  /**
   * Charge l'état du jeu
   */
  loadState() {
    if (!this.isAvailable) return null;

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;

      const parsed = JSON.parse(data);
      
      // Vérifier la version
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Version de sauvegarde incompatible');
        this.clearState();
        return null;
      }

      return parsed.state;
    } catch (e) {
      console.error('Erreur lors du chargement:', e);
      return null;
    }
  }

  /**
   * Efface l'état sauvegardé
   */
  clearState() {
    if (!this.isAvailable) return false;

    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Erreur lors de la suppression:', e);
      return false;
    }
  }

  /**
   * Sauvegarde les réponses d'un quiz
   */
  saveQuizAnswers(quizId, answers) {
    const key = `${STORAGE_KEY}_quiz_${quizId}`;
    if (!this.isAvailable) return false;

    try {
      localStorage.setItem(key, JSON.stringify(answers));
      return true;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des réponses:', e);
      return false;
    }
  }

  /**
   * Charge les réponses d'un quiz
   */
  loadQuizAnswers(quizId) {
    const key = `${STORAGE_KEY}_quiz_${quizId}`;
    if (!this.isAvailable) return null;

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erreur lors du chargement des réponses:', e);
      return null;
    }
  }

  /**
   * Sauvegarde l'état du budget
   */
  saveBudgetState(budgetData) {
    const key = `${STORAGE_KEY}_budget`;
    if (!this.isAvailable) return false;

    try {
      localStorage.setItem(key, JSON.stringify(budgetData));
      return true;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde du budget:', e);
      return false;
    }
  }

  /**
   * Charge l'état du budget
   */
  loadBudgetState() {
    const key = `${STORAGE_KEY}_budget`;
    if (!this.isAvailable) return null;

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erreur lors du chargement du budget:', e);
      return null;
    }
  }

  /**
   * Sauvegarde les préférences utilisateur
   */
  savePreferences(preferences) {
    const key = `${STORAGE_KEY}_preferences`;
    if (!this.isAvailable) return false;

    try {
      localStorage.setItem(key, JSON.stringify(preferences));
      return true;
    } catch (e) {
      console.error('Erreur lors de la sauvegarde des préférences:', e);
      return false;
    }
  }

  /**
   * Charge les préférences utilisateur
   */
  loadPreferences() {
    const key = `${STORAGE_KEY}_preferences`;
    if (!this.isAvailable) return null;

    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erreur lors du chargement des préférences:', e);
      return null;
    }
  }

  /**
   * Efface toutes les données
   */
  clearAll() {
    if (!this.isAvailable) return false;

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEY)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.error('Erreur lors de l\'effacement:', e);
      return false;
    }
  }

  /**
   * Obtient la taille utilisée par le stockage (en octets)
   */
  getStorageSize() {
    if (!this.isAvailable) return 0;

    try {
      let total = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEY)) {
          const item = localStorage.getItem(key);
          if (item) {
            total += item.length + key.length;
          }
        }
      });
      return total;
    } catch (e) {
      console.error('Erreur lors du calcul de la taille:', e);
      return 0;
    }
  }

  /**
   * Exporte les données en JSON
   */
  exportData() {
    if (!this.isAvailable) return null;

    try {
      const data = {};
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEY)) {
          data[key] = localStorage.getItem(key);
        }
      });
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error('Erreur lors de l\'export:', e);
      return null;
    }
  }

  /**
   * Importe des données depuis JSON
   */
  importData(jsonData) {
    if (!this.isAvailable) return false;

    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith(STORAGE_KEY)) {
          localStorage.setItem(key, value);
        }
      });
      return true;
    } catch (e) {
      console.error('Erreur lors de l\'import:', e);
      return false;
    }
  }
}
