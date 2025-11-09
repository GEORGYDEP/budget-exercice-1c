/**
 * Composant EmailGate - Écran de validation email au démarrage
 * Valide le format prenom.nom@istlm.org et extrait l'identité
 */
import { createElement, announce } from '../utils/dom.js';

export class EmailGate {
  constructor(container) {
    this.container = container;
    this.listeners = {};
    this.emailRegex = /^[a-zàâäçéèêëîïôöùûüÿñ'-]+\.[a-zàâäçéèêëîïôöùûüÿñ'-]+@istlm\.org$/i;
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    const card = createElement('div', { className: 'email-gate-card card' });

    // Logo ou titre
    const title = createElement('h2', { className: 'email-gate-title' },
      'Budget du Ménage - Jeu Éducatif');
    card.appendChild(title);

    const subtitle = createElement('p', { className: 'email-gate-subtitle text-secondary' },
      'Avant de commencer, identifie-toi avec ton adresse email ISTLM');
    card.appendChild(subtitle);

    // Form
    const form = createElement('form', {
      className: 'email-gate-form',
      onsubmit: (e) => this.handleSubmit(e)
    });

    // Email input
    const inputGroup = createElement('div', { className: 'form-group' });
    const label = createElement('label', {
      for: 'email-input',
      className: 'form-label'
    }, 'Adresse e-mail ISTLM');
    inputGroup.appendChild(label);

    const input = createElement('input', {
      type: 'email',
      id: 'email-input',
      className: 'form-input',
      placeholder: 'prenom.nom@istlm.org',
      required: 'required',
      autocomplete: 'email',
      'aria-describedby': 'email-hint'
    });
    inputGroup.appendChild(input);

    const hint = createElement('p', {
      id: 'email-hint',
      className: 'form-hint text-sm text-secondary'
    }, 'Format requis : prenom.nom@istlm.org');
    inputGroup.appendChild(hint);

    // Error message placeholder
    const errorContainer = createElement('div', {
      id: 'email-error',
      className: 'form-error',
      role: 'alert',
      'aria-live': 'polite'
    });
    inputGroup.appendChild(errorContainer);

    form.appendChild(inputGroup);

    // Submit button
    const submitBtn = createElement('button', {
      type: 'submit',
      className: 'btn btn-primary btn-large'
    }, 'Commencer le jeu');
    form.appendChild(submitBtn);

    card.appendChild(form);
    this.container.appendChild(card);

    // Focus on input
    setTimeout(() => input.focus(), 100);
  }

  handleSubmit(e) {
    e.preventDefault();

    const input = document.getElementById('email-input');
    const email = input.value.trim().toLowerCase();
    const errorContainer = document.getElementById('email-error');

    // Clear previous errors
    errorContainer.textContent = '';
    input.classList.remove('input-error');

    // Validate email format
    if (!this.emailRegex.test(email)) {
      this.showError('Format d\'email invalide. Utilise le format : prenom.nom@istlm.org');
      input.classList.add('input-error');
      announce('Format d\'email invalide');
      return;
    }

    // Extract first name and last name
    const emailPart = email.split('@')[0]; // Get part before @
    const [firstNameRaw, lastNameRaw] = emailPart.split('.');

    if (!firstNameRaw || !lastNameRaw) {
      this.showError('Format d\'email invalide. Utilise le format : prenom.nom@istlm.org');
      input.classList.add('input-error');
      return;
    }

    // Capitalize names properly (handle hyphenated names)
    const firstName = this.capitalizeName(firstNameRaw);
    const lastName = this.capitalizeName(lastNameRaw);

    // Store in sessionStorage
    const userData = {
      email: email,
      firstName: firstName,
      lastName: lastName,
      timestamp: Date.now()
    };

    sessionStorage.setItem('budgetGame_user', JSON.stringify(userData));

    // Announce success
    announce(`Bienvenue ${firstName} ${lastName}`);

    // Emit complete event
    this.emit('complete', userData);
  }

  capitalizeName(name) {
    // Handle hyphenated names (e.g., jean-paul -> Jean-Paul)
    return name.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('-');
  }

  showError(message) {
    const errorContainer = document.getElementById('email-error');
    if (errorContainer) {
      errorContainer.textContent = message;
    }
  }

  // Event emitter
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}
