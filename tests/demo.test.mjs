import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calendarDaysUntil, localCalendarDate } from '../calendar.js';
import { validateDate } from '../validator.js';
import { sendAIMessage } from '../api.js';
import { MAX_CHAT_BYTES, serializeChatRequest } from '../chat-request.js';
import { POST } from '../api/chat.js';

test('uses the local day and rejects invalid dates', () => {
  const today = localCalendarDate(new Date(2026, 10, 22, 1));
  assert.equal(today, '2026-11-22');
  assert.equal(validateDate('2026-11-21', today).ok, false);
  assert.equal(validateDate('2026-11-22', today).ok, true);
  assert.equal(validateDate('2026-11-31', today).ok, false);
  assert.equal(calendarDaysUntil('2026-11-23', today), 1);
});

test('the server accepts trimmed UTF-8 history and retains recent turns', async t => {
  const history = Array.from({ length: 8 }, (_, i) => ({
    role: i % 2 ? 'assistant' : 'user', content: `${i} ${'я'.repeat(997)}`
  }));
  const body = serializeChatRequest('ж'.repeat(990), history, 'ru');
  const size = Buffer.byteLength(body);
  assert.ok(size <= MAX_CHAT_BYTES);
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.messages.length, 4);
    assert.equal(request.messages[1].role, 'user');
    assert.ok(request.messages[1].content.startsWith('6 '));
    assert.ok(request.messages[2].content.startsWith('7 '));
    return Response.json({ choices: [{ message: { content: 'Ответ.' } }] });
  });
  const key = process.env.GROQ_API_KEY;
  process.env.GROQ_API_KEY = 'test-key';
  try {
    const response = await POST(new Request('https://example.vercel.app/api/chat', {
      method: 'POST', body,
      headers: { Origin: 'https://nuralikuzhagaliev.github.io', 'Content-Type': 'application/json' }
    }));
    assert.equal(response.status, 200);
  } finally {
    if (key === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = key;
  }
});

test('returns localized demo answers when the provider fails or quota runs out', async t => {
  globalThis.window = { ZamanI18n: { getLanguage: () => 'en' } };
  t.after(() => { delete globalThis.window; });
  const provider = t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 502 }));
  const en = await sendAIMessage(null, 'What is my balance?');
  assert.equal(en.source, 'demo');
  assert.match(en.text, /250,000 KZT/);
  window.ZamanI18n.getLanguage = () => 'ru';
  provider.mock.mockImplementation(async () => new Response(null, { status: 429 }));
  const ru = await sendAIMessage(null, 'Помоги с целями');
  assert.equal(ru.source, 'demo');
  assert.match(ru.text, /Создать цель/);
  provider.mock.mockImplementation(async () => Response.json({ text: 'Live answer', suggested_action: null }));
  assert.equal((await sendAIMessage(null, 'Привет')).text, 'Live answer');
});
