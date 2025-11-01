/**
 * Composant RevenueBoard - Partie 3
 * Permet de placer les 2 montants de revenus (même mécanique que BudgetBoard)
 */
import { createElement, formatEuro, announce } from '../utils/dom.js';
import { ValidationService } from '../services/validation.js';
import { ScoringService } from '../services/scoring.js';
import { resolveAssetUrl } from '../utils/assets.js';
import { initTouchDrag } from '../utils/touch-drag.js';

export class RevenueBoard {
  constructor(container) {
    this.container = container;
    this.budgetData = null;
    this.placedAmounts = {};
    this.validationService = new ValidationService();
    this.scoringService = new ScoringService();
    this.listeners = {};
    this.availableAmounts = [];
    this.usedAmountIds = new Set();
  }

  async init() {
    try {
      const budgetRes = await fetch(resolveAssetUrl('assets/data/budget.json'));
      this.budgetData = await budgetRes.json();

      // Setup available revenue amounts
      this.availableAmounts = this.budgetData.entrees.map((item, index) => ({
        id: `revenue-${index}`,
        value: item.montantAttendu,
        label: item.libelle
      }));

      this.render();
      initTouchDrag();
    } catch (error) {
      console.error('Erreur chargement revenus:', error);
      this.container.innerHTML = '<p class="feedback-message error">Erreur lors du chargement</p>';
    }
  }

  render() {
    this.container.innerHTML = '';

    const layout = createElement('div', { className: 'revenue-layout' });

    // Instructions
    const instructions = createElement('div', { className: 'revenue-instructions mb-lg' });
    instructions.appendChild(createElement('h3', {}, 'Place les revenus dans le tableau'));
    instructions.appendChild(createElement('p', { className: 'text-secondary' },
      'Glisse chaque montant vers la ligne correspondante. Chaque montant ne peut être utilisé qu\'une seule fois.'));
    layout.appendChild(instructions);

    const contentLayout = createElement('div', { className: 'revenue-content-layout' });

    // Left: Available amounts
    const amountsZone = this.createAmountsZone();
    contentLayout.appendChild(amountsZone);

    // Right: Revenue table
    const revenueTable = this.createRevenueTable();
    contentLayout.appendChild(revenueTable);

    layout.appendChild(contentLayout);

    // Validation button
    const actions = this.createActions();
    layout.appendChild(actions);

    this.container.appendChild(layout);
  }

  createAmountsZone() {
    const zone = createElement('div', { className: 'amounts-zone' });

    const title = createElement('h3', {}, 'Montants à placer');
    zone.appendChild(title);

    const amountsContainer = createElement('div', {
      className: 'amounts-container amounts-container-vertical',
      id: 'revenue-amounts-container'
    });

    // Display available amounts
    this.availableAmounts.forEach((amountObj) => {
      const dragAmount = createElement('div', {
        className: 'draggable-amount',
        draggable: 'true',
        dataset: {
          amount: String(amountObj.value),
          amountId: amountObj.id
        },
        ondragstart: (e) => {
          e.dataTransfer.setData('amount', String(amountObj.value));
          e.dataTransfer.setData('amountId', amountObj.id);
          e.target.classList.add('dragging');
        },
        ondragend: (e) => {
          e.target.classList.remove('dragging');
        }
      }, formatEuro(amountObj.value));
      amountsContainer.appendChild(dragAmount);
    });

    // Add drop zone support to bring amounts back
    amountsContainer.ondragover = (e) => e.preventDefault();
    amountsContainer.ondrop = (e) => {
      e.preventDefault();
      const amountData = e.dataTransfer.getData('amount');
      const amountId = e.dataTransfer.getData('amountId');
      const fromRubrique = e.dataTransfer.getData('rubrique');
      const fromPlaced = e.dataTransfer.getData('fromPlaced') === 'true';
      const amount = parseFloat(amountData);

      if (!isNaN(amount) && amountId) {
        // Remove from used IDs
        this.usedAmountIds.delete(amountId);

        // Remove from placed amounts
        if (fromPlaced && fromRubrique) {
          delete this.placedAmounts[fromRubrique];
        }

        // Add back to available amounts
        const alreadyAvailable = this.availableAmounts.some(a => a.id === amountId);
        if (!alreadyAvailable) {
          const originalAmount = this.budgetData.entrees.find(
            (item, index) => `revenue-${index}` === amountId
          );
          if (originalAmount) {
            const index = this.budgetData.entrees.indexOf(originalAmount);
            this.availableAmounts.push({
              id: amountId,
              value: amount,
              label: originalAmount.libelle
            });
          }
        }

        this.render();
      }
    };

    zone.appendChild(amountsContainer);

    const hint = createElement('p', {
      className: 'text-sm text-secondary mt-sm'
    }, 'Glisse les montants vers le tableau →');
    zone.appendChild(hint);

    return zone;
  }

  createRevenueTable() {
    const container = createElement('div', { className: 'budget-table-container' });

    const title = createElement('h3', {}, 'Recettes du mois - Septembre');
    container.appendChild(title);

    const table = createElement('table', { className: 'budget-table' });

    // Header
    const thead = createElement('thead');
    const headerRow = createElement('tr');
    headerRow.appendChild(createElement('th', {}, 'Rubrique'));
    headerRow.appendChild(createElement('th', {}, 'Montant (€)'));
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = createElement('tbody');

    // Revenue rows
    this.budgetData.entrees.forEach((item) => {
      tbody.appendChild(this.createRevenueRow(item));
    });

    table.appendChild(tbody);
    container.appendChild(table);

    return container;
  }

