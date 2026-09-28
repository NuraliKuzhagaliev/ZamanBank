const SITE_ORIGINS = new Set([
  'https://nuralikuzhagaliev.github.io',
  'http://127.0.0.1:4173',
  'http://localhost:4173'
]);

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';

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
      content: `Ты помощник Zaman, учебного концепта финансового сервиса. Отвечай кратко и понятно ${locale === 'ru' ? 'по-русски' : 'на английском языке'}. Объясняй общие финансовые понятия. Реальные возможности демо: локальный вход без банковской авторизации, демонстрационный баланс и операции, создание целей накопления в браузере и этот чат. Информационные страницы сайта: главная, возможности, о проекте, исламские финансы и контакты. Отдельных страниц о бюджете, накоплениях или финансовых советах нет. В демо нет создания бюджета, категорий расходов, отчётов, переводов и доступа к настоящим банковским данным. Если пользователь спрашивает о несуществующей функции, прямо скажи, что она пока не реализована. Не выдумывай кнопки, страницы или финансовые продукты. Не утверждай, что имеешь доступ к настоящему счёту, балансу, операциям или личным данным. Не выполняй банковские операции и не запрашивай пароли, номера карт или другие секреты. Не выдавай персональные финансовые рекомендации за профессиональные.`
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
        max_completion_tokens: 600
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

