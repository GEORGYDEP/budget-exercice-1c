/**
 * Composant Quiz Final - Partie 3
 */
import { createElement, announce, wait } from '../utils/dom.js';
import { ScoringService } from '../services/scoring.js';

export class FinalQuiz {
  constructor(container) {
    this.container = container;
    this.questions = [];
    this.currentQuestion = 0;
    this.answers = [];
    this.scoringService = new ScoringService();
    this.listeners = {};
  }

  async init() {
    try {
      const response = await fetch('./assets/data/quiz.json');
      const quizData = await response.json();
      this.questions = quizData.partie3_final;
      this.render();
    } catch (error) {
      console.error('Erreur:', error);
      this.container.innerHTML = '<p class="feedback-message error">Erreur de chargement</p>';
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
    const card = createElement('div', { className: 'quiz-question' });
    
    const header = createElement('div', { className: 'quiz-question-header' });
    header.appendChild(createElement('span', { className: 'quiz-question-number' },
      `Question ${this.currentQuestion + 1}/${this.questions.length}`
    ));
    card.appendChild(header);
    
    card.appendChild(createElement('h3', { className: 'quiz-question-text' }, question.question));
    
    const optionsContainer = createElement('div', { className: 'quiz-options' });
    question.options.forEach((option, index) => {
      const optionElement = createElement('button', {
        className: 'quiz-option',
        onclick: () => this.selectOption(index, question)
      }, option);
      optionsContainer.appendChild(optionElement);
    });
    card.appendChild(optionsContainer);
    
    return card;
  }

  async selectOption(selectedIndex, question) {
    const isCorrect = selectedIndex === question.correctIndex;
    
    const options = this.container.querySelectorAll('.quiz-option');
    options.forEach((opt, idx) => {
      opt.classList.add('disabled');
      opt.disabled = true;
      if (idx === selectedIndex) {
        opt.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
      if (idx === question.correctIndex && !isCorrect) {
        opt.classList.add('correct');
      }
    });
    
    const feedback = createElement('div', {
      className: `feedback-message ${isCorrect ? 'success' : 'error'}`
    }, question.explication);
    this.container.querySelector('.quiz-question').appendChild(feedback);
    
    this.answers.push({ questionId: question.id, selectedIndex, isCorrect });
    announce(isCorrect ? 'Bonne réponse' : 'Mauvaise réponse');
    
    await wait(2000);
    this.currentQuestion++;
    this.render();
  }

  complete() {
    const correctAnswers = this.answers.filter(a => a.isCorrect).length;
    this.score = this.scoringService.calculatePart3Score(correctAnswers, this.questions.length);
    
    this.container.innerHTML = `
      <div class="card text-center">
        <h3 class="card-title">Partie 3 terminée !</h3>
        <p class="text-lg mb-md">Réponses correctes: <strong>${correctAnswers}/${this.questions.length}</strong></p>
        <p class="text-xl font-bold">Score: ${this.score}/30</p>
        <p class="text-secondary mt-md">Calcul des résultats finaux...</p>
      </div>
    `;
    
    announce(`Partie 3 terminée. Score: ${this.score} sur 30`);
    this.emit('complete', this.score);
  }

  reset() {
    this.currentQuestion = 0;
    this.answers = [];
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
