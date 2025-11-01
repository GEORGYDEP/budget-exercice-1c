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
    this.usedAmountIds = new Set(); // Track unique IDs of used amounts to prevent reuse
    this.hasAttemptedValidation = false; // Track if validation has been attempted
    this.validationFailed = false; // Track if validation failed
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

      // Update available amounts for the center zone - filter out already used amounts
      if (currentDoc.montants && currentDoc.montants.length > 0) {
        this.availableAmounts = currentDoc.montants
          .map((montant, index) => ({
            id: `${currentDoc.id}-${index}`,
            value: montant,
            docId: currentDoc.id,
            index: index
          }))
          .filter(amount => !this.usedAmountIds.has(amount.id));
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

    // Add special class for documents that need to be enlarged
    if (doc.id === 'extrait-bancaire' || doc.id === 'visa') {
      preview.classList.add('document-preview-enlarged');
    }

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

    // Get current document to determine layout
    const currentDoc = this.currentDocumentIndex < this.documents.length
      ? this.documents[this.currentDocumentIndex]
      : null;

    // Use vertical layout for documents with multiple amounts
    const useVerticalLayout = currentDoc && this.availableAmounts.length > 2;

    const amountsContainer = createElement('div', {
      className: useVerticalLayout ? 'amounts-container amounts-container-vertical' : 'amounts-container',
      id: 'amounts-container'
    });

    // Display available amounts
    this.availableAmounts.forEach((amountObj, index) => {
      const dragAmount = createElement('div', {
        className: 'draggable-amount',
        draggable: 'true',
        dataset: {
          amount: String(amountObj.value),
          amountIndex: String(index),
          amountId: amountObj.id
        },
        ondragstart: (e) => {
          e.dataTransfer.setData('amount', String(amountObj.value));
          e.dataTransfer.setData('amountIndex', String(index));
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
      // Allow amounts to be returned to the source zone
      const amountData = e.dataTransfer.getData('amount');
      const amountId = e.dataTransfer.getData('amountId');
      const fromRubrique = e.dataTransfer.getData('rubrique');
      const fromPlaced = e.dataTransfer.getData('fromPlaced') === 'true';
      const amount = parseFloat(amountData);

      if (!isNaN(amount) && amountId) {
        // Remove from used IDs to allow reuse
        this.usedAmountIds.delete(amountId);

        // If coming from a placed cell, remove it from there
        if (fromPlaced && fromRubrique) {
          const placedAmounts = this.placedAmounts[fromRubrique];
          if (placedAmounts) {
            const index = placedAmounts.findIndex(a => a.id === amountId);
            if (index > -1) {
              placedAmounts.splice(index, 1);
              if (placedAmounts.length === 0) {
                delete this.placedAmounts[fromRubrique];
              }
            }
          }
        }

        // Add amount back to available amounts if not already there
        const alreadyAvailable = this.availableAmounts.some(a => a.id === amountId);
        if (!alreadyAvailable) {
          const [docId, indexStr] = amountId.split('-');
          this.availableAmounts.push({
            id: amountId,
            value: amount,
            docId: docId,
            index: parseInt(indexStr)
          });
        }

        this.updateTotals();
        this.render();
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

    // Create header with title and navigation/validation buttons
    const header = createElement('div', { className: 'budget-table-header' });
    const title = createElement('h3', {}, 'Budget du mois - Septembre');
    header.appendChild(title);

    const buttonsContainer = createElement('div', { className: 'document-nav-buttons' });

    // Add validation button if all documents are processed
    if (this.currentDocumentIndex >= this.documents.length) {
      const validateAllBtn = createElement('button', {
        className: 'btn btn-success',
        onclick: () => this.validateFinal()
      }, 'Valider le budget complet');
      buttonsContainer.appendChild(validateAllBtn);

      // Show "Skip to Part 3" button if validation has failed
      if (this.validationFailed) {
        const skipBtn = createElement('button', {
          className: 'btn btn-warning',
          onclick: () => this.skipToPart3()
        }, 'Passer à la partie 3');
        buttonsContainer.appendChild(skipBtn);
      }

      const printBtn = createElement('button', {
        className: 'btn btn-secondary btn-small',
        onclick: () => window.print()
      }, '🖨 Imprimer');
      buttonsContainer.appendChild(printBtn);
    }

    // Add navigation buttons
    if (this.currentDocumentIndex < this.documents.length || this.currentDocumentIndex > 0) {
      // Previous document button
      if (this.currentDocumentIndex > 0) {
        const prevBtn = createElement('button', {
          className: 'btn btn-secondary btn-small',
          onclick: () => this.previousDocument()
        }, '← Document précédent');
        buttonsContainer.appendChild(prevBtn);
      }

      // Next document button
      if (this.currentDocumentIndex < this.documents.length) {
        const nextBtn = createElement('button', {
          className: 'btn btn-secondary btn-small',
          onclick: () => this.skipDocument()
        }, 'Document suivant →');
        buttonsContainer.appendChild(nextBtn);
      }
    }

    if (buttonsContainer.children.length > 0) {
      header.appendChild(buttonsContainer);
    }

    container.appendChild(header);

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

    // Restore previously placed amounts if exist (now supports multiple amounts)
    const placedAmounts = this.placedAmounts[item.libelle];
    if (placedAmounts && placedAmounts.length > 0) {
      const amountsWrapper = createElement('div', { className: 'amounts-stack' });

      placedAmounts.forEach((amountObj) => {
        const amountEl = createElement('div', {
          className: 'draggable-amount amount-badge',
          draggable: 'true',
          dataset: {
            amount: String(amountObj.value),
            amountId: amountObj.id,
            amountIndex: ''
          },
          ondragstart: (ev) => {
            ev.dataTransfer.setData('amount', String(amountObj.value));
            ev.dataTransfer.setData('amountId', amountObj.id);
            ev.dataTransfer.setData('fromPlaced', 'true');
            ev.dataTransfer.setData('rubrique', item.libelle);
            ev.target.classList.add('dragging');
          },
          ondragend: (ev) => ev.target.classList.remove('dragging')
        }, formatEuro(amountObj.value));

        amountsWrapper.appendChild(amountEl);
      });

      // Show total if multiple amounts
      if (placedAmounts.length > 1) {
        const total = placedAmounts.reduce((sum, a) => sum + a.value, 0);
        const totalEl = createElement('div', {
          className: 'amounts-total'
        }, `Total: ${formatEuro(total)}`);
        amountsWrapper.appendChild(totalEl);
      }

      dropZone.appendChild(amountsWrapper);
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

    // Show auto-validation message while processing documents
    if (this.currentDocumentIndex < this.documents.length) {
      const autoValidateMsg = createElement('p', {
        className: 'text-secondary text-center',
        id: 'auto-validate-message'
      }, 'Place les montants dans le tableau. La validation se fera automatiquement.');
      actions.appendChild(autoValidateMsg);
    }
    // Note: Validation button is now in the budget table header

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
    const amountId = e.dataTransfer.getData('amountId');
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

    // Initialize array for this rubrique if it doesn't exist
    if (!this.placedAmounts[item.libelle]) {
      this.placedAmounts[item.libelle] = [];
    }

    // Check if this rubrique already has 3 amounts (maximum)
    if (this.placedAmounts[item.libelle].length >= 3 && !fromPlaced) {
      announce(`⚠️ Capacité atteinte : maximum 3 montants pour "${item.libelle}".`);
      dropZone.classList.add('error');
      setTimeout(() => {
        dropZone.classList.remove('error');
        dropZone.classList.add('filled');
      }, 1000);
      return;
    }

    // Check if this amount ID is already used (prevent duplicates)
    if (amountId && this.usedAmountIds.has(amountId) && !fromPlaced) {
      announce(`⚠️ Ce montant a déjà été utilisé.`);
      return;
    }

    // Remove the amount from its previous location
    if (fromPlaced && fromRubrique && fromRubrique !== item.libelle) {
      // Moving from one budget cell to another
      const previousAmounts = this.placedAmounts[fromRubrique];
      if (previousAmounts) {
        const index = previousAmounts.findIndex(a => a.id === amountId);
        if (index > -1) {
          previousAmounts.splice(index, 1);
          if (previousAmounts.length === 0) {
            delete this.placedAmounts[fromRubrique];
          }
        }
      }
    } else if (!fromPlaced) {
      // Coming from available amounts - remove it from there
      const index = this.availableAmounts.findIndex(a => a.id === amountId);
      if (index > -1) {
        this.availableAmounts.splice(index, 1);
      }
    }

    // Add the amount to the new cell
    const amountObj = {
      value: amount,
      id: amountId || `manual-${Date.now()}-${Math.random()}`
    };

    this.placedAmounts[item.libelle].push(amountObj);

    // Mark this amount ID as used
    if (amountId) {
      this.usedAmountIds.add(amountId);
    }

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
      if (this.placedAmounts[item.libelle] && Array.isArray(this.placedAmounts[item.libelle])) {
        totalEntrees += this.placedAmounts[item.libelle].reduce((sum, amountObj) => sum + amountObj.value, 0);
      }
    });

    [...this.budgetData.sorties_fixes, ...this.budgetData.sorties_variables].forEach(item => {
      if (this.placedAmounts[item.libelle] && Array.isArray(this.placedAmounts[item.libelle])) {
        totalSorties += this.placedAmounts[item.libelle].reduce((sum, amountObj) => sum + amountObj.value, 0);
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

  previousDocument() {
    if (this.currentDocumentIndex > 0) {
      this.currentDocumentIndex--;
      announce('Retour au document précédent');
      this.emitProgress();
      this.render();
    }
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
    // Mark that validation has been attempted
    this.hasAttemptedValidation = true;

    // Transform placedAmounts arrays to totals for validation
    const placedAmountsForValidation = {};
    Object.entries(this.placedAmounts).forEach(([rubrique, amounts]) => {
      if (Array.isArray(amounts) && amounts.length > 0) {
        placedAmountsForValidation[rubrique] = amounts.reduce((sum, amountObj) => sum + amountObj.value, 0);
      }
    });

    const validation = this.validationService.validateBudget(placedAmountsForValidation, this.budgetData);

    // Count only EXPENSE items (sorties_fixes + sorties_variables), not revenues
    const expenseItems = [...this.budgetData.sorties_fixes, ...this.budgetData.sorties_variables];
    const totalExpenseItems = expenseItems.length; // Should be 13

    // Count placed expense items only
    const placedExpenseItems = expenseItems.filter(item =>
      this.placedAmounts[item.libelle] && this.placedAmounts[item.libelle].length > 0
    ).length;

    if (!validation.isComplete) {
      this.validationFailed = true;
      announce('Budget incomplet. Complète toutes les rubriques de dépenses.');

      const missingItems = totalExpenseItems - placedExpenseItems;

      // Check if there are still documents to process
      const hasMoreDocuments = this.currentDocumentIndex < this.documents.length;

      let message = `Budget incomplet !\n\nTu as rempli ${placedExpenseItems} postes de dépenses sur ${totalExpenseItems}.\nIl manque encore ${missingItems} montant(s).`;

      if (hasMoreDocuments) {
        message += '\n\nTu peux revenir en arrière pour consulter les documents précédents en cliquant sur OK.';
        alert(message);
        // Allow user to go back
        this.render(); // Re-render to show skip button
        return;
      } else {
        message += '\n\nVérifie bien tous les documents pour trouver les montants manquants.';
        alert(message);
        this.render(); // Re-render to show skip button
        return;
      }
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
      this.validationFailed = false;
      this.complete(validation);
    } else {
      this.validationFailed = true;
      // Count errors in expense items only for better messaging
      const expenseErrors = validation.errors.filter(err =>
        err.type === 'sortie_fixe' || err.type === 'sortie_variable'
      );

      announce(`Certains postes comportent des erreurs. Vérifie les montants en rouge.`);
      alert(`Certains postes comportent des erreurs.\n\nVérifie les montants en rouge avant de valider à nouveau.\n\nTu peux déplacer les montants pour les corriger.`);
      this.render(); // Re-render to show skip button
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

  skipToPart3() {
    // Allow user to skip to Part 3 even if validation failed
    const confirmation = confirm('Souhaites-tu vraiment passer à la partie 3 ?\n\nTon budget actuel sera pris en compte pour le calcul du score, même s\'il contient des erreurs.');

    if (confirmation) {
      // Transform placedAmounts arrays to totals for validation
      const placedAmountsForValidation = {};
      Object.entries(this.placedAmounts).forEach(([rubrique, amounts]) => {
        if (Array.isArray(amounts) && amounts.length > 0) {
          placedAmountsForValidation[rubrique] = amounts.reduce((sum, amountObj) => sum + amountObj.value, 0);
        }
      });

      const validation = this.validationService.validateBudget(placedAmountsForValidation, this.budgetData);

      const correctItems = Object.values(validation.items).filter(i => i.isValid).length;
      const totalItems = Object.keys(validation.items).length;

      this.score = this.scoringService.calculatePart2Score(
        correctItems,
        totalItems,
        validation.totals.solde.isCorrect
      );

      announce(`Passage à la partie 3. Score: ${this.score} sur 40`);
      alert(`Passage à la partie 3...\n\nScore obtenu: ${this.score}/40`);

      this.emit('complete', this.score);
    }
  }

  complete(validation) {
    const correctItems = Object.values(validation.items).filter(i => i.isValid).length;
    const totalItems = Object.keys(validation.items).length;

    // Count only expense items for display
    const expenseItems = [...this.budgetData.sorties_fixes, ...this.budgetData.sorties_variables];
    const totalExpenseItems = expenseItems.length; // 13 items

    this.score = this.scoringService.calculatePart2Score(
      correctItems,
      totalItems,
      validation.totals.solde.isCorrect
    );

    announce(`Partie 2 terminée ! Score: ${this.score} sur 40`);
    alert(`Félicitations ! Tu as complété le budget correctement (${totalExpenseItems}/${totalExpenseItems} postes de dépenses).\n\nScore: ${this.score}/40\n\nPassage à la partie 3...`);

    this.emit('complete', this.score);
  }

  reset() {
    this.currentDocumentIndex = 0;
    this.placedAmounts = {};
    this.validatedDocuments = new Set();
    this.isValidated = false;
    this.availableAmounts = [];
    this.usedAmountIds = new Set();
    this.hasAttemptedValidation = false;
    this.validationFailed = false;
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
