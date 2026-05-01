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
    burgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    body.classList.toggle('no-scroll');
  }

  burgerBtn.addEventListener('click', toggleMenu);

  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileMenu.classList.contains('active')) {
        toggleMenu();
      }
    });
  });
});