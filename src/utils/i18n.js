/**
 * Système d'internationalisation (i18n) pour fr-BE
 */

const translations = {
  'fr-BE': {
    // Navigation
    'nav.next': 'Suivant',
    'nav.previous': 'Précédent',
    'nav.validate': 'Valider',
    'nav.restart': 'Recommencer',
    'nav.print': 'Imprimer',
    
    // Parties du jeu
    'part1.title': 'Partie 1 : Identifier les documents',
    'part1.instructions': 'Observe chaque document et identifie de quel type il s\'agit.',
    'part2.title': 'Partie 2 : Compléter le budget',
    'part2.instructions': 'Glisse les montants des documents vers les bonnes rubriques du budget.',
    'part3.title': 'Partie 3 : Quiz de synthèse',
    'part3.instructions': 'Réponds aux questions pour vérifier ta compréhension.',
    
    // Quiz
    'quiz.question': 'Question',
    'quiz.of': 'sur',
    'quiz.select': 'Sélectionne ta réponse',
    'quiz.correct': 'Bonne réponse !',
    'quiz.incorrect': 'Mauvaise réponse',
    'quiz.tryAgain': 'Réessaye',
    
    // Budget
    'budget.entries': 'Entrées',
    'budget.exits.fixed': 'Sorties fixes',
    'budget.exits.variable': 'Sorties variables',
    'budget.total.entries': 'Total des entrées',
    'budget.total.exits': 'Total des sorties',
    'budget.balance': 'Solde',
    'budget.dragInstruction': 'Glisse les montants vers les rubriques',
    'budget.validate': 'Valider le budget',
    'budget.print': 'Imprimer mon tableau',
    'budget.correct': 'Correct !',
    'budget.incorrect': 'À corriger',
    
    // Documents
    'doc.click.enlarge': 'Cliquer pour agrandir',
    'doc.gallery': 'Galerie de documents',
    
    // Résultats
    'results.title': 'Résultats',
    'results.score': 'Score total',
    'results.breakdown': 'Détail des scores',
    'results.excellent': 'Excellent travail ! Tu maîtrises parfaitement la gestion d\'un budget.',
    'results.veryGood': 'Très bien ! Tu as une bonne compréhension de la gestion budgétaire.',
    'results.good': 'Bien joué ! Continue à t\'entraîner pour améliorer tes compétences.',
    'results.okay': 'Pas mal ! Réessaye pour améliorer ton score.',
    'results.needsPractice': 'Continue à apprendre ! La gestion d\'un budget demande de la pratique.',
    
    // Messages
    'msg.loading': 'Chargement...',
    'msg.error': 'Une erreur est survenue',
    'msg.saved': 'Progression sauvegardée',
    'msg.completed': 'Partie terminée !',
    'msg.restoreSession': 'Voulez-vous reprendre votre session précédente ?',
    
    // Accessibilité
    'aria.progress': 'Progression du jeu',
    'aria.score': 'Score actuel',
    'aria.document': 'Document financier',
    'aria.draggable': 'Montant déplaçable',
    'aria.dropzone': 'Zone de dépôt',
    
    // Types de documents
    'docType.quittance_assurance': 'Quittance d\'assurance',
    'docType.ticket_restaurant': 'Ticket de restaurant',
    'docType.quittance_loyer': 'Quittance de loyer',
    'docType.attestation_soins': 'Attestation de soins',
    'docType.carte_transport': 'Carte de transport',
    'docType.facture_telephone': 'Facture de téléphone',
    'docType.ticket_caisse': 'Ticket de caisse',
    'docType.extrait_compte': 'Extrait de compte',
    'docType.facture': 'Facture',
    'docType.releve_carte': 'Relevé de carte',
    'docType.ticket_supermarche': 'Ticket de supermarché',
    
    // Unités
    'currency': '€',
    'currency.symbol': '€',
    'currency.name': 'euro',
    
    // Dates et temps
    'date.format': 'DD/MM/YYYY',
    'month.september': 'septembre',
    'month.format': 'MMMM YYYY'
  }
};

let currentLocale = 'fr-BE';

/**
 * Traduit une clé dans la langue courante
 */
export function t(key, replacements = {}) {
  const locale = translations[currentLocale];
  let text = locale[key] || key;
  
  // Remplacer les variables {variable}
  Object.entries(replacements).forEach(([k, v]) => {
    text = text.replace(new RegExp(`{${k}}`, 'g'), v);
  });
  
  return text;
}

/**
 * Définit la locale courante
 */
export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale;
  }
}

/**
 * Retourne la locale courante
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Formate un nombre selon la locale
 */
export function formatNumber(number, options = {}) {
  return new Intl.NumberFormat(currentLocale, options).format(number);
}

/**
 * Formate un montant en devise
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Formate une date selon la locale
 */
export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat(currentLocale, options).format(date);
}

/**
 * Pluralise un texte selon un nombre
 */
export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

export default {
  t,
  setLocale,
  getLocale,
  formatNumber,
  formatCurrency,
  formatDate,
  pluralize
};
