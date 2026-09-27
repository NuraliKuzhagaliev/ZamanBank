/**
 * Zaman Bank - UI Module
 * Handles UI interactions, modals, toasts, and common components
 */

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: success, error, warning, info
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="flex-between gap-md">
      <span>${escapeHtml(message)}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="font-size: 1.2rem; color: inherit;">&times;</button>
    </div>
  `;

  document.body.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('active'), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @returns {Promise<boolean>} - Resolves to true if confirmed
 */
export function showConfirmModal(title, message, confirmText = 'Подтвердить', cancelText = 'Отмена') {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${escapeHtml(title)}</h3>
        </div>
        <div class="modal-body">
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="cancel">${escapeHtml(cancelText)}</button>
          <button class="btn btn-primary" data-action="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Show modal
    setTimeout(() => modal.classList.add('active'), 10);

    // Handle buttons
    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      closeModal(modal);
      resolve(true);
    });

    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      closeModal(modal);
      resolve(false);
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
        resolve(false);
      }
    });
  });
}

/**
 * Show info modal
 * @param {string} title - Modal title
 * @param {string} content - Modal content (HTML)
 */
export function showInfoModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-action="close">Закрыть</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('active'), 10);

  modal.querySelector('[data-action="close"]').addEventListener('click', () => {
    closeModal(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
}

/**
 * Close modal
 * @param {HTMLElement} modal 
 */
function closeModal(modal) {
  modal.classList.remove('active');
  setTimeout(() => modal.remove(), 300);
}

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container element
 */
export function showLoading(container) {
  container.innerHTML = '<div class="flex-center" style="padding: 2rem;"><div class="spinner"></div></div>';
}

/**
 * Format currency
 * @param {number} amount 
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' ₸';
}

/**
 * Format date
 * @param {string} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

/**
 * Initialize mobile menu toggle
 */
export function initMobileMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.navbar-nav');

  if (toggle && nav) {
    toggle.setAttribute('aria-expanded', 'false');
    if (!toggle.getAttribute('aria-label')) toggle.setAttribute('aria-label', 'Открыть меню');
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        nav.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/**
 * Initialize scroll animations
 */
export function initScrollAnimations() {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('revealed'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll('.scroll-reveal').forEach(el => {
    el.classList.add('will-reveal');
    observer.observe(el);
  });
}

/**
 * Update header on scroll
 */
export function initScrollHeader() {
  const header = document.querySelector('.site-header');

  if (header) {
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    });
  }
}

/**
 * Initialize common UI features
 */
export function init() {
  initMobileMenu();
  initScrollAnimations();
  initScrollHeader();
}

export default {
  showToast,
  showConfirmModal,
  showInfoModal,
  showLoading,
  formatCurrency,
  formatDate,
  init
};

