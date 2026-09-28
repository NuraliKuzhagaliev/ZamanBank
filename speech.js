/**
 * Zaman Bank - Speech Recognition Module
 * Handles voice input and text-to-speech using Web Speech API
 */

let recognition = null;
let synthesis = window.speechSynthesis;
let isListening = false;
let isSpeechEnabled = true;

/**
 * Check if Speech Recognition is supported
 * @returns {boolean}
 */
export function isSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Initialize speech recognition
 */
export function init() {
  if (!isSupported()) {
    console.warn('Speech Recognition is not supported in this browser');
    return false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = window.ZamanI18n?.getLanguage() === 'ru' ? 'ru-RU' : 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return true;
}

/**
 * Start listening for voice input
 * @param {Function} onResult - Callback when speech is recognized
 * @param {Function} onError - Callback when error occurs
 * @param {Function} onEnd - Callback when listening ends
 */
export function startListening(onResult, onError, onEnd) {
  if (!recognition) {
    if (!init()) {
      if (onError) onError('Speech recognition not supported');
      return;
    }
  }

  if (isListening) {
    return;
  }

  isListening = true;
  recognition.lang = window.ZamanI18n?.getLanguage() === 'ru' ? 'ru-RU' : 'en-US';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (onResult) {
      onResult(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isListening = false;
    if (onError) {
      onError(event.error);
    }
  };

  recognition.onend = () => {
    isListening = false;
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
  } catch (error) {
    console.error('Failed to start recognition:', error);
    isListening = false;
    if (onError) onError(error.message);
  }
}

/**
 * Stop listening
 */
export function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }
}

/**
 * Check if currently listening
 * @returns {boolean}
 */
export function getIsListening() {
  return isListening;
}

/**
 * Speak text using Text-to-Speech
 * @param {string} text - Text to speak
 * @param {Function} onEnd - Callback when speech ends
 */
export function speak(text, onEnd) {
  if (!isSpeechEnabled || !synthesis) {
    return;
  }

  // Cancel any ongoing speech
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = window.ZamanI18n?.getLanguage() === 'ru' ? 'ru-RU' : 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
  }

  synthesis.speak(utterance);
}

/**
 * Stop current speech
 */
export function stopSpeaking() {
  if (synthesis) {
    synthesis.cancel();
  }
}

/**
 * Enable/disable speech output
 * @param {boolean} enabled 
 */
export function setSpeechEnabled(enabled) {
  isSpeechEnabled = enabled;
  if (!enabled) {
    stopSpeaking();
  }
}

/**
 * Get speech enabled state
 * @returns {boolean}
 */
export function getSpeechEnabled() {
  return isSpeechEnabled;
}

export default {
  isSupported,
  init,
  startListening,
  stopListening,
  getIsListening,
  speak,
  stopSpeaking,
  setSpeechEnabled,
  getSpeechEnabled
};

