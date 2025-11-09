/**
 * Composant FinalSynthesis - Partie 4
 * Affiche uniquement le tableau budgétaire corrigé de septembre
 */
import { createElement, formatEuro, announce } from '../utils/dom.js';
import { resolveAssetUrl } from '../utils/assets.js';

export class FinalSynthesis {
  constructor(container) {
    this.container = container;
    this.budgetData = null;
    this.listeners = {};
  }

  async init() {
    try {
      // Load budget data only
      const budgetRes = await fetch(resolveAssetUrl('assets/data/budget.json'));
      this.budgetData = await budgetRes.json();

      this.render();
    } catch (error) {
      console.error('Erreur chargement partie 4:', error);
      this.container.innerHTML = '<p class="feedback-message error">Erreur de chargement</p>';
    }
  }

  render() {
    this.container.innerHTML = '';

    const layout = createElement('div', { className: 'final-synthesis-layout' });

    // Budget table
    const budgetSection = this.createBudgetTable();
    layout.appendChild(budgetSection);

    // Navigation button to Part 5
    const footer = createElement('div', { className: 'final-synthesis-footer' });
    const nextBtn = createElement('button', {
      className: 'btn btn-primary btn-large',
      onclick: () => this.emit('navigate-to-part5')
    }, 'Aller à la Partie 5 (questions) →');
    footer.appendChild(nextBtn);

    layout.appendChild(footer);
    this.container.appendChild(layout);

    announce('Partie 4 : Tableau corrigé de septembre');
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

  reset() {
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
