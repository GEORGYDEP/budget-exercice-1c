/**
 * Composant Budget Board - Partie 2
 * Drag & Drop pour compléter le budget
 */
import { createElement, formatEuro, announce } from '../utils/dom.js';
import { ValidationService } from '../services/validation.js';
import { ScoringService } from '../services/scoring.js';
import { resolveAssetUrl } from '../utils/assets.js';

export class BudgetBoard {
  constructor(container) {
    this.container = container;
    this.budgetData = null;
    this.documents = [];
    this.placedAmounts = {};
    this.validationService = new ValidationService();
    this.scoringService = new ScoringService();
    this.listeners = {};
    this.isValidated = false;
  }

  async init() {
    try {
      const [budgetRes, docsRes] = await Promise.all([
        fetch(resolveAssetUrl('assets/data/budget.json')),
        fetch(resolveAssetUrl('assets/data/documents.json'))
      ]);

      this.budgetData = await budgetRes.json();
      const documentsData = await docsRes.json();
      this.documents = documentsData.map(doc => ({
        ...doc,
        imagePath: doc.imagePath ? resolveAssetUrl(doc.imagePath) : null
      }));
      
      this.render();
    } catch (error) {
      console.error('Erreur chargement budget:', error);
      this.container.innerHTML = '<p class="feedback-message error">Erreur lors du chargement</p>';
    }
  }

  render() {
    this.container.innerHTML = '';
    
    const layout = createElement('div', { className: 'budget-layout' });
    
    // Galerie de documents (gauche)
    const gallery = this.createDocumentsGallery();
    layout.appendChild(gallery);
    
    // Tableau de budget (droite)
    const budgetTable = this.createBudgetTable();
    layout.appendChild(budgetTable);
    
    this.container.appendChild(layout);
    
    // Boutons d'action
    const actions = this.createActions();
    this.container.appendChild(actions);
  }

  createDocumentsGallery() {
    const gallery = createElement('div', { className: 'documents-gallery' });
    const title = createElement('h3', {}, 'Documents disponibles');
    gallery.appendChild(title);
    
    const grid = createElement('div', { className: 'documents-grid' });
    this.documents.forEach(doc => {
      const card = this.createDocumentCard(doc);
      grid.appendChild(card);
    });
    gallery.appendChild(grid);
    
    return gallery;
  }

  createDocumentCard(doc) {
    const card = createElement('article', {
      className: 'document-card',
      role: 'group',
      'aria-label': doc.titre
    });

    const preview = createElement('button', {
      className: 'document-card-preview',
      type: 'button',
      'aria-label': `Voir le document ${doc.titre}`,
      onclick: () => this.showDocumentDetail(doc)
    });

    if (doc.imagePath) {
      const img = createElement('img', {
        src: doc.imagePath,
        alt: doc.titre
      });

      img.addEventListener('error', () => {
        preview.innerHTML = '';
        preview.appendChild(this.createDocumentPlaceholder(doc));
      });

      preview.appendChild(img);
    } else {
      preview.appendChild(this.createDocumentPlaceholder(doc));
    }

    card.appendChild(preview);

    const label = createElement('div', { className: 'document-card-label' }, doc.titre);
    card.appendChild(label);

    if (doc.montants?.length) {
      const amounts = createElement('div', { className: 'document-card-amounts', role: 'list' });
      doc.montants.forEach((montant, index) => {
        const description = doc.libelles?.[index]
          ? `${doc.libelles[index]} - ${formatEuro(montant)}`
          : formatEuro(montant);
        const chip = createElement('button', {
          className: 'draggable-amount',
          type: 'button',
          draggable: 'true',
          role: 'listitem',
          'aria-label': `Glisser ${description}`,
          ondragstart: (e) => this.handleAmountDragStart(e, montant, doc),
          ondragend: (e) => e.currentTarget.classList.remove('dragging'),
          onclick: (e) => this.handleAmountQuickAssign(e, montant, doc)
        }, formatEuro(montant));

        chip.addEventListener('dragstart', (e) => e.currentTarget.classList.add('dragging'));
        amounts.appendChild(chip);
      });
      card.appendChild(amounts);
    }

    return card;
  }

  createBudgetTable() {
    const container = createElement('div', { className: 'budget-table-container' });
    const title = createElement('h3', {}, 'Budget du mois - Septembre');
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
    
    // Entrées
    tbody.appendChild(this.createSectionHeader('Entrées'));
    this.budgetData.entrees.forEach(item => {
      tbody.appendChild(this.createBudgetRow(item));
    });
    tbody.appendChild(this.createTotalRow('Total Entrées', 'total-entrees'));
    
    // Sorties fixes
    tbody.appendChild(this.createSectionHeader('Sorties fixes'));
    this.budgetData.sorties_fixes.forEach(item => {
      tbody.appendChild(this.createBudgetRow(item));
    });
    
    // Sorties variables
    tbody.appendChild(this.createSectionHeader('Sorties variables'));
    this.budgetData.sorties_variables.forEach(item => {
      tbody.appendChild(this.createBudgetRow(item));
    });
    tbody.appendChild(this.createTotalRow('Total Sorties', 'total-sorties'));
    
    // Solde
    tbody.appendChild(this.createBalanceRow());
    
    table.appendChild(tbody);
    container.appendChild(table);
    
    return container;
  }

