/**
 * Classe principale de l'application
 * Gère la navigation entre les parties et l'état global du jeu
 * Nouvelle version avec 4 parties + EmailGate
 */
import { EmailGate } from './components/EmailGate.js';
import { DocQuiz } from './components/DocQuiz.js';
import { BudgetBoard } from './components/BudgetBoard.js';
import { RevenueBoard } from './components/RevenueBoard.js';
import { FinalSynthesis } from './components/FinalSynthesis.js';
import { ResultsSheet } from './components/ResultsSheet.js';
import { ScoringService } from './services/scoring.js';
import { StorageService } from './services/storage.js';
import { announce } from './utils/dom.js';

export class App {
  constructor() {
    this.currentPart = 0; // 0 = email gate, 1-4 = game parts
    this.scores = {
      part1: 0,
      part2: 0,
      part3: 0,
      part4: 0,
      total: 0
    };
    this.userData = null;

    this.scoringService = new ScoringService();
    this.storageService = new StorageService();

    this.emailGate = null;
    this.docQuiz = null;
    this.budgetBoard = null;
    this.revenueBoard = null;
    this.finalSynthesis = null;
  }

  async init() {
    try {
      // Check if user is already authenticated in this session
      const savedUser = sessionStorage.getItem('budgetGame_user');
      if (savedUser) {
        this.userData = JSON.parse(savedUser);

        // Check if there's a saved game state
        const savedState = this.storageService.loadState();
        if (savedState && savedState.userData && savedState.userData.email === this.userData.email) {
          const shouldRestore = this.shouldRestoreState(savedState);
          if (shouldRestore) {
            this.restoreState(savedState);
          }
        }
      }

      // Initialize components
      await this.initializeComponents();

      // Setup event listeners
      this.setupEventListeners();

      // Show appropriate screen
      if (this.userData) {
        this.updateUserDisplay();
        this.showPart(this.currentPart || 1);
      } else {
        this.showEmailGate();
      }

      announce('Application chargée');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.showError('Une erreur est survenue lors du chargement de l\'application.');
    }
  }

  shouldRestoreState(savedState) {
    // Ask user if they want to restore their session
    const daysSinceLastSave = (Date.now() - savedState.timestamp) / (1000 * 60 * 60 * 24);

    if (daysSinceLastSave < 7 && savedState.currentPart > 0 && savedState.currentPart < 5) {
      return confirm('Voulez-vous reprendre votre session précédente ?');
    }
    return false;
  }

  restoreState(savedState) {
    this.currentPart = savedState.currentPart || 1;
    this.scores = savedState.scores || this.scores;
    this.userData = savedState.userData || this.userData;
  }

