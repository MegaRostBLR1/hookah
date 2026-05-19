(function() {
  'use strict';

  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      var el = this;
      while (el) {
        if (el.matches(selector)) return el;
        el = el.parentElement;
      }
      return null;
    };
  }

  function onDOMReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  onDOMReady(function() {
    initAccordion();
    initMobileMenu();
    initYear();
  });

  function initAccordion() {
    var accordionItems = document.querySelectorAll('.accordion-item');
    for (var i = 0; i < accordionItems.length; i++) {
      (function(item) {
        var header = item.querySelector('.accordion-header');
        if (!header) return;

        header.addEventListener('click', function(e) {
          e = e || window.event;
          if (e.preventDefault) e.preventDefault();

          var isOpen = item.classList.contains('active');

          for (var j = 0; j < accordionItems.length; j++) {
            var otherItem = accordionItems[j];
            var otherBody = otherItem.querySelector('.accordion-body');
            otherItem.classList.remove('active');
            if (otherBody) otherBody.style.maxHeight = null;
            var otherHeader = otherItem.querySelector('.accordion-header');
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
          }

          if (!isOpen) {
            var body = item.querySelector('.accordion-body');
            if (body) {
              item.classList.add('active');
              body.style.maxHeight = body.scrollHeight + 'px';
              header.setAttribute('aria-expanded', 'true');
            }
          }
        });
      })(accordionItems[i]);
    }

    window.addEventListener('resize', function() {
      var activeItems = document.querySelectorAll('.accordion-item.active');
      for (var k = 0; k < activeItems.length; k++) {
        var body = activeItems[k].querySelector('.accordion-body');
        if (body) body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  }

  function initMobileMenu() {
    var burgerBtn = document.getElementById('burgerBtn');
    var mobileMenu = document.getElementById('mobileMenu');
    var body = document.body;
    var menuLinks = document.querySelectorAll('.nav-list-mobile a');
    var menuCallButton = mobileMenu.querySelector('.btn-primary');

    if (!burgerBtn || !mobileMenu) return;

    function toggleMenu() {
      var isOpening = !mobileMenu.classList.contains('active');
      if (isOpening) {
        var scrollBarWidth = getScrollbarWidth();
        if (scrollBarWidth > 0) body.style.paddingRight = scrollBarWidth + 'px';
        body.classList.add('no-scroll');
        burgerBtn.setAttribute('aria-expanded', 'true');
      } else {
        body.classList.remove('no-scroll');
        body.style.paddingRight = '';
        burgerBtn.setAttribute('aria-expanded', 'false');
      }
      burgerBtn.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    }

    function closeMenu() {
      body.classList.remove('no-scroll');
      body.style.paddingRight = '';
      burgerBtn.classList.remove('active');
      mobileMenu.classList.remove('active');
      burgerBtn.setAttribute('aria-expanded', 'false');
    }

    burgerBtn.addEventListener('click', function(e) {
      e = e || window.event;
      if (e.preventDefault) e.preventDefault();
      toggleMenu();
    });

    for (var l = 0; l < menuLinks.length; l++) {
      menuLinks[l].addEventListener('click', function() { closeMenu(); });
    }

    if (menuCallButton) {
      menuCallButton.addEventListener('click', function() { closeMenu(); });
    }

    document.addEventListener('keydown', function(e) {
      e = e || window.event;
      if ((e.keyCode || e.which) === 27 && mobileMenu.classList.contains('active')) closeMenu();
    });
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu) closeMenu();
    });
  }

  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

})();