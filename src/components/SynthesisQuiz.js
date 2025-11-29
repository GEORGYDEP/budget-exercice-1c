/**
 * Composant SynthesisQuiz - Partie 5
 * Affiche uniquement les questions de synthèse avec persistance des réponses
 */
import { createElement, formatEuro, announce, wait, shuffle } from '../utils/dom.js';
import { ScoringService } from '../services/scoring.js';
import { resolveAssetUrl } from '../utils/assets.js';

export class SynthesisQuiz {
  constructor(container) {
    this.container = container;
    this.questions = [];
    this.answers = {}; // Store answers by question ID
    this.scoringService = new ScoringService();
    this.listeners = {};
    this.storageKey = 'budgetGame_part5_answers';
    this.userEmail = null;
  }

  async init(userEmail = null) {
    this.userEmail = userEmail;

    try {
      // Load questions
      const quizRes = await fetch(resolveAssetUrl('assets/data/quiz.json'));
      const quizData = await quizRes.json();
      this.questions = quizData.partie3_final; // Use existing final quiz questions

      // Load saved answers from localStorage
      this.loadAnswers();

      this.render();
    } catch (error) {
      console.error('Erreur chargement partie 5:', error);
      this.container.innerHTML = '<p class="feedback-message error">Erreur de chargement</p>';
    }
  }

  loadAnswers() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        // Verify the email matches (if provided)
        if (!this.userEmail || data.userEmail === this.userEmail) {
          this.answers = data.answers || {};
        }
      }
    } catch (error) {
      console.error('Erreur chargement réponses:', error);
      this.answers = {};
    }
  }

  saveAnswers() {
    try {
      const data = {
        userEmail: this.userEmail,
        answers: this.answers,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Erreur sauvegarde réponses:', error);
    }
  }

  render() {
    this.container.innerHTML = '';

    const layout = createElement('div', { className: 'synthesis-quiz-layout' });

    // Header
    const header = createElement('div', { className: 'synthesis-quiz-header' });
    const title = createElement('h2', {}, 'Questions de synthèse de septembre');
    header.appendChild(title);

    layout.appendChild(header);

    // Questions container
    const questionsContainer = createElement('div', { className: 'questions-container' });

    this.questions.forEach((question, index) => {
      const questionCard = this.createQuestionCard(question, index);
      questionsContainer.appendChild(questionCard);
    });

    layout.appendChild(questionsContainer);

    // Validation button at the bottom
    const footer = createElement('div', { className: 'synthesis-quiz-footer' });
    const validateBtn = createElement('button', {
      className: 'btn btn-success btn-large',
      onclick: () => this.validateAnswers()
    }, 'Valider mes réponses');
    footer.appendChild(validateBtn);

    layout.appendChild(footer);
    this.container.appendChild(layout);
  }

  createQuestionCard(question, index) {
    const card = createElement('div', {
      className: 'quiz-question-card',
      id: `question-${question.id}`
    });

    // Question number and text
    const questionHeader = createElement('div', { className: 'question-header' });
    const questionNumber = createElement('span', {
      className: 'question-number'
    }, `Question ${index + 1}/${this.questions.length}`);
    questionHeader.appendChild(questionNumber);
    card.appendChild(questionHeader);

    const questionText = createElement('h3', {
      className: 'question-text'
    }, question.question);
    card.appendChild(questionText);

    // Check if this question has already been answered
    const savedAnswer = this.answers[question.id];
    const isAnswered = savedAnswer !== undefined;

    // Shuffle options but maintain original indices
    const indexedOptions = question.options.map((option, idx) => ({
      option,
      originalIndex: idx
    }));
    const shuffledOptions = shuffle(indexedOptions);

    // Options
    const optionsContainer = createElement('div', { className: 'quiz-options' });
    shuffledOptions.forEach((item) => {
      const isSelected = isAnswered && savedAnswer.selectedIndex === item.originalIndex;
      const isCorrect = item.originalIndex === question.correctIndex;
      const showFeedback = isAnswered;

      const optionElement = createElement('button', {
        className: `quiz-option ${isSelected ? 'selected' : ''} ${
          showFeedback ? (isCorrect ? 'correct' : isSelected ? 'incorrect' : '') : ''
        }`,
        onclick: () => this.selectOption(item.originalIndex, question)
      }, item.option);
      optionsContainer.appendChild(optionElement);
    });
    card.appendChild(optionsContainer);

    // Show explanation if already answered
    if (isAnswered) {
      const isCorrect = savedAnswer.selectedIndex === question.correctIndex;
      const feedback = createElement('div', {
        className: `feedback-message ${isCorrect ? 'success' : 'error'}`
      }, question.explication);
      card.appendChild(feedback);
    }

    return card;
  }

  selectOption(selectedIndex, question) {
    const isCorrect = selectedIndex === question.correctIndex;

    // Save answer
    this.answers[question.id] = {
      selectedIndex,
      isCorrect,
      timestamp: Date.now()
    };

    // Persist to localStorage
    this.saveAnswers();

    // Re-render to show feedback
    this.render();

    announce(isCorrect ? 'Bonne réponse' : 'Mauvaise réponse');

    // Scroll to next question
    setTimeout(() => {
      const currentCard = document.getElementById(`question-${question.id}`);
      if (currentCard && currentCard.nextElementSibling) {
        currentCard.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  }

  validateAnswers() {
    // Check if all questions are answered
    const answeredCount = Object.keys(this.answers).length;

    if (answeredCount < this.questions.length) {
      const missingCount = this.questions.length - answeredCount;
      alert(`Tu dois répondre à toutes les questions avant de valider.\n\nIl reste ${missingCount} question(s) sans réponse.`);

      // Scroll to first unanswered question
      for (const question of this.questions) {
        if (!this.answers[question.id]) {
          const card = document.getElementById(`question-${question.id}`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            card.classList.add('highlight');
            setTimeout(() => card.classList.remove('highlight'), 2000);
          }
          break;
        }
      }
      return;
    }

    // Calculate score
    const correctAnswers = Object.values(this.answers).filter(a => a.isCorrect).length;
    const score = this.scoringService.calculatePart4Score(correctAnswers, this.questions.length);

    announce(`Partie 5 terminée. Score: ${score} sur 20`);

    // Show completion message
    const confirmed = confirm(
      `Félicitations ! Tu as répondu à toutes les questions.\n\n` +
      `Réponses correctes: ${correctAnswers}/${this.questions.length}\n` +
      `Score: ${score}/20\n\n` +
      `Cliquer sur OK pour voir les résultats finaux.`
    );

    if (confirmed) {
      // Clear saved answers
      localStorage.removeItem(this.storageKey);

      // Emit complete event with score
      this.emit('complete', score);
    }
  }

  reset() {
    this.answers = {};
    localStorage.removeItem(this.storageKey);
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
