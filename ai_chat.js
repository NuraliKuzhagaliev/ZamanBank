/**
 * Zaman Bank - AI Chat Module
 * Handles AI assistant chat interface and voice interaction
 */

import * as api from './api.js';
import * as speech from './speech.js';
import * as ui from './ui.js';
import * as auth from './auth.js';
import { toggleMicPulse } from './animations.js';

let messagesContainer;
let messageInput;
let sendButton;
let micButton;
let voiceToggle;
const chatHistory = [];
let isSending = false;
const t = text => window.ZamanI18n?.t(text) || text;

function updateComposer() {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 150)}px`;
  messageInput.style.overflowY = messageInput.scrollHeight > 150 ? 'auto' : 'hidden';
  sendButton.disabled = isSending || !messageInput.value.trim();
}

function setMicListening(listening) {
  toggleMicPulse(micButton, listening);
  micButton.classList.toggle('listening', listening);
  micButton.setAttribute('aria-pressed', String(listening));
  micButton.setAttribute('aria-label', listening ? 'Остановить запись' : 'Голосовой ввод');
  micButton.title = listening ? 'Остановить запись' : 'Голосовой ввод';
}

/**
 * Initialize AI chat
 */
export function init() {
  messagesContainer = document.getElementById('chat-messages');
  messageInput = document.getElementById('message-input');
  sendButton = document.getElementById('send-button');
  micButton = document.getElementById('mic-button');
  voiceToggle = document.getElementById('voice-toggle');

  if (!messagesContainer || !messageInput || !sendButton) {
    console.error('Chat elements not found');
    return;
  }

  // Event listeners
  sendButton.addEventListener('click', handleSendMessage);
  messageInput.addEventListener('input', updateComposer);
  updateComposer();

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  if (micButton) {
    if (!speech.isSupported()) {
      micButton.disabled = true;
      micButton.title = 'Распознавание речи не поддерживается';
      micButton.setAttribute('aria-label', 'Распознавание речи не поддерживается');
    } else {
      speech.init();
      micButton.addEventListener('click', handleMicClick);
    }
  }

  if (voiceToggle) {
    speech.setSpeechEnabled(voiceToggle.checked);
    voiceToggle.addEventListener('change', (e) => {
      speech.setSpeechEnabled(e.target.checked);
    });
  }

  const modeNote = document.getElementById('assistant-mode-note');
  const modeTitle = document.getElementById('assistant-mode-title');
  if (api.isAIEnabled()) {
    if (modeNote) modeNote.textContent = 'Ответы создаёт ИИ Groq. Это учебный помощник без доступа к настоящим счетам. Не вводите пароли и реквизиты.';
    if (modeTitle) modeTitle.textContent = 'AI помощник';
  }

  window.ZamanI18n?.apply();

  // Display welcome message
  displayWelcomeMessage();
  window.addEventListener('zaman-language-change', () => {
    const welcome = document.querySelector('[data-welcome-message] .message-content');
    if (welcome) welcome.textContent = getWelcomeText();
  });
  document.querySelectorAll('[data-question]').forEach(button => {
    button.addEventListener('click', () => {
      messageInput.value = button.dataset.question;
      updateComposer();
      handleSendMessage();
    });
  });
}

/**
 * Display welcome message
 */
function displayWelcomeMessage() {
  const element = addMessage(getWelcomeText(), 'assistant');
  element.dataset.welcomeMessage = '';
}

function getWelcomeText() {
  const user = auth.getCurrentUser();
  const name = user ? user.name : (window.ZamanI18n?.getLanguage() === 'ru' ? 'пользователь' : 'there');
  if (window.ZamanI18n?.getLanguage() === 'ru') {
    return `Здравствуйте, ${name}! Я ${api.isAIEnabled() ? 'AI помощник' : 'демо помощник'} Zaman. Спросите о финансовых целях или возможностях демо.`;
  }
  return `Hello, ${name}! I am the Zaman ${api.isAIEnabled() ? 'AI assistant' : 'demo assistant'}. Ask about financial goals or demo features.`;
}

/**
 * Handle send message
 */
async function handleSendMessage() {
  const message = messageInput.value.trim();

  if (!message || isSending) return;
  isSending = true;
  updateComposer();

  // Clear input
  messageInput.value = '';
  updateComposer();

  // Display user message
  addMessage(message, 'user');

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    const userId = auth.getCurrentUserId();
    const response = await api.sendAIMessage(userId, message, chatHistory);

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Display assistant response
    addMessage(response.text, 'assistant');
    chatHistory.push({ role: 'user', content: message }, { role: 'assistant', content: response.text });
    if (chatHistory.length > 8) chatHistory.splice(0, chatHistory.length - 8);

    // Speak response if voice enabled
    if (speech.getSpeechEnabled()) {
      speech.speak(response.text);
    }

    // Handle suggested action
    if (response.suggested_action) {
      await handleSuggestedAction(response.suggested_action);
    }

  } catch (error) {
    console.error('Failed to send message:', error);
    removeTypingIndicator(typingId);
    addMessage(t(error.message || 'Извините, произошла ошибка. Попробуйте снова.'), 'assistant');
  } finally {
    isSending = false;
    updateComposer();
  }
}

/**
 * Handle microphone click
 */
function handleMicClick() {
  if (speech.getIsListening()) {
    speech.stopListening();
    setMicListening(false);
  } else {
    speech.startListening(
      (transcript) => {
        messageInput.value = transcript;
        updateComposer();
        setMicListening(false);
        handleSendMessage();
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setMicListening(false);
        ui.showToast(t('Ошибка распознавания речи'), 'error');
      },
      () => setMicListening(false)
    );

    if (speech.getIsListening()) setMicListening(true);
  }
}

/**
 * Add message to chat
 * @param {string} text 
 * @param {string} type - 'user' or 'assistant'
 */
function addMessage(text, type) {
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type} slide-up`;
  messageEl.innerHTML = `
    <div class="message-content">${ui.escapeHtml(text)}</div>
    <div class="message-time">${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
  `;

  messagesContainer.appendChild(messageEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return messageEl;
}

