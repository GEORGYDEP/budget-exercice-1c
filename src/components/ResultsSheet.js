/**
 * Composant ResultsSheet - Écran final imprimable
 * Affiche les résultats détaillés avec toutes les informations
 */
import { createElement } from '../utils/dom.js';

export class ResultsSheet {
  constructor(container, scores, userData) {
    this.container = container;
    this.scores = scores;
    this.userData = userData;
  }

  render() {
    this.container.innerHTML = '';

    const sheet = createElement('div', { className: 'results-sheet' });

    // Header
    const header = this.createHeader();
    sheet.appendChild(header);

    // Student information
    const studentInfo = this.createStudentInfo();
    sheet.appendChild(studentInfo);

    // Scores breakdown
    const scoresSection = this.createScoresSection();
    sheet.appendChild(scoresSection);

    // Total score
    const totalSection = this.createTotalSection();
    sheet.appendChild(totalSection);

    // Message
    const messageSection = this.createMessageSection();
    sheet.appendChild(messageSection);

    // Actions (print button, restart button)
    const actions = this.createActions();
    sheet.appendChild(actions);

    // Footer
    const footer = this.createFooter();
    sheet.appendChild(footer);

    this.container.appendChild(sheet);
  }

  createHeader() {
    const header = createElement('div', { className: 'results-header' });

    header.appendChild(createElement('h2', { className: 'results-title' },
      'Résultats du jeu Budget-Ménage'));

    header.appendChild(createElement('p', { className: 'results-subtitle' },
      'Institut Saint-Louis Marie - ISTLM'));

    return header;
  }

