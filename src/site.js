/**
 * All client-side behaviour on the site. Everything here is progressive —
 * with JavaScript off, every page still reads and every link still works.
 */
(function () {
  'use strict';

  var prefix = (document.body && document.body.getAttribute('data-prefix')) || '';

  /* ---------------------------------------------- tap-to-flip on touch */

  var cards = document.querySelectorAll('[data-card]');
  if (cards.length && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var flipped = null;

    var unflip = function () {
      if (flipped) {
        flipped.classList.remove('is-flipped');
        flipped = null;
      }
    };

    Array.prototype.forEach.call(cards, function (card) {
      card.addEventListener('click', function (event) {
        if (flipped === card) return; // second tap follows the link
        event.preventDefault();
        unflip();
        card.classList.add('is-flipped');
        flipped = card;
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('[data-card]')) unflip();
    });
  }

  /* ------------------------------------------- arrow keys between verses */

  var prevLink = document.querySelector('a[rel="prev"]');
  var nextLink = document.querySelector('a[rel="next"]');
  if (prevLink || nextLink) {
    document.addEventListener('keydown', function (event) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || event.target.isContentEditable) return;
      if (event.key === 'ArrowLeft' && prevLink) window.location.href = prevLink.href;
      if (event.key === 'ArrowRight' && nextLink) window.location.href = nextLink.href;
    });
  }

  /* --------------------------------------------------- reading text size */

  var control = document.querySelector('[data-textsize-control]');
  if (control) {
    var root = document.documentElement;

    var mark = function (size) {
      var buttons = control.querySelectorAll('[data-textsize]');
      Array.prototype.forEach.call(buttons, function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-textsize') === size));
      });
    };

    var stored = 'md';
    try {
      stored = localStorage.getItem('bhaktamar:textsize') || 'md';
    } catch (e) {}

    control.removeAttribute('hidden');
    if (stored !== 'md') root.setAttribute('data-textsize', stored);
    mark(stored);

    control.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-textsize]');
      if (!btn) return;
      var size = btn.getAttribute('data-textsize');
      if (size === 'md') root.removeAttribute('data-textsize');
      else root.setAttribute('data-textsize', size);
      mark(size);
      try {
        localStorage.setItem('bhaktamar:textsize', size);
      } catch (e) {}
    });
  }

  /* ------------------------------------------------------ verse for today */

  var todayBox = document.querySelector('[data-today]');
  var todayData = document.querySelector('[data-today-data]');
  if (todayBox && todayData) {
    var render = function () {
      try {
        var list = JSON.parse(todayData.textContent);
        var now = new Date();
        /**
         * Day number from the LOCAL calendar date, so the verse turns over at
         * local midnight. Dividing Date.now() by a day length instead would
         * roll it over at 00:00 UTC — which is 05:30 in India, leaving early
         * risers on yesterday's verse.
         */
        var day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
        var pick = list[((day % list.length) + list.length) % list.length];
        var link = todayBox.querySelector('[data-today-link]');
        link.setAttribute('href', pick.s + '/');
        todayBox.querySelector('[data-today-number]').textContent = 'श्लोक ' + pick.n;
        todayBox.querySelector('[data-today-title]').textContent = pick.t;
        todayBox.querySelector('[data-today-state]').textContent = pick.f;

        var dateEl = todayBox.querySelector('[data-today-date]');
        if (dateEl) {
          try {
            dateEl.textContent = now.toLocaleDateString('hi-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          } catch (e) {
            dateEl.textContent = '';
          }
        }
        todayBox.removeAttribute('hidden');
        return day;
      } catch (e) {
        return null; /* leave the panel hidden */
      }
    };

    var shownDay = render();

    /**
     * A tab left open overnight would otherwise still show yesterday's verse.
     * Re-check whenever the page is looked at again, and repaint only if the
     * date actually turned over.
     */
    var recheck = function () {
      if (document.visibilityState !== 'visible') return;
      var now = new Date();
      var day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
      if (day !== shownDay) shownDay = render();
    };
    document.addEventListener('visibilitychange', recheck);
    window.addEventListener('focus', recheck);
    window.addEventListener('pageshow', recheck);
  }

  /* ----------------------------------------------------- offline support */

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(new URL(prefix + 'sw.js', window.location.href)).catch(function () {
        /* offline support is optional */
      });
    });
  }
})();
