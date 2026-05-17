(function() {
  'use strict';

  // Polyfill для Element.matches (IE11)
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }
  // Polyfill для Element.closest (IE11)
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

  // Кроссбраузерный DOM Ready
  function onDOMReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // Утилита: ширина скроллбара
  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  // ===== MAIN INIT =====
  onDOMReady(function() {
    initAccordion();
    initMobileMenu();
    initYear();
    initSmoothScroll();
  });

  // ===== АККОРДЕОН =====
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

          // Закрыть все
          for (var j = 0; j < accordionItems.length; j++) {
            var otherItem = accordionItems[j];
            var otherBody = otherItem.querySelector('.accordion-body');
            otherItem.classList.remove('active');
            if (otherBody) otherBody.style.maxHeight = null;
            var otherHeader = otherItem.querySelector('.accordion-header');
            if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
          }

          // Открыть текущий
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

    // Пересчёт при ресайзе
    window.addEventListener('resize', function() {
      var activeItems = document.querySelectorAll('.accordion-item.active');
      for (var k = 0; k < activeItems.length; k++) {
        var body = activeItems[k].querySelector('.accordion-body');
        if (body) body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  }

  // ===== МОБИЛЬНОЕ МЕНЮ =====
  function initMobileMenu() {
    var burgerBtn = document.getElementById('burgerBtn');
    var mobileMenu = document.getElementById('mobileMenu');
    var body = document.body;
    var menuLinks = document.querySelectorAll('.nav-list-mobile a');

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

    // Escape & Overlay click
    document.addEventListener('keydown', function(e) {
      e = e || window.event;
      if ((e.keyCode || e.which) === 27 && mobileMenu.classList.contains('active')) closeMenu();
    });
    mobileMenu.addEventListener('click', function(e) {
      if (e.target === mobileMenu) closeMenu();
    });
  }

  // ===== ГОД В ФУТЕРЕ =====
  function initYear() {
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // ===== ПЛАВНЫЙ СКРОЛЛ (FALLBACK) =====
  function initSmoothScroll() {
    var supportsSmoothScroll = 'scrollBehavior' in document.documentElement.style;
    var anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');

    for (var i = 0; i < anchorLinks.length; i++) {
      anchorLinks[i].addEventListener('click', function(e) {
        e = e || window.event;
        var targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;
        var targetEl = document.querySelector(targetId);
        if (!targetEl) return;
        if (e.preventDefault) e.preventDefault();

        var headerOffset = 80;
        var rect = targetEl.getBoundingClientRect();
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        var offsetPosition = rect.top + scrollTop - headerOffset;

        if (supportsSmoothScroll) {
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        } else {
          smoothScrollFallback(offsetPosition, 800);
        }
      });
    }
  }

  function smoothScrollFallback(to, duration) {
    var start = window.pageYOffset || document.documentElement.scrollTop || 0;
    var change = to - start;
    var currentTime = 0;
    var increment = 16;

    function animate() {
      currentTime += increment;
      var val = easeInOutQuad(currentTime, start, change, duration);
      window.scrollTo(0, val);
      if (currentTime < duration) setTimeout(animate, increment);
    }
    animate();
  }

  function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

})();