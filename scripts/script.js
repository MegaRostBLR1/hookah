document.addEventListener('DOMContentLoaded', () => {
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      accordionItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.accordion-body').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('active');
        const body = item.querySelector('.accordion-body');
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });

  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const body = document.body;
  const menuLinks = document.querySelectorAll('.nav-list-mobile a');

  function toggleMenu() {
    const isOpening = !mobileMenu.classList.contains('active');

    if (isOpening) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      body.style.paddingRight = `${scrollBarWidth}px`;
      body.classList.add('no-scroll');
    } else {
      body.classList.remove('no-scroll');
      body.style.paddingRight = '';
    }

    burgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  }

  function closeMenu() {
    body.classList.remove('no-scroll');
    body.style.paddingRight = '';
    burgerBtn.classList.remove('active');
    mobileMenu.classList.remove('active');
  }

  burgerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleMenu();
  });

  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  const year = document.getElementById('year');
  year.innerText = new Date().getFullYear();
});