  createSectionHeader(title) {
    const row = createElement('tr', { className: 'budget-section-header' });
    const cell = createElement('td', { colspan: '2' }, title);
    row.appendChild(cell);
    return row;
  }

  createBudgetRow(item) {
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
    amountCell.appendChild(dropZone);
    row.appendChild(amountCell);
    
    return row;
  }

  createTotalRow(label, id) {
    const row = createElement('tr', { className: 'budget-total-row' });
    row.appendChild(createElement('td', {}, label));
    const amountCell = createElement('td', { id: id }, '0,00 €');
    row.appendChild(amountCell);
    return row;
  }

  createBalanceRow() {
    const row = createElement('tr', { className: 'budget-balance-row', id: 'balance-row' });
    row.appendChild(createElement('td', {}, 'Solde'));
    const amountCell = createElement('td', { id: 'balance' }, '0,00 €');
    row.appendChild(amountCell);
    return row;
  }

  createActions() {
    const actions = createElement('div', { className: 'nav-buttons mt-xl' });
    
    const validateBtn = createElement('button', {
      className: 'btn btn-primary',
      onclick: () => this.validate()
    }, 'Valider le budget');
    
    const printBtn = createElement('button', {
      className: 'btn btn-secondary print-button',
      onclick: () => window.print()
    }, '🖨 Imprimer');
    
    actions.appendChild(validateBtn);
    actions.appendChild(printBtn);
    
    return actions;
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

    const amountValue = e.dataTransfer.getData('amount');
    const amount = parseFloat(amountValue);
    const sourceRubrique = e.dataTransfer.getData('sourceRubrique');
    const sourceDocId = e.dataTransfer.getData('docId');

    if (Number.isNaN(amount)) {
      announce('Montant indisponible pour ce déplacement.');
      return;
    }

    const dropZone = e.currentTarget;

    dropZone.innerHTML = '';
    const amountEl = createElement('div', {
      className: 'draggable-amount',
      draggable: 'true',
      ondragstart: (ev) => {
        ev.dataTransfer.setData('amount', amount);
        ev.dataTransfer.setData('sourceRubrique', item.libelle);
        if (sourceDocId) {
          ev.dataTransfer.setData('docId', sourceDocId);
        }
        ev.target.classList.add('dragging');
      },
      ondragend: (ev) => ev.target.classList.remove('dragging')
    }, formatEuro(amount));

    dropZone.appendChild(amountEl);
    dropZone.classList.add('filled');

    this.placedAmounts[item.libelle] = amount;

    if (sourceRubrique && sourceRubrique !== item.libelle) {
      delete this.placedAmounts[sourceRubrique];
      const sourceZone = this.container.querySelector(`[data-rubrique="${sourceRubrique}"]`);
      if (sourceZone) {
        sourceZone.innerHTML = '';
        sourceZone.classList.remove('filled', 'error');
      }
    }

    this.updateTotals();
  }

  showDocumentDetail(doc) {
    // Créer et afficher un modal avec les détails
    const modal = createElement('div', { className: 'modal-overlay' });
    const content = createElement('div', { className: 'modal-content' });
    const closeBtn = createElement('button', {
      className: 'modal-close',
      onclick: () => modal.remove()
    }, '×');

    if (doc.montants && doc.montants.length > 0) {
      const amounts = createElement('div', { className: 'modal-amounts mt-md' });
      doc.montants.forEach((montant, index) => {
        const description = doc.libelles?.[index]
          ? `${doc.libelles[index]} - ${formatEuro(montant)}`
          : formatEuro(montant);
        const drag = createElement('div', {
          className: 'draggable-amount',
          draggable: 'true',
          ondragstart: (e) => {
            e.dataTransfer.setData('amount', montant);
            e.dataTransfer.setData('docId', doc.id);
            e.target.classList.add('dragging');
          },
          ondragend: (e) => e.target.classList.remove('dragging')
        }, description);
        amounts.appendChild(drag);
      });
      content.appendChild(amounts);
    }

    if (doc.imagePath) {
      const img = createElement('img', { src: doc.imagePath, alt: doc.titre });
      img.addEventListener('error', () => {
        img.replaceWith(this.createDocumentPlaceholder(doc));
      });
      content.appendChild(img);
    } else {
      content.appendChild(this.createDocumentPlaceholder(doc));
    }
    content.appendChild(closeBtn);
    modal.appendChild(content);
    
    modal.onclick = (e) => e.target === modal && modal.remove();
    document.body.appendChild(modal);
  }

  handleAmountDragStart(event, montant, doc) {
    event.dataTransfer.setData('amount', montant);
    event.dataTransfer.setData('docId', doc.id);
  }

