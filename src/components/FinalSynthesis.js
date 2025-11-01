/**
 * Composant FinalSynthesis - Partie 4
 * Affiche le tableau budgétaire corrigé en haut (sticky) et les questions en dessous
 */
import { createElement, formatEuro, announce, wait, shuffle } from '../utils/dom.js';
import { ScoringService } from '../services/scoring.js';
import { resolveAssetUrl } from '../utils/assets.js';

export class FinalSynthesis {
  constructor(container) {
    this.container = container;
    this.budgetData = null;
    this.questions = [];
    this.currentQuestion = 0;
    this.answers = [];
    this.scoringService = new ScoringService();
    this.listeners = {};
  }

  async init() {
    try {
      // Load budget data and questions
      const [budgetRes, quizRes] = await Promise.all([
        fetch(resolveAssetUrl('assets/data/budget.json')),
        fetch(resolveAssetUrl('assets/data/quiz.json'))
      ]);

      this.budgetData = await budgetRes.json();
      const quizData = await quizRes.json();
      this.questions = quizData.partie3_final; // Use existing final quiz questions

      this.render();
    } catch (error) {
      console.error('Erreur chargement partie 4:', error);
      this.container.innerHTML = '<p class="feedback-message error">Erreur de chargement</p>';
    }
  }

  render() {
    this.container.innerHTML = '';

    const layout = createElement('div', { className: 'final-synthesis-layout' });

    // Sticky budget table at the top
    const budgetSection = this.createBudgetTable();
    layout.appendChild(budgetSection);

    // Questions section below
    const questionsSection = createElement('div', { className: 'final-questions-section' });

    if (this.currentQuestion < this.questions.length) {
      const questionCard = this.createQuestionCard(this.questions[this.currentQuestion]);
      questionsSection.appendChild(questionCard);
    } else {
      // All questions completed
      const completion = this.createCompletionScreen();
      questionsSection.appendChild(completion);
    }

    layout.appendChild(questionsSection);
    this.container.appendChild(layout);
  }

  createBudgetTable() {
    const section = createElement('div', { className: 'final-budget-sticky' });

    const header = createElement('div', { className: 'final-budget-header' });
    header.appendChild(createElement('h3', {}, 'Budget corrigé - Septembre'));
    header.appendChild(createElement('p', { className: 'text-sm text-secondary' },
      'Utilise ce tableau pour répondre aux questions ci-dessous'));
    section.appendChild(header);

    const tableContainer = createElement('div', { className: 'final-budget-tables' });

    // Left column: Recettes (Revenues)
    const revenuesCol = createElement('div', { className: 'final-budget-col' });
    revenuesCol.appendChild(this.createRevenuesTable());
    tableContainer.appendChild(revenuesCol);

    // Right column: Dépenses (Expenses)
    const expensesCol = createElement('div', { className: 'final-budget-col' });
    expensesCol.appendChild(this.createExpensesTable());
    tableContainer.appendChild(expensesCol);

    section.appendChild(tableContainer);

    // Totals summary
    const summary = this.createSummary();
    section.appendChild(summary);

    return section;
  }

  createRevenuesTable() {
    const container = createElement('div', { className: 'final-table-container' });

    const title = createElement('h4', { className: 'final-table-title' }, 'Recettes');
    container.appendChild(title);

    const table = createElement('table', { className: 'final-table' });

    const tbody = createElement('tbody');
    this.budgetData.entrees.forEach((item) => {
      const row = createElement('tr');
      row.appendChild(createElement('td', { className: 'final-table-label' }, item.libelle));
      row.appendChild(createElement('td', { className: 'final-table-amount' },
        formatEuro(item.montantAttendu)));
      tbody.appendChild(row);
    });

    // Total revenues
    const totalRow = createElement('tr', { className: 'final-table-total' });
    totalRow.appendChild(createElement('td', {}, 'Total Recettes'));
    totalRow.appendChild(createElement('td', {},
      formatEuro(this.budgetData.totaux.total_entrees)));
    tbody.appendChild(totalRow);

    table.appendChild(tbody);
    container.appendChild(table);

    return container;
  }

