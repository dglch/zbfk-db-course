(function () {
  'use strict';

  var config = window.COURSE_CONFIG || {};
  var root = document.documentElement;
  var hubUrl = new URL('../index.html', document.currentScript.src).href;
  var preview = readPreview();

  var LOCK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  function isClosed(key) {
    return Number(config[key]) === 0;
  }

  function readPreview() {
    var params = new URLSearchParams(window.location.search);
    if (params.has('preview')) {
      var on = params.get('preview') !== '0';
      try {
        if (on) sessionStorage.setItem('coursePreview', '1');
        else sessionStorage.removeItem('coursePreview');
      } catch (e) {}
      return on;
    }
    try {
      return sessionStorage.getItem('coursePreview') === '1';
    } catch (e) {
      return false;
    }
  }

  var pageKey = root.dataset.courseItem;
  var pageLocked = Boolean(pageKey) && isClosed(pageKey) && !preview;
  if (pageLocked) root.classList.add('is-access-locked');

  function renderLockScreen() {
    var what = pageKey === 'intro' ? 'Лекцію' : 'Практичну';
    var screen = document.createElement('div');
    screen.className = 'access-lock-screen';
    screen.innerHTML =
      '<div class="access-lock-card">' +
        '<div class="access-lock-icon">' + LOCK_SVG + '</div>' +
        '<h1 class="access-lock-title">' + what + ' ще не відкрито</h1>' +
        '<p class="access-lock-text">Матеріал стане доступним ближче до заняття. ' +
        'Поки що можна повторити те, що вже відкрито на головній сторінці курсу.</p>' +
        '<a class="m3-btn m3-btn-primary" href="' + hubUrl + '">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>' +
          '<span>На головну курсу</span>' +
        '</a>' +
      '</div>';
    document.body.appendChild(screen);
  }

  function lockHubCard(card) {
    var badge = card.querySelector('.hub-card-badge');

    if (preview) {
      if (badge) {
        badge.className = 'hub-card-badge badge-soon';
        badge.textContent = 'Закрито';
      }
      return;
    }

    card.classList.remove('active-card', 'practical-card');
    card.classList.add('locked-card');
    if (badge) {
      badge.className = 'hub-card-badge badge-soon';
      badge.textContent = 'Скоро';
    }
    var link = card.querySelector('a.hub-card-btn');
    if (link) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hub-card-btn hub-btn-disabled';
      btn.disabled = true;
      btn.innerHTML = LOCK_SVG + '<span>Ще не відкрито</span>';
      link.replaceWith(btn);
    }
  }

  function renderPreviewPill() {
    var pill = document.createElement('div');
    pill.className = 'access-preview-pill';
    pill.innerHTML = '<span>Режим викладача</span>' +
      '<a href="?preview=0">Вийти</a>';
    document.body.appendChild(pill);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (pageLocked) renderLockScreen();

    document.querySelectorAll('.hub-card[data-course-item]').forEach(function (card) {
      if (isClosed(card.dataset.courseItem)) lockHubCard(card);
    });

    if (preview) renderPreviewPill();
  });
})();
