import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { OPTIONS, POST } from '../api/chat.js';

const origin = 'https://nuralikuzhagaliev.github.io';
const originalFetch = globalThis.fetch;
const originalKey = process.env.GROQ_API_KEY;

before(() => { process.env.GROQ_API_KEY = 'test-key'; });
after(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
});

function request(body, requestOrigin = origin) {
  return new Request('https://example.vercel.app/api/chat', {
    method: 'POST',
    headers: { Origin: requestOrigin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('allows the published site to send chat requests', async () => {
  const response = await OPTIONS(new Request('https://example.vercel.app/api/chat', {
    method: 'OPTIONS', headers: { Origin: origin }
  }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
});

test('rejects other origins and overlong input', async () => {
  assert.equal((await POST(request({ message: 'Привет' }, 'https://other.example'))).status, 403);
  assert.equal((await POST(request({ message: 'x'.repeat(1001) }))).status, 400);
});

test('forwards only bounded conversation and returns the model text', async () => {
  let groqRequest;
  globalThis.fetch = async (_url, options) => {
    groqRequest = options;
    return Response.json({ choices: [{ message: { content: 'Это учебный помощник.' } }] });
  };
  const response = await POST(request({ message: 'Привет', history: [{ role: 'user', content: 'Как дела?' }] }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: 'Это учебный помощник.', suggested_action: null });
  const payload = JSON.parse(groqRequest.body);
  assert.equal(payload.model, 'openai/gpt-oss-20b');
  assert.equal(payload.messages.at(-1).content, 'Привет');
  assert.equal(payload.messages.at(-2).content, 'Как дела?');
});

test('shows a friendly message when Groq quota is exhausted', async () => {
  globalThis.fetch = async () => new Response(null, { status: 429 });
  const response = await POST(request({ message: 'Привет' }));
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /Лимит/);
});
