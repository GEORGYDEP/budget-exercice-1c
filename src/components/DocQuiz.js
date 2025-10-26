/**
 * Composant Quiz Documents - Partie 1
 * Affiche les documents et demande à l'utilisateur de les identifier
 */
import { createElement, formatEuro, announce, wait } from '../utils/dom.js';
import { t } from '../utils/i18n.js';
import { ScoringService } from '../services/scoring.js';
import { resolveAssetUrl } from '../utils/assets.js';

export class DocQuiz {
  constructor(container) {
    this.container = container;
    this.questions = [];
    this.currentQuestion = 0;
    this.answers = [];
    this.score = 0;
    this.scoringService = new ScoringService();
    this.listeners = {};
  }

  async init() {
    try {
      // Charger les données du quiz
      const response = await fetch(resolveAssetUrl('assets/data/quiz.json'));
      const quizData = await response.json();
      this.questions = quizData.partie1_documents;
      
      // Render le quiz
      this.render();
    } catch (error) {
      console.error('Erreur chargement quiz documents:', error);
      this.container.innerHTML = '<p class="feedback-message error">Erreur lors du chargement du quiz</p>';
    }
  }

  render() {
    if (this.currentQuestion >= this.questions.length) {
      this.complete();
      return;
    }

    const question = this.questions[this.currentQuestion];
    
    this.container.innerHTML = '';
    const questionCard = this.createQuestionCard(question);
    this.container.appendChild(questionCard);
  }

  createQuestionCard(question) {
    const card = createElement('div', { className: 'quiz-question', role: 'group', 'aria-labelledby': `question-${question.id}` });
    
    // Header
    const header = createElement('div', { className: 'quiz-question-header' });
    const questionNumber = createElement('span', { className: 'quiz-question-number' }, 
      `Question ${this.currentQuestion + 1}/${this.questions.length}`
    );
    header.appendChild(questionNumber);
    card.appendChild(header);
    
    // Question text
    const questionText = createElement('h3', { 
      className: 'quiz-question-text',
      id: `question-${question.id}`
    }, question.question);
    card.appendChild(questionText);
    
    // Document preview
    if (question.docId) {
      const preview = this.createDocumentPreview(question.docId);
      card.appendChild(preview);
    }
    
    // Options
    const optionsContainer = createElement('div', { className: 'quiz-options', role: 'radiogroup' });
    question.options.forEach((option, index) => {
      const optionElement = this.createOption(option, index, question);
      optionsContainer.appendChild(optionElement);
    });
    card.appendChild(optionsContainer);
    
    return card;
  }

  createDocumentPreview(docId) {
    const preview = createElement('div', { className: 'quiz-document-preview' });
    const img = createElement('img', {
      src: resolveAssetUrl(`assets/images/page_${this.getPageNumber(docId)}.png`),
      alt: `Document ${docId}`,
      role: 'img',
      tabindex: '0',
      'aria-label': 'Document financier - cliquer pour agrandir'
    });
    
    img.addEventListener('click', () => this.showLightbox(img.src));
    img.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.showLightbox(img.src);
      }
    });
    
    preview.appendChild(img);
    return preview;
  }

  getPageNumber(docId) {
    const pageMap = {
      'assurance-voiture': 1,
      'restaurant': 2,
      'quittance-loyer': 2,
      'medecin': 3,
      'bus': 4,
      'proximus': 5,
      'ikea': 6,
      'extrait-bancaire': 7,
      'papeterie': 8,
      'visa': 9,
      'carrefour': 10
    };
    return pageMap[docId] || 1;
  }

  createOption(option, index, question) {
    const optionElement = createElement('button', {
      className: 'quiz-option',
      type: 'button',
      role: 'radio',
      'aria-checked': 'false',
      'aria-label': option,
      onclick: () => this.selectOption(index, question)
    }, option);
    
    return optionElement;
  }

  async selectOption(selectedIndex, question) {
    const isCorrect = selectedIndex === question.correctIndex;
    
    // Désactiver toutes les options
    const options = this.container.querySelectorAll('.quiz-option');
    options.forEach((opt, idx) => {
      opt.classList.add('disabled');
      opt.disabled = true;
      
      if (idx === selectedIndex) {
        opt.classList.add(isCorrect ? 'correct' : 'incorrect');
        opt.setAttribute('aria-checked', 'true');
      }
      if (idx === question.correctIndex && !isCorrect) {
        opt.classList.add('correct');
      }
    });
    
    // Feedback
    const feedback = this.createFeedback(isCorrect, question.explication);
    const questionCard = this.container.querySelector('.quiz-question');
    questionCard.appendChild(feedback);
    
    // Enregistrer la réponse
    this.answers.push({
      questionId: question.id,
      selectedIndex,
      isCorrect
    });
    
    // Annoncer le résultat
    announce(isCorrect ? 'Bonne réponse' : 'Mauvaise réponse');
    
    // Passer à la question suivante après un délai
    await wait(2000);
    this.currentQuestion++;
    this.render();
  }

  createFeedback(isCorrect, explication) {
    const feedback = createElement('div', {
      className: `feedback-message ${isCorrect ? 'success' : 'error'}`,
      role: 'status',
      'aria-live': 'polite'
    });
    
    const icon = createElement('span', { className: isCorrect ? 'icon-check' : 'icon-cross' });
    const text = createElement('span', {}, explication);
    
    feedback.appendChild(icon);
    feedback.appendChild(text);
    
    return feedback;
  }

  showLightbox(imageSrc) {
    const overlay = createElement('div', { className: 'modal-overlay' });
    
    const content = createElement('div', { className: 'modal-content' });
    const img = createElement('img', { src: imageSrc, alt: 'Document agrandi' });
    const closeBtn = createElement('button', {
      className: 'modal-close',
      'aria-label': 'Fermer',
      onclick: () => overlay.remove()
    }, '×');
    
    content.appendChild(img);
    content.appendChild(closeBtn);
    overlay.appendChild(content);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    });
    
    document.body.appendChild(overlay);
  }

  complete() {
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    this.score = this.scoringService.calculatePart1Score(
      correctAnswers,
      this.questions.length
    );
    
    this.container.innerHTML = `
      <div class="card text-center">
        <h3 class="card-title">Partie 1 terminée !</h3>
        <p class="text-lg mb-md">Tu as répondu correctement à <strong>${correctAnswers}/${this.questions.length}</strong> questions</p>
        <p class="text-xl font-bold">Score: ${this.score}/30</p>
        <p class="text-secondary mt-md">Passage à la partie 2...</p>
      </div>
    `;
    
    announce(`Partie 1 terminée. Score: ${this.score} sur 30`);
    this.emit('complete', this.score);
  }

  reset() {
    this.currentQuestion = 0;
    this.answers = [];
    this.score = 0;
    this.render();
  }

  // Event emitter simple
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
