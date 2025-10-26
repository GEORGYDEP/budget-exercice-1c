/**
 * Classe principale de l'application
 * Gère la navigation entre les parties et l'état global du jeu
 */
import { DocQuiz } from './components/DocQuiz.js';
import { BudgetBoard } from './components/BudgetBoard.js';
import { FinalQuiz } from './components/FinalQuiz.js';
import { ScoringService } from './services/scoring.js';
import { StorageService } from './services/storage.js';
import { announce } from './utils/dom.js';

export class App {
  constructor() {
    this.currentPart = 1;
    this.scores = {
      part1: 0,
      part2: 0,
      part3: 0,
      total: 0
    };
    
    this.scoringService = new ScoringService();
    this.storageService = new StorageService();
    
    this.docQuiz = null;
    this.budgetBoard = null;
    this.finalQuiz = null;
  }

  async init() {
    try {
      // Charger l'état sauvegardé si disponible
      const savedState = this.storageService.loadState();
      if (savedState && this.shouldRestoreState(savedState)) {
        this.restoreState(savedState);
      }

      // Initialiser les composants
      await this.initializeComponents();
      
      // Configurer les événements
      this.setupEventListeners();
      
      // Afficher la partie courante
      this.showPart(this.currentPart);
      
      announce('Application chargée. Commencez la partie 1 : Identifier les documents');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.showError('Une erreur est survenue lors du chargement de l\'application.');
    }
  }

