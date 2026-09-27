/**
 * Zaman Bank - Animations Module
 * Handle page animations and effects
 */

/**
 * Initialize hero animations
 */
export function initHeroAnimation() {
  const hero = document.querySelector('.hero');

  if (hero) {
    hero.classList.add('hero-animated');

    const heroContent = hero.querySelector('.hero-content');
    if (heroContent) {
      heroContent.classList.add('fade-in');
    }
  }
}

/**
 * Animate cards on scroll
 */
export function initCardAnimations() {
  const cards = document.querySelectorAll('.card.scroll-reveal');

  cards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
  });
}

/**
 * Animate stagger items
 */
export function initStaggerAnimation() {
  const items = document.querySelectorAll('.stagger-item');

  items.forEach((item, index) => {
    item.style.animationDelay = `${index * 0.1}s`;
  });
}

/**
 * Pulse animation for microphone button
 * @param {HTMLElement} element 
 * @param {boolean} active 
 */
export function toggleMicPulse(element, active) {
  if (active) {
    element.classList.add('mic-active');
  } else {
    element.classList.remove('mic-active');
  }
}

/**
 * Smooth scroll to element
 * @param {string} selector 
 */
export function scrollToElement(selector) {
  const element = document.querySelector(selector);

  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Number counter animation
 * @param {HTMLElement} element 
 * @param {number} target 
 * @param {number} duration - Duration in ms
 */
export function animateNumber(element, target, duration = 1000) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;

    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    element.textContent = Math.floor(current);
  }, 16);
}

/**
 * Fade in element
 * @param {HTMLElement} element 
 */
export function fadeIn(element) {
  element.classList.add('fade-in');
}

/**
 * Slide up element
 * @param {HTMLElement} element 
 */
export function slideUp(element) {
  element.classList.add('slide-up');
}

/**
 * Initialize page transition
 */
export function initPageTransition() {
  document.body.classList.add('page-transition');
}

/**
 * Initialize all animations
 */
export function init() {
  initPageTransition();
  initHeroAnimation();
  initCardAnimations();
  initStaggerAnimation();
}

export default {
  init,
  initHeroAnimation,
  initCardAnimations,
  initStaggerAnimation,
  toggleMicPulse,
  scrollToElement,
  animateNumber,
  fadeIn,
  slideUp
};