  createExpensesTable() {
    const container = createElement('div', { className: 'final-table-container' });

    const title = createElement('h4', { className: 'final-table-title' }, 'Dépenses');
    container.appendChild(title);

    const table = createElement('table', { className: 'final-table' });

    const tbody = createElement('tbody');

    // Fixed expenses
    const fixedHeader = createElement('tr', { className: 'final-table-section' });
    fixedHeader.appendChild(createElement('td', { colspan: '2' }, 'Sorties fixes'));
    tbody.appendChild(fixedHeader);

    this.budgetData.sorties_fixes.forEach((item) => {
      const row = createElement('tr');
      row.appendChild(createElement('td', { className: 'final-table-label' }, item.libelle));
      row.appendChild(createElement('td', { className: 'final-table-amount' },
        formatEuro(item.montantAttendu)));
      tbody.appendChild(row);
    });

    // Variable expenses
    const variableHeader = createElement('tr', { className: 'final-table-section' });
    variableHeader.appendChild(createElement('td', { colspan: '2' }, 'Sorties variables'));
    tbody.appendChild(variableHeader);

    this.budgetData.sorties_variables.forEach((item) => {
      const row = createElement('tr');
      row.appendChild(createElement('td', { className: 'final-table-label' }, item.libelle));
      row.appendChild(createElement('td', { className: 'final-table-amount' },
        formatEuro(item.montantAttendu)));
      tbody.appendChild(row);
    });

    // Total expenses
    const totalRow = createElement('tr', { className: 'final-table-total' });
    totalRow.appendChild(createElement('td', {}, 'Total Dépenses'));
    totalRow.appendChild(createElement('td', {},
      formatEuro(this.budgetData.totaux.total_sorties)));
    tbody.appendChild(totalRow);

    table.appendChild(tbody);
    container.appendChild(table);

    return container;
  }

  createSummary() {
    const summary = createElement('div', { className: 'final-budget-summary' });

    const solde = this.budgetData.totaux.solde;
    const soldeClass = solde >= 0 ? 'positive' : 'negative';

    summary.appendChild(createElement('div', { className: 'final-summary-item' },
      `Total Recettes: ${formatEuro(this.budgetData.totaux.total_entrees)}`));

    summary.appendChild(createElement('div', { className: 'final-summary-item' },
      `Total Dépenses: ${formatEuro(this.budgetData.totaux.total_sorties)}`));

    const soldeEl = createElement('div', {
      className: `final-summary-item final-summary-solde ${soldeClass}`
    }, `Solde (épargne): ${formatEuro(solde)}`);
    summary.appendChild(soldeEl);

    return summary;
  }

  createQuestionCard(question) {
    const card = createElement('div', { className: 'quiz-question' });

    // Header
    const header = createElement('div', { className: 'quiz-question-header' });
    header.appendChild(createElement('span', { className: 'quiz-question-number' },
      `Question ${this.currentQuestion + 1}/${this.questions.length}`));
    card.appendChild(header);

    // Question text
    card.appendChild(createElement('h3', { className: 'quiz-question-text' },
      question.question));

    // Shuffle options
    const indexedOptions = question.options.map((option, index) => ({
      option,
      originalIndex: index
    }));
    const shuffledOptions = shuffle(indexedOptions);

    // Options
    const optionsContainer = createElement('div', { className: 'quiz-options' });
    shuffledOptions.forEach((item) => {
      const optionElement = createElement('button', {
        className: 'quiz-option',
        onclick: () => this.selectOption(item.originalIndex, question)
      }, item.option);
      optionsContainer.appendChild(optionElement);
    });
    card.appendChild(optionsContainer);

    return card;
  }

  async selectOption(selectedIndex, question) {
    const isCorrect = selectedIndex === question.correctIndex;

    // Disable all options
    const options = this.container.querySelectorAll('.quiz-option');
    options.forEach((opt, idx) => {
      opt.classList.add('disabled');
      opt.disabled = true;

      // Find which option was clicked based on text content
      const optText = opt.textContent;
      const optIndex = question.options.findIndex(o => o === optText);

      if (optIndex === selectedIndex) {
        opt.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
      if (optIndex === question.correctIndex && !isCorrect) {
        opt.classList.add('correct');
      }
    });

    // Feedback
    const feedback = createElement('div', {
      className: `feedback-message ${isCorrect ? 'success' : 'error'}`
    }, question.explication);
    this.container.querySelector('.quiz-question').appendChild(feedback);

    // Record answer
    this.answers.push({
      questionId: question.id,
      selectedIndex,
      isCorrect
    });

    announce(isCorrect ? 'Bonne réponse' : 'Mauvaise réponse');

    // Move to next question
    await wait(2000);
    this.currentQuestion++;
    this.render();
  }

  createCompletionScreen() {
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    const score = this.scoringService.calculatePart4Score(correctAnswers, this.questions.length);

    const card = createElement('div', { className: 'card text-center' });
    card.appendChild(createElement('h3', { className: 'card-title' }, 'Partie 4 terminée !'));
    card.appendChild(createElement('p', { className: 'text-lg mb-md' },
      `Réponses correctes: ${correctAnswers}/${this.questions.length}`));
    card.appendChild(createElement('p', { className: 'text-xl font-bold' },
      `Score: ${score}/5`));
    card.appendChild(createElement('p', { className: 'text-secondary mt-md' },
      'Calcul des résultats finaux...'));

    announce(`Partie 4 terminée. Score: ${score} sur 5`);

    // Emit complete event with score
    setTimeout(() => {
      this.emit('complete', score);
    }, 1000);

    return card;
  }

  complete() {
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    const score = this.scoringService.calculatePart4Score(correctAnswers, this.questions.length);

    this.emit('complete', score);
  }

  reset() {
    this.currentQuestion = 0;
    this.answers = [];
    this.render();
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}
