/**
 * Zaman Bank - API Module
 * Handles all API communications with backend
 * Supports mock mode for development without backend
 */

import { CHAT_ENDPOINT } from './ai-config.js';

// Configuration
let BASE_URL = 'http://127.0.0.1:5000'; // Replace with actual backend URL
let USE_MOCK = true; // Standalone hackathon demo; no banking backend is bundled.

// Mock data for development
const MOCK_DATA = {
  user: {
    id: 1,
    name: 'Гость',
    email: 'demo@zamanbank.kz',
    balance: 250000
  },

  token: 'mock_jwt_token_12345',

  goals: [
    {
      id: 1,
      title: 'Финансовая подушка',
      target_amount: 100000,
      current_amount: 75000,
      deadline: '2027-12-31',
      created_at: '2025-01-15'
    },
    {
      id: 2,
      title: 'Новый автомобиль',
      target_amount: 500000,
      current_amount: 250000,
      deadline: '2028-06-30',
      created_at: '2025-02-01'
    },
    {
      id: 3,
      title: 'Путешествие',
      target_amount: 200000,
      current_amount: 50000,
      deadline: '2027-09-01',
      created_at: '2025-03-10'
    }
  ],

  transactions: [
    { id: 1, date: '2026-09-24', description: 'Зарплата', amount: 150000, type: 'credit' },
    { id: 2, date: '2026-09-22', description: 'Продукты', amount: -15000, type: 'debit' },
    { id: 3, date: '2026-09-20', description: 'Коммунальные услуги', amount: -8500, type: 'debit' },
    { id: 4, date: '2026-09-18', description: 'Покупки', amount: -25000, type: 'debit' },
    { id: 5, date: '2026-09-15', description: 'Перевод с накоплений', amount: 50000, type: 'credit' }
  ],

  aiResponses: {
    'баланс': {
      text: 'В демонстрационном кабинете баланс составляет 250 000 ₸. Это учебные данные, а не банковский счёт.',
      suggested_action: null
    },
    'помоги с целями': {
      text: 'Начните с финансовой подушки: определите комфортную сумму ежемесячного взноса. В этой демоверсии цели можно создать в кабинете.',
      suggested_action: null
    },
    'создай новую цель': {
      text: 'Откройте личный кабинет и нажмите «Создать цель». Цель сохранится в этом браузере.',
      suggested_action: null
    }
  },

  logs: [
    { id: 1, user_id: 1, action_type: 'update_goal_contribution', timestamp: '2026-09-24 14:30:00', status: 'completed' },
    { id: 2, user_id: 1, action_type: 'create_goal', timestamp: '2026-09-22 10:15:00', status: 'completed' },
    { id: 3, user_id: 2, action_type: 'balance_check', timestamp: '2026-09-20 16:45:00', status: 'completed' }
  ]
};

/**
 * Set base URL for API
 * @param {string} url - New base URL
 */
export function setBaseUrl(url) {
  BASE_URL = url;
}

/**
 * Toggle mock mode
 * @param {boolean} useMock - Enable/disable mock mode
 */
export function setMockMode(useMock) {
  USE_MOCK = useMock;
}

/**
 * Get current mock mode status
 * @returns {boolean}
 */
export function isMockMode() {
  return USE_MOCK;
}

export function isAIEnabled() {
  return Boolean(CHAT_ENDPOINT);
}

/**
 * Get authentication headers
 * @returns {Object} Headers object with authorization
 */
export function authHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

/**
 * Generic GET request
 * @param {string} path - API endpoint path
 * @returns {Promise<any>}
 */
