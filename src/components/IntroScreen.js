import { createElement } from '../utils/dom.js';
import { resolveAssetUrl } from '../utils/assets.js';

/**
 * IntroScreen Component
 * Écran d'introduction affiché au démarrage du jeu
 * Affiche un message de bienvenue et une image de budget
 */
export class IntroScreen {
  constructor() {
    this.container = null;
    this.listeners = {};
  }

  /**
   * Initialise le composant
   */
  init() {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Construit l'interface
   */
  render() {
    this.container = createElement('div', {
      className: 'intro-screen',
      id: 'intro-screen'
    },
      // Message en haut
      createElement('div', { className: 'intro-header' },
        createElement('h1', { className: 'intro-title' },
          'Ce jeu a été conçu pour les élèves de l\'Institut Saint-Luc de Frameries par M. DEPRET.'
        )
      ),

      // Image de budget
      createElement('div', { className: 'intro-image-container' },
        createElement('img', {
          src: resolveAssetUrl('assets/images/budget-intro.svg'),
          alt: 'Image représentant un budget',
          className: 'intro-image'
        })
      ),

      // Bouton pour continuer
      createElement('div', { className: 'intro-footer' },
        createElement('button', {
          type: 'button',
          className: 'intro-continue-btn',
          id: 'intro-continue-btn'
        }, 'Commencer le jeu')
      )
    );

    return this.container;
  }

  /**
   * Attache les écouteurs d'événements
   */
  attachEventListeners() {
    const continueBtn = this.container.querySelector('#intro-continue-btn');

    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.handleContinue();
      });

      // Support clavier
      continueBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleContinue();
        }
      });
    }

    // Permettre aussi de cliquer sur l'image pour continuer
    const imageContainer = this.container.querySelector('.intro-image-container');
    if (imageContainer) {
      imageContainer.style.cursor = 'pointer';
      imageContainer.addEventListener('click', () => {
        this.handleContinue();
      });
    }
  }

  /**
   * Gère le passage à l'écran suivant
   */
  handleContinue() {
    this.emit('complete');
  }

  /**
   * Affiche l'écran
   */
  show() {
    if (this.container) {
      this.container.style.display = 'flex';
    }
  }

  /**
   * Cache l'écran
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Enregistre un écouteur d'événements
   */
  on(event, callback) {
    this.listeners[event] = callback;
  }

  /**
   * Émet un événement
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event](data);
    }
  }

  /**
   * Détruit le composant
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.listeners = {};
  }
}
