/**
 * Point d'entrée principal de l'application
 */
import { App } from './app.js';

// Initialiser l'application une fois le DOM chargé
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
