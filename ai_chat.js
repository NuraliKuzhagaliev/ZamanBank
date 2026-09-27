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

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  if (micButton) {
    if (!speech.isSupported()) {
      micButton.disabled = true;
      micButton.title = 'Распознавание речи не поддерживается';
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

  // Display welcome message
  displayWelcomeMessage();
  document.querySelectorAll('[data-question]').forEach(button => {
    button.addEventListener('click', () => {
      messageInput.value = button.dataset.question;
      handleSendMessage();
    });
  });
}

/**
 * Display welcome message
 */
function displayWelcomeMessage() {
  const user = auth.getCurrentUser();
  const name = user ? user.name : 'пользователь';

  addMessage(
    `Здравствуйте, ${name}! Я демо помощник Zaman. Спросите о балансе или финансовых целях.`,
    'assistant'
  );
}

/**
 * Handle send message
 */
async function handleSendMessage() {
  const message = messageInput.value.trim();

  if (!message) return;
  sendButton.disabled = true;

  // Clear input
  messageInput.value = '';

  // Display user message
  addMessage(message, 'user');

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    const userId = auth.getCurrentUserId();
    const response = await api.sendAIMessage(userId, message);

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Display assistant response
    addMessage(response.text, 'assistant');

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
    addMessage('Извините, произошла ошибка. Попробуйте снова.', 'assistant');
  } finally {
    sendButton.disabled = false;
  }
}

/**
 * Handle microphone click
 */
function handleMicClick() {
  if (speech.getIsListening()) {
    speech.stopListening();
    toggleMicPulse(micButton, false);
    micButton.classList.remove('listening');
  } else {
    speech.startListening(
      (transcript) => {
        messageInput.value = transcript;
        toggleMicPulse(micButton, false);
        micButton.classList.remove('listening');
        handleSendMessage();
      },
      (error) => {
        console.error('Speech recognition error:', error);
        toggleMicPulse(micButton, false);
        micButton.classList.remove('listening');
        ui.showToast('Ошибка распознавания речи', 'error');
      }
    );

    toggleMicPulse(micButton, true);
    micButton.classList.add('listening');
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

