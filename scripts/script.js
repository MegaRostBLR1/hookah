document.addEventListener('DOMContentLoaded', () => {
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');

      // Закрываем все открытые секции
      accordionItems.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.accordion-body').style.maxHeight = null;
      });

      // Если кликнули по закрытой — открываем её
      if (!isOpen) {
        item.classList.add('active');
        const body = item.querySelector('.accordion-body');
        body.style.maxHeight = body.scrollHeight + "px";
      }
    });
  });
});