  shouldRestoreState(savedState) {
    // Demander à l'utilisateur s'il veut reprendre sa session
    const daysSinceLastSave = (Date.now() - savedState.timestamp) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastSave < 7 && savedState.currentPart < 4) {
      return confirm('Voulez-vous reprendre votre session précédente ?');
    }
    return false;
  }

  restoreState(savedState) {
    this.currentPart = savedState.currentPart || 1;
    this.scores = savedState.scores || this.scores;
  }

  async initializeComponents() {
    // Partie 1: Quiz documents
    this.docQuiz = new DocQuiz(document.getElementById('doc-quiz-container'));
    await this.docQuiz.init();
    this.docQuiz.on('complete', (score) => {
      this.scores.part1 = score;
      this.updateProgress();
      this.saveState();
      setTimeout(() => this.nextPart(), 1000);
    });

    // Partie 2: Budget Board
    this.budgetBoard = new BudgetBoard(document.getElementById('budget-board-container'));
    await this.budgetBoard.init();
    this.budgetBoard.on('complete', (score) => {
      this.scores.part2 = score;
      this.updateProgress();
      this.saveState();
      setTimeout(() => this.nextPart(), 1000);
    });

    // Partie 3: Quiz final
    this.finalQuiz = new FinalQuiz(document.getElementById('final-quiz-container'));
    await this.finalQuiz.init();
    this.finalQuiz.on('complete', (score) => {
      this.scores.part3 = score;
      this.updateProgress();
      this.saveState();
      setTimeout(() => this.showResults(), 1000);
    });
  }

  setupEventListeners() {
    // Bouton recommencer
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restart());
    }

    // Sauvegarder l'état avant de quitter
    window.addEventListener('beforeunload', () => {
      if (this.currentPart < 4) {
        this.saveState();
      }
    });
  }

  showPart(partNumber) {
    // Cacher toutes les parties
    document.querySelectorAll('.game-part').forEach(part => {
      part.classList.remove('active');
    });

    // Afficher la partie demandée
    const part = document.getElementById(`part${partNumber}`);
    if (part) {
      part.classList.add('active');
      this.currentPart = partNumber;
      this.updateProgress();
      
      // Annoncer le changement pour l'accessibilité
      const partNames = {
        1: 'Partie 1 : Identifier les documents',
        2: 'Partie 2 : Compléter le budget',
        3: 'Partie 3 : Quiz de synthèse'
      };
      announce(partNames[partNumber] || 'Nouvelle partie');
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPart() {
    if (this.currentPart < 3) {
      this.showPart(this.currentPart + 1);
    }
  }

  showResults() {
    // Calculer le score total
    this.scores.total = this.scoringService.calculateTotalScore(
      this.scores.part1,
      this.scores.part2,
      this.scores.part3
    );

    // Cacher toutes les parties
    document.querySelectorAll('.game-part').forEach(part => {
      part.classList.remove('active');
    });

    // Afficher l'écran de résultats
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
      resultsSection.classList.add('active');
      this.renderResults();
      
      // Afficher le bouton recommencer
      const restartBtn = document.getElementById('restart-btn');
      if (restartBtn) {
        restartBtn.style.display = 'inline-flex';
      }
      
      announce(`Résultats finaux : Score total ${this.scores.total} sur 100`);
    }

    // Nettoyer l'état sauvegardé
    this.storageService.clearState();
  }

  renderResults() {
    const container = document.getElementById('results-container');
    if (!container) return;

    const { total, part1, part2, part3 } = this.scores;
    const message = this.scoringService.getScoreMessage(total);

    container.innerHTML = `
      <div class="results-summary">
        <div class="results-score">${total}/100</div>
        <p class="results-message">${message}</p>
      </div>

      <div class="results-breakdown grid grid-cols-3">
        <div class="results-part card">
          <h3 class="results-part-title">Partie 1</h3>
          <p class="text-sm text-secondary mb-md">Identifier les documents</p>
          <div class="results-part-score">${part1}/30</div>
        </div>

        <div class="results-part card">
          <h3 class="results-part-title">Partie 2</h3>
          <p class="text-sm text-secondary mb-md">Compléter le budget</p>
          <div class="results-part-score">${part2}/40</div>
        </div>

        <div class="results-part card">
          <h3 class="results-part-title">Partie 3</h3>
          <p class="text-sm text-secondary mb-md">Quiz de synthèse</p>
          <div class="results-part-score">${part3}/30</div>
        </div>
      </div>

      <div class="mt-xl text-center">
        <p class="text-lg text-secondary">
          ${this.getEncouragementMessage(total)}
        </p>
      </div>
    `;
  }

  getEncouragementMessage(score) {
    if (score >= 90) {
      return "🎉 Excellent travail ! Tu maîtrises parfaitement la gestion d'un budget.";
    } else if (score >= 75) {
      return "👏 Très bien ! Tu as une bonne compréhension de la gestion budgétaire.";
    } else if (score >= 60) {
      return "👍 Bien joué ! Continue à t'entraîner pour améliorer tes compétences.";
    } else if (score >= 50) {
      return "💪 Pas mal ! Réessaye pour améliorer ton score.";
    } else {
      return "📚 Continue à apprendre ! La gestion d'un budget demande de la pratique.";
    }
  }

  updateProgress() {
    // Calculer le pourcentage de progression
    let progress = 0;
    if (this.currentPart === 1) progress = 0;
    else if (this.currentPart === 2) progress = 33;
    else if (this.currentPart === 3) progress = 66;
    else progress = 100;

    // Mettre à jour la barre de progression
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    // Mettre à jour le texte de la partie courante
    const currentPartText = document.querySelector('.current-part');
    if (currentPartText && this.currentPart <= 3) {
      currentPartText.textContent = `Partie ${this.currentPart}/3`;
    }

    // Mettre à jour le score total
    const totalScore = this.scoringService.calculateTotalScore(
      this.scores.part1,
      this.scores.part2,
      this.scores.part3
    );
    
    const scoreDisplay = document.getElementById('total-score');
    if (scoreDisplay) {
      scoreDisplay.textContent = totalScore;
    }
  }

  saveState() {
    this.storageService.saveState({
      currentPart: this.currentPart,
      scores: this.scores,
      timestamp: Date.now()
    });
  }

  restart() {
    // Réinitialiser les scores
    this.scores = {
      part1: 0,
      part2: 0,
      part3: 0,
      total: 0
    };

    // Réinitialiser la partie courante
    this.currentPart = 1;

    // Réinitialiser les composants
    if (this.docQuiz) this.docQuiz.reset();
    if (this.budgetBoard) this.budgetBoard.reset();
    if (this.finalQuiz) this.finalQuiz.reset();

    // Cacher le bouton recommencer
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.style.display = 'none';
    }

    // Nettoyer le stockage
    this.storageService.clearState();

    // Afficher la première partie
    this.showPart(1);

    announce('Nouvelle session commencée');
  }

  showError(message) {
    const container = document.querySelector('.app-main');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'feedback-message error mb-lg';
      errorDiv.innerHTML = `
        <span class="icon-cross"></span>
        <span>${message}</span>
      `;
      container.insertBefore(errorDiv, container.firstChild);
    }
  }
}
