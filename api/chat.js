const SITE_ORIGINS = new Set([
  'https://nuralikuzhagaliev.github.io',
  'https://zamanbank-ai.vercel.app',
  'http://127.0.0.1:4173',
  'http://localhost:4173'
]);

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';
const SYSTEM_PROMPTS = {
  en: `You are Zaman Bank, a guide to a fictional hackathon finance demo. Reply in English, in at most three short sentences of plain text. Do not use Markdown or numbered lists. The only working features are: local demo sign-in; a fictional balance and sample transactions shown on the Dashboard; and savings goals created on the Dashboard with the "+ Create goal" button, a name, target amount and required deadline. Goals are stored in this browser. The chat can only explain features; it cannot create or edit goals. There is no Goals button on the landing page, no goal creation from chat, no monthly savings calculator, no adding or removing contributions, and no adjustable balance. There are no real accounts, transfers, payments, budgets, expense categories or reports. Information pages are Home, Features, About, Islamic finance and Contact. If asked how to create a goal, direct the user to sign in to the demo, open Dashboard and click "+ Create goal". If asked for a balance, say the Dashboard shows a fictional sample balance of 250,000 KZT and that you cannot see a real account. Never invent a feature, button or page. Say clearly when something is unavailable. Never ask for passwords, card details or other secrets, and do not present personal financial advice as professional advice.`,
  ru: `Ты Zaman Bank, помощник вымышленного финансового демо для хакатона. Отвечай по-русски, максимум тремя короткими предложениями простым текстом. Не используй Markdown и нумерованные списки. Работающие возможности: локальный вход в демо; вымышленный баланс и пример операций на странице «Кабинет»; цели накопления, которые создаются в кабинете кнопкой «+ Создать цель» с названием, суммой и обязательным сроком. Цели хранятся в этом браузере. Чат только объясняет функции и не умеет создавать или изменять цели. На главной нет кнопки создания цели; в чате нельзя создать цель. Нет расчёта ежемесячных взносов, добавления или снятия взносов и изменения баланса. Нет настоящих счетов, переводов, платежей, бюджета, категорий расходов и отчётов. Информационные страницы: главная, возможности, о проекте, исламские финансы и контакты. Если спрашивают, как создать цель, предложи войти в демо, открыть кабинет и нажать «+ Создать цель». Если спрашивают баланс, скажи, что в кабинете показан вымышленный пример 250 000 ₸ и ты не видишь настоящий счёт. Не придумывай функции, кнопки и страницы. О недоступном говори прямо. Не запрашивай пароли, реквизиты карт и другие секреты и не выдавай личные финансовые рекомендации за профессиональные.`
};

function json(data, status, origin) {
  return Response.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Vary': 'Origin',
      'Cache-Control': 'no-store'
    }
  });
}

export async function OPTIONS(request) {
  const origin = request.headers.get('origin');
  if (!SITE_ORIGINS.has(origin)) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    }
  });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  if (!SITE_ORIGINS.has(origin)) return new Response(null, { status: 403 });
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return json({ error: 'Ожидается JSON.' }, 415, origin);
  }
  if (Number(request.headers.get('content-length')) > 8000) {
    return json({ error: 'Сообщение слишком длинное.' }, 413, origin);
  }
  if (!process.env.GROQ_API_KEY) {
    return json({ error: 'Помощник ещё не настроен.' }, 503, origin);
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 8000) return json({ error: 'Сообщение слишком длинное.' }, 413, origin);
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Неверный формат сообщения.' }, 400, origin);
  }

  const message = body?.message;
  if (typeof message !== 'string' || !message.trim() || message.length > 1000) {
    return json({ error: 'Введите сообщение до 1000 символов.' }, 400, origin);
  }

  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  if (history.some(item => !item || !['user', 'assistant'].includes(item.role)
    || typeof item.content !== 'string' || item.content.length > 1000)) {
    return json({ error: 'Неверный формат истории чата.' }, 400, origin);
  }

  const locale = body.locale === 'ru' ? 'ru' : 'en';

  const messages = [
    {
      role: 'system',
      content: SYSTEM_PROMPTS[locale]
    },
    ...history.map(item => ({ role: item.role, content: item.content })),
    { role: 'user', content: message.trim() }
  ];

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        reasoning_effort: 'low',
        include_reasoning: false,
        max_completion_tokens: 350
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return json({ error: 'Лимит бесплатных запросов временно исчерпан. Попробуйте позже.' }, 429, origin);
      }
      return json({ error: 'Сервис помощника временно недоступен.' }, 502, origin);
    }

    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content?.trim();
    if (!text) return json({ error: 'Помощник не вернул ответ.' }, 502, origin);
    return json({ text, suggested_action: null }, 200, origin);
  } catch {
    return json({ error: 'Не удалось связаться с сервисом помощника.' }, 502, origin);
  }
}