  createStudentInfo() {
    const section = createElement('div', { className: 'results-student-info card' });

    section.appendChild(createElement('h3', { className: 'results-section-title' },
      'Informations du participant'));

    const infoGrid = createElement('div', { className: 'results-info-grid' });

    // Name
    const nameRow = createElement('div', { className: 'results-info-row' });
    nameRow.appendChild(createElement('span', { className: 'results-info-label' }, 'Nom complet :'));
    nameRow.appendChild(createElement('span', { className: 'results-info-value' },
      `${this.userData.firstName} ${this.userData.lastName}`));
    infoGrid.appendChild(nameRow);

    // Email
    const emailRow = createElement('div', { className: 'results-info-row' });
    emailRow.appendChild(createElement('span', { className: 'results-info-label' }, 'Adresse e-mail :'));
    emailRow.appendChild(createElement('span', { className: 'results-info-value' },
      this.userData.email));
    infoGrid.appendChild(emailRow);

    // Date and time
    const now = new Date();
    const dateTimeStr = now.toLocaleString('fr-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const dateRow = createElement('div', { className: 'results-info-row' });
    dateRow.appendChild(createElement('span', { className: 'results-info-label' }, 'Date et heure :'));
    dateRow.appendChild(createElement('span', { className: 'results-info-value' },
      dateTimeStr));
    infoGrid.appendChild(dateRow);

    section.appendChild(infoGrid);

    return section;
  }

  createScoresSection() {
    const section = createElement('div', { className: 'results-scores card' });

    section.appendChild(createElement('h3', { className: 'results-section-title' },
      'Scores détaillés'));

    const table = createElement('table', { className: 'results-table' });

    const thead = createElement('thead');
    const headerRow = createElement('tr');
    headerRow.appendChild(createElement('th', {}, 'Partie'));
    headerRow.appendChild(createElement('th', {}, 'Description'));
    headerRow.appendChild(createElement('th', {}, 'Score'));
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createElement('tbody');

    // Part 1
    const part1Row = createElement('tr');
    part1Row.appendChild(createElement('td', { className: 'results-part-number' }, 'Partie 1'));
    part1Row.appendChild(createElement('td', {}, 'Quiz introductif (identification des documents)'));
    part1Row.appendChild(createElement('td', { className: 'results-score-cell' },
      `${this.scores.part1} / 20`));
    tbody.appendChild(part1Row);

    // Part 2
    const part2Row = createElement('tr');
    part2Row.appendChild(createElement('td', { className: 'results-part-number' }, 'Partie 2'));
    part2Row.appendChild(createElement('td', {}, 'Dépenses (placement des montants dans le budget)'));
    part2Row.appendChild(createElement('td', { className: 'results-score-cell' },
      `${this.scores.part2} / 20`));
    tbody.appendChild(part2Row);

    // Part 3
    const part3Row = createElement('tr');
    part3Row.appendChild(createElement('td', { className: 'results-part-number' }, 'Partie 3'));
    part3Row.appendChild(createElement('td', {}, 'Revenus (placement des recettes)'));
    part3Row.appendChild(createElement('td', { className: 'results-score-cell' },
      `${this.scores.part3} / 5`));
    tbody.appendChild(part3Row);

    // Part 4
    const part5Row = createElement('tr');
    part5Row.appendChild(createElement('td', { className: 'results-part-number' }, 'Partie 5'));
    part5Row.appendChild(createElement('td', {}, 'Questions de synthèse'));
    part5Row.appendChild(createElement('td', { className: 'results-score-cell' },
      `${this.scores.part5} / 20`));
    tbody.appendChild(part5Row);

    table.appendChild(tbody);
    section.appendChild(table);

    return section;
  }

  createTotalSection() {
    const section = createElement('div', { className: 'results-total card' });

    const totalLabel = createElement('div', { className: 'results-total-label' }, 'Score Total');
    section.appendChild(totalLabel);

    const totalScore = createElement('div', { className: 'results-total-score' },
      `${this.scores.total} / 65`);
    section.appendChild(totalScore);

    // Percentage
    const percentage = Math.round((this.scores.total / 65) * 100);
    const percentageEl = createElement('div', { className: 'results-percentage' },
      `${percentage}%`);
    section.appendChild(percentageEl);

    return section;
  }

  createMessageSection() {
    const section = createElement('div', { className: 'results-message card' });

    const message = this.getEncouragementMessage(this.scores.total);

    section.appendChild(createElement('p', { className: 'results-message-text' }, message));

    return section;
  }

  getEncouragementMessage(score) {
    const percentage = (score / 80) * 100;

    if (percentage >= 90) {
      return "Excellent travail ! Tu maîtrises parfaitement la gestion d'un budget de ménage. Continue sur cette voie !";
    } else if (percentage >= 75) {
      return "Très bien ! Tu as une bonne compréhension de la gestion budgétaire. Quelques petits ajustements et ce sera parfait.";
    } else if (percentage >= 60) {
      return "Bien joué ! Tu as de bonnes bases en gestion de budget. Continue à t'entraîner pour améliorer tes compétences.";
    } else if (percentage >= 50) {
      return "Pas mal ! Tu as compris les concepts de base. Avec un peu plus de pratique, tu vas progresser rapidement.";
    } else {
      return "Continue à apprendre ! La gestion d'un budget demande de la pratique. N'hésite pas à refaire le jeu pour améliorer ton score.";
    }
  }

  createActions() {
    const actions = createElement('div', { className: 'results-actions no-print' });

    // Print button
    const printBtn = createElement('button', {
      className: 'btn btn-primary',
      onclick: () => window.print()
    }, '🖨 Imprimer les résultats');
    actions.appendChild(printBtn);

    // Restart button
    const restartBtn = createElement('button', {
      className: 'btn btn-secondary',
      id: 'restart-btn-results',
      onclick: () => this.handleRestart()
    }, '🔄 Recommencer le jeu');
    actions.appendChild(restartBtn);

    return actions;
  }

  createFooter() {
    const footer = createElement('div', { className: 'results-footer' });

    footer.appendChild(createElement('p', { className: 'results-footer-text' },
      'Ce document a été généré automatiquement à la fin du jeu Budget-Ménage ISTLM.'));

    return footer;
  }

  handleRestart() {
    // This will be handled by the App component
    const event = new CustomEvent('restart-game');
    window.dispatchEvent(event);
  }
}