/**
 * Show typing indicator
 * @returns {string} - Indicator ID
 */
function showTypingIndicator() {
  const id = 'typing-' + Date.now();
  const indicatorEl = document.createElement('div');
  indicatorEl.id = id;
  indicatorEl.className = 'message message-assistant';
  indicatorEl.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  messagesContainer.appendChild(indicatorEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return id;
}

/**
 * Remove typing indicator
 * @param {string} id 
 */
function removeTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Handle suggested action from AI
 * @param {Object} action 
 */
async function handleSuggestedAction(action) {
  const confirmed = await ui.showConfirmModal(
    action.title || 'Подтвердите действие',
    action.description || 'AI предлагает выполнить действие. Продолжить?',
    'Подтвердить',
    'Отмена'
  );

  if (confirmed) {
    try {
      const userId = auth.getCurrentUserId();
      const result = await api.executeAIAction(userId, action);

      if (result.success) {
        ui.showToast('Действие выполнено успешно', 'success');
        addMessage('Действие выполнено успешно!', 'assistant');

        // Trigger dashboard refresh if on dashboard page
        if (window.location.pathname.includes('dashboard.html')) {
          window.dispatchEvent(new Event('dashboard-refresh'));
        }
      } else {
        ui.showToast('Не удалось выполнить действие', 'error');
        addMessage('Извините, не удалось выполнить действие.', 'assistant');
      }
    } catch (error) {
      console.error('Failed to execute action:', error);
      ui.showToast('Ошибка выполнения действия', 'error');
      addMessage('Произошла ошибка при выполнении действия.', 'assistant');
    }
  }
}

export default {
  init
};

