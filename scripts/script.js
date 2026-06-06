(function() {
  'use strict';

  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      let currentElement = this;
      while (currentElement) {
        if (currentElement.matches(selector)) return currentElement;
        currentElement = currentElement.parentElement;
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
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach((accordionItem) => {
      const accordionHeader = accordionItem.querySelector('.accordion-header');
      if (!accordionHeader) return;

      accordionHeader.addEventListener('click', function(event) {
        event = event || window.event;
        if (event.preventDefault) event.preventDefault();

        const isAccordionOpen = accordionItem.classList.contains('active');

        accordionItems.forEach((otherItem) => {
          const otherBody = otherItem.querySelector('.accordion-body');
          otherItem.classList.remove('active');
          if (otherBody) otherBody.style.maxHeight = null;

          const otherHeader = otherItem.querySelector('.accordion-header');
          if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
        });

        if (!isAccordionOpen) {
          const currentBody = accordionItem.querySelector('.accordion-body');
          if (currentBody) {
            accordionItem.classList.add('active');
            currentBody.style.maxHeight = `${currentBody.scrollHeight}px`;
            accordionHeader.setAttribute('aria-expanded', 'true');
          }
        }
      });
    });

    window.addEventListener('resize', function() {
      const activeAccordionItems = document.querySelectorAll('.accordion-item.active');
      activeAccordionItems.forEach((activeItem) => {
        const activeBody = activeItem.querySelector('.accordion-body');
        if (activeBody) activeBody.style.maxHeight = `${activeBody.scrollHeight}px`;
      });
    });
  }

  function initMobileMenu() {
    const burgerButton = document.getElementById('burgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const pageBody = document.body;
    const mobileMenuLinks = document.querySelectorAll('.nav-list-mobile a');
    const mobileMenuActionButton = mobileMenu ? mobileMenu.querySelector('.btn-primary') : null;

    if (!burgerButton || !mobileMenu) return;

    function toggleMobileMenu() {
      const isOpening = !mobileMenu.classList.contains('active');

      if (isOpening) {
        const scrollBarWidth = getScrollbarWidth();
        if (scrollBarWidth > 0) pageBody.style.paddingRight = `${scrollBarWidth}px`;
        pageBody.classList.add('no-scroll');
        burgerButton.setAttribute('aria-expanded', 'true');
      } else {
        pageBody.classList.remove('no-scroll');
        pageBody.style.paddingRight = '';
        burgerButton.setAttribute('aria-expanded', 'false');
      }

      burgerButton.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    }

    function closeMobileMenu() {
      pageBody.classList.remove('no-scroll');
      pageBody.style.paddingRight = '';
      burgerButton.classList.remove('active');
      mobileMenu.classList.remove('active');
      burgerButton.setAttribute('aria-expanded', 'false');
    }

    burgerButton.addEventListener('click', function(event) {
      event = event || window.event;
      if (event.preventDefault) event.preventDefault();
      toggleMobileMenu();
    });

    mobileMenuLinks.forEach((menuLink) => {
      menuLink.addEventListener('click', closeMobileMenu);
    });

    if (mobileMenuActionButton) {
      mobileMenuActionButton.addEventListener('click', closeMobileMenu);
    }

    document.addEventListener('keydown', function(event) {
      event = event || window.event;
      const escapeKey = event.keyCode || event.which;
      if (escapeKey === 27 && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
      }
    });

    mobileMenu.addEventListener('click', function(event) {
      if (event.target === mobileMenu) closeMobileMenu();
    });
  }

  function initYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
  }

})();