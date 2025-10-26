/**
 * Composant Budget Board - Partie 2
 * Drag & Drop pour compléter le budget
 */
import { createElement, formatEuro, announce } from '../utils/dom.js';
import { ValidationService } from '../services/validation.js';
import { ScoringService } from '../services/scoring.js';
import { resolveAssetUrl } from '../utils/assets.js';
import { initTouchDrag } from '../utils/touch-drag.js';

export class BudgetBoard {
  constructor(container) {
    this.container = container;
    this.budgetData = null;
    this.documents = [];
    this.currentDocumentIndex = 0;
    this.placedAmounts = {};
    this.validatedDocuments = new Set();
    this.validationService = new ValidationService();
    this.scoringService = new ScoringService();
    this.listeners = {};
    this.isValidated = false;
    this.availableAmounts = []; // Track available amounts in the center zone
    this.autoValidateTimeout = null; // Track auto-validation timeout
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
        imagePath: resolveAssetUrl(doc.imagePath || `assets/images/page_${doc.pagePDF}.png`)
      }));

      this.render();
      this.emitProgress(); // Emit initial progress

      // Initialize touch drag support for tablets
      initTouchDrag();
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

    // Zone des montants (centre)
    const amountsZone = this.createAmountsZone();
    layout.appendChild(amountsZone);

    // Tableau de budget (droite)
    const budgetTable = this.createBudgetTable();
    layout.appendChild(budgetTable);

    this.container.appendChild(layout);

    // Boutons d'action
    const actions = this.createActions();
    this.container.appendChild(actions);

    // Restore totals after rendering
    this.updateTotals();
  }

  createDocumentsGallery() {
    const gallery = createElement('div', { className: 'documents-gallery' });

    // Progress indicator
    const progress = createElement('div', { className: 'document-progress' });
    const progressText = createElement('span', {},
      `Document ${this.currentDocumentIndex + 1} / ${this.documents.length}`
    );
    const progressBadge = createElement('span', {
      className: 'badge badge-info'
    }, `${this.validatedDocuments.size} classés`);
    progress.appendChild(progressText);
    progress.appendChild(progressBadge);
    gallery.appendChild(progress);

    // Current document
    if (this.currentDocumentIndex < this.documents.length) {
      const currentDoc = this.documents[this.currentDocumentIndex];
      const title = createElement('h3', {}, currentDoc.titre);
      gallery.appendChild(title);

      const preview = this.createDocumentPreviewLarge(currentDoc);
      gallery.appendChild(preview);

      // Update available amounts for the center zone
      if (currentDoc.montants && currentDoc.montants.length > 0) {
        this.availableAmounts = [...currentDoc.montants];
      } else {
        this.availableAmounts = [];
      }
    } else {
      const title = createElement('h3', {}, 'Tous les documents classés !');
      gallery.appendChild(title);
      const message = createElement('p', { className: 'text-secondary' },
        'Tu peux maintenant valider ton budget complet.'
      );
      gallery.appendChild(message);
      this.availableAmounts = [];
    }

    return gallery;
  }

  createDocumentPreviewLarge(doc) {
    const preview = createElement('div', { className: 'document-preview-large' });
    const img = createElement('img', {
      src: doc.imagePath,
      alt: doc.titre
    });
    preview.appendChild(img);
    return preview;
  }

  createAmountsZone() {
    const zone = createElement('div', { className: 'amounts-zone' });

    const title = createElement('h3', {}, 'Montants à placer');
    zone.appendChild(title);

    const amountsContainer = createElement('div', {
      className: 'amounts-container',
      id: 'amounts-container'
    });

    // Display available amounts
    this.availableAmounts.forEach((montant, index) => {
      const dragAmount = createElement('div', {
        className: 'draggable-amount',
        draggable: 'true',
        dataset: {
          amount: String(montant),
          amountIndex: String(index)
        },
        ondragstart: (e) => {
          e.dataTransfer.setData('amount', String(montant));
          e.dataTransfer.setData('amountIndex', String(index));
          e.target.classList.add('dragging');
        },
        ondragend: (e) => {
          e.target.classList.remove('dragging');
        }
      }, formatEuro(montant));
      amountsContainer.appendChild(dragAmount);
    });

    // Add drop zone support to bring amounts back
    amountsContainer.ondragover = (e) => e.preventDefault();
    amountsContainer.ondrop = (e) => {
      e.preventDefault();
      // Allow amounts to be returned to the source zone
      const amountData = e.dataTransfer.getData('amount');
      const amount = parseFloat(amountData);

      if (!isNaN(amount)) {
        // Add amount back to available amounts if not already there
        if (!this.availableAmounts.includes(amount)) {
          this.availableAmounts.push(amount);
          this.render();
        }
      }
    };

    zone.appendChild(amountsContainer);

    const hint = createElement('p', {
      className: 'text-sm text-secondary mt-sm'
    }, 'Glisse les montants vers le tableau de budget →');
    zone.appendChild(hint);

    return zone;
  }

  createDocumentCard(doc) {
    const card = createElement('div', { 
      className: 'document-card',
      onclick: () => this.showDocumentDetail(doc)
    });
    
    const img = createElement('img', {
      src: doc.imagePath,
      alt: doc.titre
    });
    card.appendChild(img);
    
    const label = createElement('div', { className: 'document-card-label' }, doc.titre);
    card.appendChild(label);
    
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

    // Restore previously placed amount if exists
    if (this.placedAmounts[item.libelle]) {
      const amount = this.placedAmounts[item.libelle];
      const amountEl = createElement('div', {
        className: 'draggable-amount',
        draggable: 'true',
        dataset: {
          amount: String(amount),
          amountIndex: ''
        },
        ondragstart: (ev) => {
          ev.dataTransfer.setData('amount', String(amount));
          ev.dataTransfer.setData('fromPlaced', 'true');
          ev.dataTransfer.setData('rubrique', item.libelle);
          ev.target.classList.add('dragging');
        },
        ondragend: (ev) => ev.target.classList.remove('dragging')
      }, formatEuro(amount));

      dropZone.appendChild(amountEl);
      dropZone.classList.add('filled');
    }

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

    // Show different actions based on progress
    if (this.currentDocumentIndex < this.documents.length) {
      // Auto-validation message instead of manual button
      const autoValidateMsg = createElement('p', {
        className: 'text-secondary text-center',
        id: 'auto-validate-message'
      }, 'Place les montants dans le tableau. La validation se fera automatiquement.');
      actions.appendChild(autoValidateMsg);

      // Skip document button (optional) - kept for user control
      const skipBtn = createElement('button', {
        className: 'btn btn-secondary',
        onclick: () => this.skipDocument()
      }, 'Passer ce document');
      actions.appendChild(skipBtn);
    } else {
      // Final validation button
      const validateAllBtn = createElement('button', {
        className: 'btn btn-success btn-large',
        onclick: () => this.validateFinal()
      }, 'Valider le budget complet');
      actions.appendChild(validateAllBtn);

      const printBtn = createElement('button', {
        className: 'btn btn-secondary print-button',
        onclick: () => window.print()
      }, '🖨 Imprimer');
      actions.appendChild(printBtn);
    }

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

    const amountData = e.dataTransfer.getData('amount');
    const amountIndex = e.dataTransfer.getData('amountIndex');
    const amount = parseFloat(amountData);

    // Validation: vérifier que le montant est un nombre valide
    if (isNaN(amount) || amount === null || amount === undefined) {
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

    // If there's already an amount in this target cell, return it to available amounts
    if (this.placedAmounts[item.libelle]) {
      const previousAmount = this.placedAmounts[item.libelle];
      // Only add back if it's not already in available amounts
      if (!this.availableAmounts.includes(previousAmount)) {
        this.availableAmounts.push(previousAmount);
      }
    }

    // Remove the amount from its previous location
    if (fromPlaced && fromRubrique && fromRubrique !== item.libelle) {
      // Moving from one budget cell to another
      delete this.placedAmounts[fromRubrique];
    } else if (!fromPlaced) {
      // Coming from available amounts - remove it from there
      const index = this.availableAmounts.indexOf(amount);
      if (index > -1) {
        this.availableAmounts.splice(index, 1);
      }
    }

    // Place the amount in the new cell
    dropZone.innerHTML = '';
    const amountEl = createElement('div', {
      className: 'draggable-amount',
      draggable: 'true',
      dataset: {
        amount: String(amount),
        amountIndex: ''
      },
      ondragstart: (ev) => {
        ev.dataTransfer.setData('amount', String(amount));
        ev.dataTransfer.setData('fromPlaced', 'true');
        ev.dataTransfer.setData('rubrique', item.libelle);
        ev.target.classList.add('dragging');
      },
      ondragend: (ev) => {
        ev.target.classList.remove('dragging');
      }
    }, formatEuro(amount));

    dropZone.appendChild(amountEl);
    dropZone.classList.add('filled');

    this.placedAmounts[item.libelle] = amount;

    this.updateTotals();
    this.render();

    // Check if we should auto-validate the current document
    this.checkAndAutoValidate();
  }

  showDocumentDetail(doc) {
    // Créer et afficher un modal avec les détails
    const modal = createElement('div', { className: 'modal-overlay' });
    const content = createElement('div', { className: 'modal-content' });
    const img = createElement('img', { src: doc.imagePath });
    const closeBtn = createElement('button', {
      className: 'modal-close',
      onclick: () => modal.remove()
    }, '×');
    
    // Ajouter montants disponibles
    if (doc.montants && doc.montants.length > 0) {
      const amounts = createElement('div', { className: 'mt-md' });
      doc.montants.forEach(montant => {
        const drag = createElement('div', {
          className: 'draggable-amount',
          draggable: 'true',
          ondragstart: (e) => {
            e.dataTransfer.setData('amount', String(montant));
            e.target.classList.add('dragging');
          },
          ondragend: (e) => e.target.classList.remove('dragging')
        }, formatEuro(montant));
        amounts.appendChild(drag);
      });
      content.appendChild(amounts);
    }
    
    content.appendChild(img);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    
    modal.onclick = (e) => e.target === modal && modal.remove();
    document.body.appendChild(modal);
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

  checkAndAutoValidate() {
    // Clear any existing timeout
    if (this.autoValidateTimeout) {
      clearTimeout(this.autoValidateTimeout);
      this.autoValidateTimeout = null;
    }

    // Check if all amounts from current document have been placed
    if (this.currentDocumentIndex >= this.documents.length) {
      return; // No more documents to validate
    }

    const currentDoc = this.documents[this.currentDocumentIndex];

    // Check if all amounts from this document are placed in the budget
    if (this.availableAmounts.length === 0 && currentDoc.montants && currentDoc.montants.length > 0) {
      // All amounts have been placed, trigger auto-validation after 2 seconds
      const msgEl = document.getElementById('auto-validate-message');
      if (msgEl) {
        msgEl.textContent = 'Document validé ! Passage au suivant dans 2 secondes...';
        msgEl.classList.add('success');
      }

      announce('Document validé. Passage au document suivant dans 2 secondes.');

      this.autoValidateTimeout = setTimeout(() => {
        this.validateCurrentDocument();
      }, 2000);
    }
  }

  validateCurrentDocument() {
    const currentDoc = this.documents[this.currentDocumentIndex];

    // Clear any pending auto-validation timeout
    if (this.autoValidateTimeout) {
      clearTimeout(this.autoValidateTimeout);
      this.autoValidateTimeout = null;
    }

    // Mark as validated and move to next
    this.validatedDocuments.add(currentDoc.id);
    this.nextDocument();
  }

  skipDocument() {
    announce('Document passé');
    this.nextDocument();
  }

  nextDocument() {
    if (this.currentDocumentIndex < this.documents.length - 1) {
      this.currentDocumentIndex++;
      this.emitProgress();
      this.render();
    } else if (this.currentDocumentIndex === this.documents.length - 1) {
      // Move to final validation state
      this.currentDocumentIndex++;
      this.emitProgress();
      this.render();
    }
  }

  validateFinal() {
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

  validate() {
    // Alias for backwards compatibility
    this.validateFinal();
  }

  emitProgress() {
    // Emit progress update for progress bar
    const progress = {
      current: this.currentDocumentIndex,
      total: this.documents.length,
      percentage: Math.min(100, Math.round((this.currentDocumentIndex / this.documents.length) * 100))
    };
    this.emit('progress', progress);
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
    this.currentDocumentIndex = 0;
    this.placedAmounts = {};
    this.validatedDocuments = new Set();
    this.isValidated = false;
    this.availableAmounts = [];
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
