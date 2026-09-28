import * as api from './api.js';

const copy = {
  en: {
    open: 'Open Zaman assistant',
    close: 'Close assistant',
    title: 'Zaman assistant',
    subtitle: 'Ask about the demo',
    welcome: 'Hi! Ask me about the demo balance, savings goals or Zaman features.',
    placeholder: 'Write a message...',
    send: 'Send message',
    full: 'Open full chat',
    note: 'Demo assistant · Do not share passwords or card details.',
    error: 'The assistant is temporarily unavailable. Please try again.'
  },
  ru: {
    open: 'Открыть помощника Zaman',
    close: 'Закрыть помощника',
    title: 'Помощник Zaman',
    subtitle: 'Спросите о демо',
    welcome: 'Привет! Спросите меня о демо балансе, целях или возможностях Zaman.',
    placeholder: 'Напишите сообщение...',
    send: 'Отправить сообщение',
    full: 'Открыть полный чат',
    note: 'Демо помощник · Не сообщайте пароли и данные карты.',
    error: 'Помощник временно недоступен. Попробуйте ещё раз.'
  }
};

const chatIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-3.6-.8L3 21l1.8-4.9A8.5 8.5 0 1 1 20 11.5Z"/><path d="m11.5 7.5.7 2.2 2.3.7-2.3.7-.7 2.2-.7-2.2-2.3-.7 2.3-.7.7-2.2Z"/></svg>';

function language() {
  return window.ZamanI18n?.getLanguage() === 'ru' ? 'ru' : 'en';
}

function addMessage(list, value, kind, welcome = false) {
  const item = document.createElement('div');
  item.className = `assistant-widget-message assistant-widget-message-${kind}`;
  item.textContent = value;
  if (welcome) item.dataset.welcome = '';
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
  return item;
}

function init() {
  // The dedicated assistant page already has its own full-size conversation.
  if (document.body.classList.contains('chat-page')) return;

  const root = document.createElement('aside');
  root.className = 'assistant-widget';
  root.setAttribute('data-i18n-ignore', '');
  root.innerHTML = `
    <section class="assistant-widget-panel" id="assistant-widget-panel" role="dialog" aria-labelledby="assistant-widget-title" hidden>
      <div class="assistant-widget-header">
        <span class="assistant-widget-mark" aria-hidden="true">${chatIcon}</span>
        <div class="assistant-widget-heading"><strong id="assistant-widget-title"></strong><small data-widget-subtitle></small></div>
        <button class="assistant-widget-close" type="button" data-widget-close aria-label="Close assistant" title="Close assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
      <div class="assistant-widget-messages" role="log" aria-live="polite" aria-relevant="additions"></div>
      <div class="assistant-widget-footer">
        <form class="assistant-widget-form">
          <label class="assistant-widget-sr" for="assistant-widget-input" data-widget-label></label>
          <textarea id="assistant-widget-input" rows="1" maxlength="1000"></textarea>
          <button type="submit" class="assistant-widget-send" disabled aria-label="Send message" title="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
          </button>
        </form>
        <div class="assistant-widget-bottom"><span data-widget-note></span><a href="ai_assistant.html" data-widget-full></a></div>
      </div>
    </section>
    <button class="assistant-widget-launcher" type="button" aria-controls="assistant-widget-panel" aria-expanded="false" aria-label="Open Zaman assistant" title="Open Zaman assistant">
      ${chatIcon}<span class="assistant-widget-launcher-dot" aria-hidden="true"></span>
    </button>`;
  document.body.appendChild(root);

  const panel = root.querySelector('.assistant-widget-panel');
  const launcher = root.querySelector('.assistant-widget-launcher');
  const close = root.querySelector('[data-widget-close]');
  const list = root.querySelector('.assistant-widget-messages');
  const form = root.querySelector('form');
  const input = root.querySelector('textarea');
  const send = root.querySelector('.assistant-widget-send');
  const history = [];
  let sending = false;

  function updateLanguage() {
    const strings = copy[language()];
    root.querySelector('#assistant-widget-title').textContent = strings.title;
    root.querySelector('[data-widget-subtitle]').textContent = strings.subtitle;
    root.querySelector('[data-widget-note]').textContent = strings.note;
    root.querySelector('[data-widget-full]').textContent = strings.full;
    root.querySelector('[data-widget-label]').textContent = strings.placeholder;
    input.placeholder = strings.placeholder;
    launcher.setAttribute('aria-label', strings.open);
    launcher.title = strings.open;
    close.setAttribute('aria-label', strings.close);
    close.title = strings.close;
    send.setAttribute('aria-label', strings.send);
    send.title = strings.send;
    const welcome = list.querySelector('[data-welcome]');
    if (welcome) welcome.textContent = strings.welcome;
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
    else launcher.focus();
  }

  function updateSend() {
    send.disabled = sending || !input.value.trim();
  }

  launcher.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', event => {
    if (event.key === 'Escape') setOpen(false);
  });
  input.addEventListener('input', updateSend);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || sending) return;
    input.value = '';
    sending = true;
    updateSend();
    addMessage(list, message, 'user');
    const pending = addMessage(list, '···', 'pending');
    try {
      const response = await api.sendAIMessage(null, message, history);
      pending.remove();
      addMessage(list, response.text, 'assistant');
      history.push({ role: 'user', content: message }, { role: 'assistant', content: response.text });
      if (history.length > 8) history.splice(0, history.length - 8);
    } catch {
      pending.remove();
      addMessage(list, copy[language()].error, 'assistant');
    } finally {
      sending = false;
      updateSend();
      if (!panel.hidden) input.focus();
    }
  });

  addMessage(list, copy[language()].welcome, 'assistant', true);
  updateLanguage();
  window.addEventListener('zaman-language-change', updateLanguage);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
