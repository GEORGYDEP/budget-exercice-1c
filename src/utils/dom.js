/**
 * Utilitaires pour la manipulation du DOM
 */

/**
 * Crée un élément HTML avec des attributs et du contenu
 */
export function createElement(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  
  // Définir les attributs
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Ajouter les enfants
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    } else if (child !== null && child !== undefined) {
      element.appendChild(document.createTextNode(String(child)));
    }
  });
  
  return element;
}

/**
 * Sélectionne un élément dans le DOM
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Sélectionne plusieurs éléments dans le DOM
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Ajoute une classe à un élément
 */
export function addClass(element, ...classes) {
  if (element) {
    element.classList.add(...classes);
  }
}

/**
 * Retire une classe d'un élément
 */
export function removeClass(element, ...classes) {
  if (element) {
    element.classList.remove(...classes);
  }
}

/**
 * Toggle une classe sur un élément
 */
export function toggleClass(element, className) {
  if (element) {
    element.classList.toggle(className);
  }
}

/**
 * Vérifie si un élément a une classe
 */
export function hasClass(element, className) {
  return element && element.classList.contains(className);
}

/**
 * Vide le contenu d'un élément
 */
export function empty(element) {
  if (element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}

/**
 * Remplace le contenu d'un élément
 */
export function setHTML(element, html) {
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Affiche un élément
 */
export function show(element, display = 'block') {
  if (element) {
    element.style.display = display;
  }
}

/**
 * Cache un élément
 */
export function hide(element) {
  if (element) {
    element.style.display = 'none';
  }
}

/**
 * Annonce un message pour les lecteurs d'écran
 */
export function announce(message, priority = 'polite') {
  const liveRegion = document.getElementById('aria-live');
  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Nettoyer après 1 seconde
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }
}

/**
 * Ajoute un écouteur d'événement avec délégation
 */
export function delegate(parent, selector, event, handler) {
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target) {
      handler.call(target, e);
    }
  });
}

/**
 * Charge une image de manière asynchrone
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Anime le scroll vers un élément
 */
export function scrollTo(element, options = {}) {
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      ...options
    });
  }
}

/**
 * Formate un montant en euros
 */
export function formatEuro(amount) {
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Attendre un certain temps (pour les animations)
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce une fonction
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Vérifie si un élément est visible dans le viewport
 */
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Mélange aléatoirement un tableau
 */
export function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