  async initializeComponents() {
    // Email Gate
    this.emailGate = new EmailGate(document.getElementById('email-gate-container'));
    this.emailGate.on('complete', (userData) => {
      this.userData = userData;
      this.updateUserDisplay();
      this.hideEmailGate();
      this.showPart(1);
      this.saveState();
    });

    // Partie 1: Quiz documents
    this.docQuiz = new DocQuiz(document.getElementById('doc-quiz-container'));
    await this.docQuiz.init();
    this.docQuiz.on('complete', (score) => {
      this.scores.part1 = score;
      this.updateProgress();
      this.saveState();
      setTimeout(() => this.nextPart(), 1000);
    });

    // Partie 2: Budget Board (Dépenses)
    this.budgetBoard = new BudgetBoard(document.getElementById('budget-board-container'));
    await this.budgetBoard.init();
    this.budgetBoard.on('progress', (progressData) => {
      this.updatePart2Progress(progressData);
    });
    this.budgetBoard.on('complete', (score) => {
      this.scores.part2 = score;
      this.updateProgress();
      this.saveState();
      setTimeout(() => this.nextPart(), 1000);
    });

    // Partie 3: Revenue Board (Revenus)
    this.revenueBoard = new RevenueBoard(document.getElementById('revenue-board-container'));
    await this.revenueBoard.init();
    this.revenueBoard.on('complete', (score) => {
      this.scores.part3 = score;
      this.updateProgress();
      this.saveState();
      setTimeout(() => this.nextPart(), 1000);
    });

    // Partie 4: Final Synthesis (Tableau + Questions)
    this.finalSynthesis = new FinalSynthesis(document.getElementById('final-synthesis-container'));
    await this.finalSynthesis.init();
    this.finalSynthesis.on('complete', (score) => {
      this.scores.part4 = score;
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

    // Listen for restart from results screen
    window.addEventListener('restart-game', () => this.restart());

    // Sauvegarder l'état avant de quitter
    window.addEventListener('beforeunload', () => {
      if (this.currentPart > 0 && this.currentPart < 5) {
        this.saveState();
      }
    });
  }

  showEmailGate() {
    // Hide all game parts
    document.querySelectorAll('.game-part').forEach(part => {
      part.classList.remove('active');
    });

    // Hide results
    document.getElementById('results').classList.remove('active');

    // Show email gate
    const emailGateSection = document.getElementById('email-gate');
    if (emailGateSection) {
      emailGateSection.classList.add('active');
      this.emailGate.init();
    }

    // Hide progress indicator
    const progressIndicator = document.querySelector('.progress-indicator');
    if (progressIndicator) {
      progressIndicator.style.display = 'none';
    }

    // Hide user name display
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
      userNameDisplay.style.display = 'none';
    }
  }

  hideEmailGate() {
    const emailGateSection = document.getElementById('email-gate');
    if (emailGateSection) {
      emailGateSection.classList.remove('active');
    }

    // Show progress indicator
    const progressIndicator = document.querySelector('.progress-indicator');
    if (progressIndicator) {
      progressIndicator.style.display = 'flex';
    }

    // Show user name display
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
      userNameDisplay.style.display = 'block';
    }
  }