export async function get(path) {
  if (USE_MOCK) {
    return mockGet(path);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: authHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
}

/**
 * Generic POST request
 * @param {string} path - API endpoint path
 * @param {Object} body - Request body
 * @returns {Promise<any>}
 */
export async function post(path, body) {
  if (USE_MOCK) {
    return mockPost(path, body);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
}

/**
 * Login user
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user_id: number, access_token: string}>}
 */
export async function login(email, password) {
  return post('/auth/login', { email, password });
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<{user_id: number, access_token: string}>}
 */
export async function register(userData) {
  return post('/auth/register', userData);
}

/**
 * Send message to AI
 * @param {number} userId 
 * @param {string} message 
 * @returns {Promise<{text: string, suggested_action?: Object}>}
 */
export async function sendAIMessage(userId, message, history = []) {
  if (CHAT_ENDPOINT) {
    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
      signal: AbortSignal.timeout(25000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Помощник временно недоступен. Попробуйте позже.');
    }
    return data;
  }
  return post('/ai/message', { user_id: userId, message });
}

/**
 * Execute AI suggested action
 * @param {number} userId 
 * @param {Object} action 
 * @returns {Promise<{success: boolean, result: any}>}
 */
export async function executeAIAction(userId, action) {
  return post('/ai/execute', { user_id: userId, action });
}

/**
 * Get user goals
 * @param {number} userId 
 * @returns {Promise<Array>}
 */
export async function getUserGoals(userId) {
  return get(`/users/${userId}/goals`);
}

/**
 * Create new goal
 * @param {number} userId 
 * @param {Object} goalData 
 * @returns {Promise<Object>}
 */
export async function createGoal(userId, goalData) {
  return post(`/users/${userId}/goals`, goalData);
}

/**
 * Get user transactions
 * @param {number} userId 
 * @returns {Promise<Array>}
 */
export async function getUserTransactions(userId) {
  return get(`/users/${userId}/transactions`);
}

/**
 * Get admin logs
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>}
 */
export async function getAdminLogs(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return get(`/admin/logs${query ? '?' + query : ''}`);
}

// ============= MOCK FUNCTIONS =============

function demoGoalsKey() {
  try {
    const email = JSON.parse(localStorage.getItem('user_data') || 'null')?.email || 'guest';
    return `zaman_demo_goals:${email.toLowerCase()}`;
  } catch {
    return 'zaman_demo_goals:guest';
  }
}

function mockGet(path) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (path.includes('/goals')) {
        resolve(JSON.parse(localStorage.getItem(demoGoalsKey()) || 'null') || MOCK_DATA.goals);
      } else if (path.includes('/transactions')) {
        resolve(MOCK_DATA.transactions);
      } else if (path.includes('/admin/logs')) {
        const params = new URLSearchParams(path.split('?')[1] || '');
        resolve(MOCK_DATA.logs.filter(log => [...params].every(([key, value]) => !value || String(log[key]) === value)));
      } else {
        resolve({ message: 'Mock GET response' });
      }
    }, 500);
  });
}

function mockPost(path, body) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (path.includes('/auth/login')) {
        const saved = JSON.parse(localStorage.getItem('zaman_demo_profile') || 'null');
        const user = saved?.email === body.email ? saved : { ...MOCK_DATA.user, email: body.email, name: body.email.split('@')[0] };
        resolve({
          user_id: user.id,
          access_token: MOCK_DATA.token,
          user
        });
      } else if (path.includes('/auth/register')) {
        const user = { ...MOCK_DATA.user, name: body.name.trim(), email: body.email.trim() };
        localStorage.setItem('zaman_demo_profile', JSON.stringify(user));
        resolve({
          user_id: user.id,
          access_token: MOCK_DATA.token,
          user
        });
      } else if (path.includes('/ai/message')) {
        const message = body.message.toLowerCase();
        let response = { text: 'Это демонстрационный помощник. Я могу рассказать о балансе и целях. Реальные операции здесь недоступны.', suggested_action: null };

        for (const [key, value] of Object.entries(MOCK_DATA.aiResponses)) {
          if (message.includes(key.toLowerCase())) {
            response = value;
            break;
          }
        }

        resolve(response);
      } else if (path.includes('/ai/execute')) {
        resolve({
          success: true,
          result: { message: 'Action executed successfully' }
        });
      } else if (path.includes('/goals')) {
        const goals = JSON.parse(localStorage.getItem(demoGoalsKey()) || 'null') || [...MOCK_DATA.goals];
        const newGoal = {
          id: Math.max(0, ...goals.map(goal => goal.id)) + 1,
          ...body,
          current_amount: 0,
          created_at: new Date().toISOString().split('T')[0]
        };
        goals.push(newGoal);
        localStorage.setItem(demoGoalsKey(), JSON.stringify(goals));
        resolve(newGoal);
      } else {
        resolve({ message: 'Mock POST response' });
      }
    }, 500);
  });
}

export default {
  setBaseUrl,
  setMockMode,
  isMockMode,
  authHeaders,
  get,
  post,
  login,
  register,
  sendAIMessage,
  executeAIAction,
  getUserGoals,
  createGoal,
  getUserTransactions,
  getAdminLogs
};

