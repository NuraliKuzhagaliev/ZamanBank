/**
 * Zaman Bank - Validation Module
 * Form validation utilities
 */

/**
 * Validate email
 * @param {string} email 
 * @returns {{ok: boolean, message: string}}
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return { ok: false, message: 'Email обязателен' };
  }

  if (!re.test(email)) {
    return { ok: false, message: 'Неверный формат email' };
  }

  return { ok: true, message: '' };
}

/**
 * Validate password
 * @param {string} password 
 * @returns {{ok: boolean, message: string}}
 */
export function validatePassword(password) {
  if (!password) {
    return { ok: false, message: 'Пароль обязателен' };
  }

  if (password.length < 6) {
    return { ok: false, message: 'Пароль должен содержать минимум 6 символов' };
  }

  return { ok: true, message: '' };
}

/**
 * Validate required field
 * @param {string} value 
 * @param {string} fieldName 
 * @returns {{ok: boolean, message: string}}
 */
export function validateRequired(value, fieldName = 'Поле') {
  if (!value || value.trim() === '') {
    return { ok: false, message: `${fieldName} обязательно` };
  }

  return { ok: true, message: '' };
}

/**
 * Validate number
 * @param {string|number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {{ok: boolean, message: string}}
 */
export function validateNumber(value, min = null, max = null) {
  const num = parseFloat(value);

  if (isNaN(num)) {
    return { ok: false, message: 'Введите корректное число' };
  }

  if (min !== null && num < min) {
    return { ok: false, message: `Минимальное значение: ${min}` };
  }

  if (max !== null && num > max) {
    return { ok: false, message: `Максимальное значение: ${max}` };
  }

  return { ok: true, message: '' };
}

/**
 * Validate date
 * @param {string} dateString 
 * @returns {{ok: boolean, message: string}}
 */
export function validateDate(dateString) {
  if (!dateString) {
    return { ok: false, message: 'Дата обязательна' };
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return { ok: false, message: 'Неверный формат даты' };
  }

  if (dateString < new Date().toISOString().slice(0, 10)) {
    return { ok: false, message: 'Выберите будущую дату' };
  }

  return { ok: true, message: '' };
}

/**
 * Show validation error on input
 * @param {HTMLElement} input 
 * @param {string} message 
 */
export function showError(input, message) {
  input.classList.add('error');

  let errorEl = input.parentElement.querySelector('.form-error');

  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    input.parentElement.appendChild(errorEl);
  }

  errorEl.textContent = window.ZamanI18n?.t(message) || message;
}

/**
 * Clear validation error from input
 * @param {HTMLElement} input 
 */
export function clearError(input) {
  input.classList.remove('error');

  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.remove();
  }
}

/**
 * Validate form
 * @param {HTMLFormElement} form 
 * @param {Object} rules - Validation rules
 * @returns {boolean}
 */
export function validateForm(form, rules) {
  let isValid = true;

  for (const [fieldName, validators] of Object.entries(rules)) {
    const input = form.elements[fieldName];

    if (!input) continue;

    clearError(input);

    for (const validator of validators) {
      const result = validator(input.value);

      if (!result.ok) {
        showError(input, result.message);
        isValid = false;
        break;
      }
    }
  }

  return isValid;
}

export default {
  validateEmail,
  validatePassword,
  validateRequired,
  validateNumber,
  validateDate,
  showError,
  clearError,
  validateForm
};