  handleAmountQuickAssign(event, montant, doc) {
    event.preventDefault();
    event.stopPropagation();

    const targetZone = this.findFirstEmptyDropZone();
    if (!targetZone) {
      announce('Toutes les rubriques sont déjà remplies.');
      return;
    }

    const rubrique = targetZone.getAttribute('data-rubrique');
    const budgetItem = this.findBudgetItemByLabel(rubrique);

    if (budgetItem) {
      const dataTransfer = typeof DataTransfer !== 'undefined'
        ? new DataTransfer()
        : {
            _data: {},
            setData(type, value) { this._data[type] = value; },
            getData(type) { return this._data[type] || ''; }
          };

      dataTransfer.setData('amount', montant);
      dataTransfer.setData('docId', doc.id);

      this.handleDrop({
        preventDefault: () => {},
        currentTarget: targetZone,
        dataTransfer
      }, budgetItem);
      announce(`${formatEuro(montant)} placé dans ${rubrique}`);
    }
  }

  findFirstEmptyDropZone() {
    return this.container.querySelector('.drop-zone:not(.filled)');
  }

  findBudgetItemByLabel(label) {
    const allItems = [
      ...this.budgetData.entrees,
      ...this.budgetData.sorties_fixes,
      ...this.budgetData.sorties_variables
    ];
    return allItems.find(item => item.libelle === label);
  }

  createDocumentPlaceholder(doc) {
    const placeholder = createElement('div', {
      className: 'document-placeholder',
      role: 'img',
      tabindex: '-1',
      'aria-label': doc.libelles?.join(', ') || doc.titre
    });

    const title = createElement('p', { className: 'document-placeholder-title' }, doc.titre);
    placeholder.appendChild(title);

    if (doc.libelles?.length) {
      const list = createElement('ul', { className: 'document-placeholder-list' });
      doc.libelles.forEach(libelle => list.appendChild(createElement('li', {}, libelle)));
      placeholder.appendChild(list);
    }

    if (doc.montants?.length) {
      const amounts = createElement('div', { className: 'document-placeholder-amounts' });
      doc.montants.forEach(montant => {
        amounts.appendChild(createElement('span', { className: 'draggable-amount is-static' }, formatEuro(montant)));
      });
      placeholder.appendChild(amounts);
    }

    return placeholder;
  }

  updateTotals() {
    let totalEntrees = 0;
    let totalSorties = 0;
    
    this.budgetData.entrees.forEach(item => {
      if (this.placedAmounts[item.libelle]) {
        totalEntrees += this.placedAmounts[item.libelle];
      }
    });
    
    [...this.budgetData.sorties_fixes, ...this.budgetData.sorties_variables].forEach(item => {
      if (this.placedAmounts[item.libelle]) {
        totalSorties += this.placedAmounts[item.libelle];
      }
    });
    
    const solde = totalEntrees - totalSorties;
    
    const entreesEl = document.getElementById('total-entrees');
    const sortiesEl = document.getElementById('total-sorties');
    const soldeEl = document.getElementById('balance');
    const balanceRow = document.getElementById('balance-row');
    
    if (entreesEl) entreesEl.textContent = formatEuro(totalEntrees);
    if (sortiesEl) sortiesEl.textContent = formatEuro(totalSorties);
    if (soldeEl) soldeEl.textContent = formatEuro(solde);
    
    if (balanceRow) {
      balanceRow.classList.remove('positive', 'negative');
      balanceRow.classList.add(solde >= 0 ? 'positive' : 'negative');
    }
  }

  validate() {
    const validation = this.validationService.validateBudget(this.placedAmounts, this.budgetData);
    
    if (!validation.isComplete) {
      announce('Budget incomplet. Complète toutes les rubriques.');
      alert('Veuillez compléter toutes les rubriques avant de valider.');
      return;
    }
    
    // Afficher les erreurs
    Object.entries(validation.items).forEach(([rubrique, result]) => {
      const dropZone = document.querySelector(`[data-rubrique="${rubrique}"]`);
      if (dropZone) {
        dropZone.classList.remove('error', 'filled');
        if (result.isValid) {
          dropZone.classList.add('filled');
        } else {
          dropZone.classList.add('error');
        }
      }
    });
    
    if (validation.isCorrect) {
      this.complete(validation);
    } else {
      announce(`${validation.errors.length} erreurs trouvées. Corrige-les et valide à nouveau.`);
      alert('Il y a des erreurs. Corrige les montants en rouge et valide à nouveau.');
    }
  }

  complete(validation) {
    const correctItems = Object.values(validation.items).filter(i => i.isValid).length;
    const totalItems = Object.keys(validation.items).length;
    
    this.score = this.scoringService.calculatePart2Score(
      correctItems,
      totalItems,
      validation.totals.solde.isCorrect
    );
    
    announce(`Partie 2 terminée ! Score: ${this.score} sur 40`);
    alert(`Bravo ! Ton budget est correct.\nScore: ${this.score}/40\nPassage à la partie 3...`);
    
    this.emit('complete', this.score);
  }

  reset() {
    this.placedAmounts = {};
    this.isValidated = false;
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
