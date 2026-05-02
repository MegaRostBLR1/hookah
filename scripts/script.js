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
  let scrollPos = 0;

  function toggleMenu() {
    const willBeActive = !mobileMenu.classList.contains('active');

    if (willBeActive) {
      scrollPos = window.scrollY;
      body.style.top = `-${scrollPos}px`;
      body.classList.add('no-scroll');
    } else {
      body.classList.remove('no-scroll');
      body.style.top = '';
      window.scrollTo(0, scrollPos);
    }

    burgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
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