  createRevenueRow(item) {
    const row = createElement('tr');
    row.appendChild(createElement('td', { className: 'budget-row-label' }, item.libelle));

    const amountCell = createElement('td', { className: 'budget-row-amount' });
    const dropZone = createElement('div', {
      className: 'drop-zone',
      'data-rubrique': item.libelle,
      ondragover: (e) => this.handleDragOver(e),
      ondrop: (e) => this.handleDrop(e, item),
      ondragleave: (e) => this.handleDragLeave(e)
    });

    // Restore previously placed amount if exists
    const placedAmount = this.placedAmounts[item.libelle];
    if (placedAmount) {
      const amountEl = createElement('div', {
        className: 'draggable-amount amount-badge',
        draggable: 'true',
        dataset: {
          amount: String(placedAmount.value),
          amountId: placedAmount.id
        },
        ondragstart: (ev) => {
          ev.dataTransfer.setData('amount', String(placedAmount.value));
          ev.dataTransfer.setData('amountId', placedAmount.id);
          ev.dataTransfer.setData('fromPlaced', 'true');
          ev.dataTransfer.setData('rubrique', item.libelle);
          ev.target.classList.add('dragging');
        },
        ondragend: (ev) => ev.target.classList.remove('dragging')
      }, formatEuro(placedAmount.value));

      dropZone.appendChild(amountEl);
      dropZone.classList.add('filled');
    }

    amountCell.appendChild(dropZone);
    row.appendChild(amountCell);

    return row;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
  }

  handleDrop(e, item) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const amountData = e.dataTransfer.getData('amount');
    const amountId = e.dataTransfer.getData('amountId');
    const amount = parseFloat(amountData);

    if (isNaN(amount) || !amountId) {
      console.error('Montant invalide:', amountData);
      announce('Erreur: montant invalide');
      return;
    }

    const dropZone = e.currentTarget;
    const fromRubrique = e.dataTransfer.getData('rubrique');
    const fromPlaced = e.dataTransfer.getData('fromPlaced') === 'true';

    // If dropping on the same cell, do nothing
    if (fromPlaced && fromRubrique === item.libelle) {
      return;
    }

    // Check if this rubrique already has an amount (only one per line)
    if (this.placedAmounts[item.libelle] && !fromPlaced) {
      announce(`⚠️ Cette ligne contient déjà un montant.`);
      dropZone.classList.add('error');
      setTimeout(() => {
        dropZone.classList.remove('error');
        dropZone.classList.add('filled');
      }, 1000);
      return;
    }

    // Check if this amount ID is already used
    if (this.usedAmountIds.has(amountId) && !fromPlaced) {
      announce(`⚠️ Ce montant a déjà été utilisé.`);
      return;
    }

    // Remove from previous location
    if (fromPlaced && fromRubrique && fromRubrique !== item.libelle) {
      delete this.placedAmounts[fromRubrique];
      this.usedAmountIds.delete(amountId);
    } else if (!fromPlaced) {
      // Remove from available amounts
      const index = this.availableAmounts.findIndex(a => a.id === amountId);
      if (index > -1) {
        this.availableAmounts.splice(index, 1);
      }
    }

    // Add to new location
    this.placedAmounts[item.libelle] = {
      value: amount,
      id: amountId
    };

    this.usedAmountIds.add(amountId);

    this.render();
    this.checkCompletion();
  }

  createActions() {
    const actions = createElement('div', { className: 'nav-buttons mt-xl' });

    // Show validation button only if all amounts are placed
    const allPlaced = this.availableAmounts.length === 0 &&
                      Object.keys(this.placedAmounts).length === this.budgetData.entrees.length;

    if (allPlaced) {
      const validateBtn = createElement('button', {
        className: 'btn btn-primary',
        onclick: () => this.validate()
      }, 'Valider les revenus');
      actions.appendChild(validateBtn);
    } else {
      const message = createElement('p', {
        className: 'text-secondary text-center'
      }, 'Place tous les montants dans le tableau pour pouvoir valider.');
      actions.appendChild(message);
    }

    return actions;
  }

  checkCompletion() {
    // Auto-advance if all amounts are correctly placed
    if (this.availableAmounts.length === 0 &&
        Object.keys(this.placedAmounts).length === this.budgetData.entrees.length) {
      announce('Tous les montants sont placés. Tu peux maintenant valider.');
    }
  }

  validate() {
    // Check if all entries are correctly placed
    let correctCount = 0;
    const totalItems = this.budgetData.entrees.length;

    this.budgetData.entrees.forEach((item) => {
      const placed = this.placedAmounts[item.libelle];
      const dropZone = document.querySelector(`[data-rubrique="${item.libelle}"]`);

      if (dropZone) {
        dropZone.classList.remove('error', 'filled');

        if (placed && Math.abs(placed.value - item.montantAttendu) < 0.01) {
          dropZone.classList.add('filled');
          correctCount++;
        } else {
          dropZone.classList.add('error');
        }
      }
    });

    // Calculate score: 2.5 points per correct revenue (total 5 points)
    const score = this.scoringService.calculatePart3Score(correctCount, totalItems);

    if (correctCount === totalItems) {
      announce(`Partie 3 terminée ! Score: ${score} sur 5`);
      alert(`Félicitations ! Tu as placé tous les revenus correctement.\n\nScore: ${score}/5\n\nPassage à la partie 4...`);
      this.emit('complete', score);
    } else {
      announce(`Certains montants sont incorrects. Vérifie les cases en rouge.`);
      alert(`Attention : ${totalItems - correctCount} montant(s) incorrect(s).\n\nVérifie les cases en rouge et corrige-les avant de valider à nouveau.`);
    }
  }

  reset() {
    this.placedAmounts = {};
    this.usedAmountIds = new Set();
    this.availableAmounts = this.budgetData.entrees.map((item, index) => ({
      id: `revenue-${index}`,
      value: item.montantAttendu,
      label: item.libelle
    }));
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
