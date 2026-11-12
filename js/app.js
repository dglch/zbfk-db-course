/**
 * Presentation Engine — shared by every slide page (intro, practicals/lab-XX).
 *
 * - Slide navigation: arrows, Space, PageUp/PageDown, Home/End, touch swipe, URL hash (#slide-N)
 * - Interactive modules: any element with data-module="Name" links the slide to a global
 *   object window.Name. Its optional init() runs once on page load; its optional render()
 *   runs every time a slide containing that element becomes active.
 * - Copy buttons: any .code-copy-btn inside a .code-box copies the text of the box's <pre>.
 */

class Presentation {
  constructor() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.totalSlides = this.slides.length;
    this.currentIndex = 0;

    // Elements
    this.progressBar = document.getElementById('progress-bar');
    this.slideCounter = document.getElementById('slide-counter');

    this.touchStartX = 0;
    this.touchEndX = 0;

    this.init();
  }

  init() {
    this.bindEvents();
    this.initModules();

    // Check initial hash or start at slide 0
    const hashIndex = this.getIndexFromHash();
    this.goToSlide(hashIndex !== null ? hashIndex : 0, false);
  }

  /** Returns the global module objects referenced by data-module inside `root`. */
  getModules(root) {
    const names = new Set(
      Array.from(root.querySelectorAll('[data-module]'), (el) => el.dataset.module)
    );
    return Array.from(names)
      .map((name) => {
        const mod = window[name];
        if (!mod) console.warn(`[Presentation] data-module="${name}": window.${name} is not defined`);
        return mod;
      })
      .filter(Boolean);
  }

  initModules() {
    this.getModules(document).forEach((mod) => {
      if (typeof mod.init === 'function') mod.init();
    });
  }

  bindEvents() {
    // Keyboard navigation
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Hash change
    window.addEventListener('hashchange', () => {
      const idx = this.getIndexFromHash();
      if (idx !== null && idx !== this.currentIndex) {
        this.goToSlide(idx, false);
      }
    });

    // Touch navigation (mobile / tablet swipe)
    window.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    // Bottom bar navigation buttons
    document.getElementById('btn-prev')?.addEventListener('click', () => this.prev());
    document.getElementById('btn-next')?.addEventListener('click', () => this.next());
  }

  handleKeyDown(e) {
    // Don't hijack keys while the user is typing or picking a value in a form control
    const t = e.target;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ': // Space
        e.preventDefault();
        this.next();
        break;

      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        this.prev();
        break;

      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;

      case 'End':
        e.preventDefault();
        this.goToSlide(this.totalSlides - 1);
        break;
    }
  }

  handleSwipe() {
    const diff = this.touchEndX - this.touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  goToSlide(index, updateHash = true) {
    if (index < 0) index = 0;
    if (index >= this.totalSlides) index = this.totalSlides - 1;

    this.slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === index);
    });

    this.currentIndex = index;

    // Progress & Counter
    const progressPercent = ((index + 1) / this.totalSlides) * 100;
    if (this.progressBar) this.progressBar.style.width = `${progressPercent}%`;
    if (this.slideCounter) {
      this.slideCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(this.totalSlides).padStart(2, '0')}`;
    }

    // Update URL hash
    if (updateHash) {
      window.location.hash = `slide-${index + 1}`;
    }

    // Re-render interactive modules placed on the newly active slide
    const activeSlide = this.slides[index];
    if (activeSlide) {
      this.getModules(activeSlide).forEach((mod) => {
        if (typeof mod.render === 'function') mod.render();
      });
    }
  }

  next() {
    if (this.currentIndex < this.totalSlides - 1) {
      this.goToSlide(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.goToSlide(this.currentIndex - 1);
    }
  }

  getIndexFromHash() {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10) - 1;
      if (num >= 0 && num < this.totalSlides) return num;
    }
    return null;
  }
}

/* ==========================================================================
   Copy-to-clipboard for code boxes
   Markup: <div class="code-box"> ... <button class="code-copy-btn"><svg/><span>Копіювати</span></button> ... <pre>…</pre></div>
   ========================================================================== */

/**
 * The async Clipboard API only works in secure contexts (https://, localhost).
 * In a classroom the page may be opened via file:// or a LAN IP over http,
 * so fall back to a hidden <textarea> + execCommand('copy').
 */
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    ta.remove();
    if (ok) resolve(); else reject(new Error('execCommand("copy") failed'));
  });
}

function initCodeCopyButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.code-copy-btn');
    if (!btn) return;

    const pre = btn.closest('.code-box')?.querySelector('pre');
    if (!pre) return;

    const label = btn.querySelector('span');
    if (label && !label.dataset.originalText) {
      label.dataset.originalText = label.textContent;
    }

    const showState = (text, className) => {
      btn.classList.add(className);
      if (label) label.textContent = text;
      clearTimeout(btn._copyResetTimer);
      btn._copyResetTimer = setTimeout(() => {
        btn.classList.remove(className);
        if (label) label.textContent = label.dataset.originalText;
      }, 2000);
    };

    copyText(pre.innerText)
      .then(() => showState('Скопійовано!', 'copied'))
      .catch((err) => {
        console.error('Copy failed:', err);
        showState('Не вдалося скопіювати', 'copy-failed');
      });
  });
}

// Start presentation on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initCodeCopyButtons();
  if (document.querySelector('.slide')) {
    window.presentation = new Presentation();
  }
});
