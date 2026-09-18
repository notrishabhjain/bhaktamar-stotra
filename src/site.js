/**
 * The only client-side behaviour on the site: on touch devices there is no
 * hover, so the first tap flips a card to reveal its yantra and the second
 * tap opens the shloka. Tapping elsewhere flips the open card back.
 */
(function () {
  'use strict';

  var cards = document.querySelectorAll('[data-card]');
  if (!cards.length) return;

  var hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hasHover) return;

  var flipped = null;

  function unflip() {
    if (flipped) {
      flipped.classList.remove('is-flipped');
      flipped = null;
    }
  }

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
})();