  updateUserDisplay() {
    if (!this.userData) return;

    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
      userNameDisplay.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
      userNameDisplay.style.display = 'block';
    }
  }

  showPart(partNumber) {
    // Hide email gate
    const emailGateSection = document.getElementById('email-gate');
    if (emailGateSection) {
      emailGateSection.classList.remove('active');
    }

    // Hide all game parts
    document.querySelectorAll('.game-part').forEach(part => {
      part.classList.remove('active');
    });

    // Hide results
    document.getElementById('results').classList.remove('active');

    // Show the requested part
    const part = document.getElementById(`part${partNumber}`);
    if (part) {
      part.classList.add('active');
      this.currentPart = partNumber;
      this.updateProgress();

      // Announce the change for accessibility
      const partNames = {
        1: 'Partie 1 : Identifier les documents',
        2: 'Partie 2 : Compléter le budget (dépenses)',
        3: 'Partie 3 : Compléter le budget (revenus)',
        4: 'Partie 4 : Tableau et questions de synthèse'
      };
      announce(partNames[partNumber] || 'Nouvelle partie');

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPart() {
    if (this.currentPart < 4) {
      this.showPart(this.currentPart + 1);
    }
  }

  showResults() {
    // Calculate total score
    this.scores.total = this.scoringService.calculateTotalScore(
      this.scores.part1,
      this.scores.part2,
      this.scores.part3,
      this.scores.part4
    );

    // Hide all parts
    document.querySelectorAll('.game-part').forEach(part => {
      part.classList.remove('active');
    });

    // Hide email gate
    const emailGateSection = document.getElementById('email-gate');
    if (emailGateSection) {
      emailGateSection.classList.remove('active');
    }

    // Show results section
    const resultsSection = document.getElementById('results');
    if (resultsSection) {
      resultsSection.classList.add('active');
      this.renderResults();

      // Show restart button
      const restartBtn = document.getElementById('restart-btn');
      if (restartBtn) {
        restartBtn.style.display = 'inline-flex';
      }

      announce(`Résultats finaux : Score total ${this.scores.total} sur 65`);
    }

    // Mark as completed (part 5)
    this.currentPart = 5;

    // Save final state
    this.saveState();
  }

  renderResults() {
    const container = document.getElementById('results-container');
    if (!container) return;

    const resultsSheet = new ResultsSheet(container, this.scores, this.userData);
    resultsSheet.render();
  }

  updateProgress() {
    // Calculate progression percentage
    let progress = 0;
    if (this.currentPart === 0) progress = 0;
    else if (this.currentPart === 1) progress = 0;
    else if (this.currentPart === 2) progress = 25;
    else if (this.currentPart === 3) progress = 50;
    else if (this.currentPart === 4) progress = 75;
    else progress = 100;

    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    // Update current part text
    const currentPartText = document.querySelector('.current-part');
    if (currentPartText && this.currentPart >= 1 && this.currentPart <= 4) {
      currentPartText.textContent = `Partie ${this.currentPart}/4`;
    }

    // Update score display based on current part
    this.updateScoreDisplay();
  }

  updateScoreDisplay() {
    const scoreDisplay = document.getElementById('total-score');
    if (!scoreDisplay) return;

    // Show cumulative score and max based on completed parts
    let currentScore = 0;
    let maxScore = 0;

    if (this.currentPart >= 1) {
      currentScore += this.scores.part1;
      maxScore += 20;
    }
    if (this.currentPart >= 2) {
      currentScore += this.scores.part2;
      maxScore += 20;
    }
    if (this.currentPart >= 3) {
      currentScore += this.scores.part3;
      maxScore += 20;
    }
    if (this.currentPart >= 4) {
      currentScore += this.scores.part4;
      maxScore += 20;
    }

    if (this.currentPart === 5) {
      // Final results
      currentScore = this.scores.total;
      maxScore = 80;
    }

    // Format score with 1 decimal place
    const formattedScore = typeof currentScore === 'number' ? currentScore.toFixed(1) : currentScore;
    scoreDisplay.textContent = `${formattedScore}/${maxScore}`;
  }

  updatePart2Progress(progressData) {
    // Update progress bar to show document progression within Part 2
    // Base progress is 25% (after Part 1), add up to 25% more based on document progress
    const baseProgress = 25;
    const part2Progress = (progressData.current / progressData.total) * 25;
    const totalProgress = baseProgress + part2Progress;

    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = `${totalProgress}%`;
    }

    // Update text to show document progress
    const currentPartText = document.querySelector('.current-part');
    if (currentPartText) {
      currentPartText.textContent = `Partie 2 - Document ${progressData.current}/${progressData.total}`;
    }
  }

  saveState() {
    if (!this.userData) return;

    this.storageService.saveState({
      currentPart: this.currentPart,
      scores: this.scores,
      userData: this.userData,
      timestamp: Date.now()
    });
  }

  restart() {
    // Confirm restart
    const confirmed = confirm('Es-tu sûr de vouloir recommencer ? Toute ta progression sera perdue.');
    if (!confirmed) return;

    // Reset scores
    this.scores = {
      part1: 0,
      part2: 0,
      part3: 0,
      part4: 0,
      total: 0
    };

    // Reset current part
    this.currentPart = 0;

    // Clear user data
    this.userData = null;
    sessionStorage.removeItem('budgetGame_user');

    // Reset components
    if (this.docQuiz) this.docQuiz.reset();
    if (this.budgetBoard) this.budgetBoard.reset();
    if (this.revenueBoard) this.revenueBoard.reset();
    if (this.finalSynthesis) this.finalSynthesis.reset();

    // Hide restart button
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.style.display = 'none';
    }

    // Clear storage
    this.storageService.clearState();

    // Show email gate again
    this.showEmailGate();

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
