/**
 * Zaman Bank - Authentication Module
 * Handles user authentication and session management
 */

import * as api from './api.js';
import { showToast } from './ui.js';

/**
 * Initialize auth module
 */
export function init() {
  // Check if user is logged in on protected pages
  const protectedPages = ['dashboard.html', 'admin_panel.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (protectedPages.includes(currentPage) && !isLoggedIn()) {
    window.location.href = 'login.html';
  }

  // Update UI based on auth state
  updateAuthUI();
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  return !!localStorage.getItem('access_token');
}

/**
 * Get current user ID
 * @returns {number|null}
 */
export function getCurrentUserId() {
  const userId = localStorage.getItem('user_id');
  return userId ? parseInt(userId) : null;
}

/**
 * Get current user data
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
}

/**
 * Handle login form submission
 * @param {Event} event 
 */
export async function handleLogin(event) {
  event.preventDefault();

  const form = event.target;
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const submitBtn = form.querySelector('button[type="submit"]');

  // Disable button during request
  submitBtn.disabled = true;
  submitBtn.textContent = 'Вход...';

  try {
    const response = await api.login(email, password);

    // Store auth data
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user_id', response.user_id);

    if (response.user) {
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }

    showToast('Успешный вход!', 'success');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    showToast('Ошибка входа. Проверьте данные.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Войти';
  }
}

/**
 * Handle registration form submission
 * @param {Event} event 
 */
export async function handleRegister(event) {
  event.preventDefault();

  const form = event.target;
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const confirmPassword = form.elements.confirm_password.value;
  const submitBtn = form.querySelector('button[type="submit"]');

  // Validate passwords match
  if (password !== confirmPassword) {
    showToast('Пароли не совпадают', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Регистрация...';

  try {
    const response = await api.register({ name, email, password });

    // Store auth data
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user_id', response.user_id);

    if (response.user) {
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }

    showToast('Регистрация успешна!', 'success');

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);

  } catch (error) {
    console.error('Registration error:', error);
    showToast('Ошибка регистрации. Попробуйте снова.', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Зарегистрироваться';
  }
}

/**
 * Logout user
 */
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_data');

  showToast('Вы вышли из системы', 'info');

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

/**
 * Update UI elements based on auth state
 */
function updateAuthUI() {
  const authLinks = document.querySelectorAll('[data-auth-required]');
  const guestLinks = document.querySelectorAll('[data-guest-only]');
  const userNameElements = document.querySelectorAll('[data-user-name]');

  const loggedIn = isLoggedIn();
  const user = getCurrentUser();

  authLinks.forEach(el => {
    el.style.display = loggedIn ? '' : 'none';
  });

  guestLinks.forEach(el => {
    el.style.display = loggedIn ? 'none' : '';
  });

  if (user && user.name) {
    userNameElements.forEach(el => {
      el.textContent = user.name;
    });
  }
}

export default {
  init,
  isLoggedIn,
  getCurrentUserId,
  getCurrentUser,
  handleLogin,
  handleRegister,
  logout
};

