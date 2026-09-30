(function() {
  'use strict';

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function setBodyScrollLock(locked) {
    if (locked) {
      const scrollBarWidth = getScrollbarWidth();
      if (scrollBarWidth > 0) document.body.style.paddingRight = `${scrollBarWidth}px`;
      document.body.classList.add('no-scroll');
      return;
    }

    document.body.classList.remove('no-scroll');
    document.body.style.paddingRight = '';
  }

  const ORDER_ENDPOINT = '';
  const ORDER_PRODUCTS = {
    'air-one': { name: 'E-Hookah Air One', price: 590 },
    'air-one-pro': { name: 'E-Hookah Air One Pro', price: 850 }
  };

  initAccordion();
  initMobileMenu();
  initYear();
  initOrderForm();

  function initAccordion() {
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach((accordionItem) => {
      const accordionHeader = accordionItem.querySelector('.accordion-header');
      if (!accordionHeader) return;

      accordionHeader.addEventListener('click', function(event) {
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
    const mobileMenuLinks = document.querySelectorAll('.nav-list-mobile a');
    const mobileMenuActionButton = mobileMenu ? mobileMenu.querySelector('.btn-primary') : null;

    if (!burgerButton || !mobileMenu) return;

    function toggleMobileMenu() {
      const isOpening = !mobileMenu.classList.contains('active');

      if (isOpening) {
        setBodyScrollLock(true);
        burgerButton.setAttribute('aria-expanded', 'true');
        mobileMenu.setAttribute('aria-hidden', 'false');
        const firstFocusableElement = mobileMenu.querySelector('a, button');
        if (firstFocusableElement) firstFocusableElement.focus();
      } else {
        closeMobileMenu();
        return;
      }

      burgerButton.classList.add('active');
      mobileMenu.classList.add('active');
    }

    function closeMobileMenu() {
      setBodyScrollLock(false);
      burgerButton.classList.remove('active');
      mobileMenu.classList.remove('active');
      burgerButton.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      burgerButton.focus();
    }

    burgerButton.addEventListener('click', toggleMobileMenu);

    mobileMenuLinks.forEach((menuLink) => {
      menuLink.addEventListener('click', closeMobileMenu);
    });

    if (mobileMenuActionButton) {
      mobileMenuActionButton.addEventListener('click', closeMobileMenu);
    }

    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && mobileMenu.classList.contains('active')) {
        closeMobileMenu();
      }
    });

    mobileMenu.addEventListener('click', function(event) {
      if (event.target === mobileMenu) closeMobileMenu();
    });
  }

  function initOrderForm() {
    const orderCart = document.getElementById('orderCart');
    const orderCartItems = document.getElementById('orderCartItems');
    const orderCartTotal = document.getElementById('orderCartTotal');
    const orderCartClear = document.getElementById('orderCartClear');
    const orderCartClose = document.getElementById('orderCartClose');
    const headerCart = document.getElementById('headerCart');
    const headerCartCount = document.getElementById('headerCartCount');
    const openOrderModal = document.getElementById('openOrderModal');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModal = document.getElementById('closeOrderModal');
    const orderModalSummary = document.getElementById('orderModalSummary');
    const orderForm = document.getElementById('orderForm');
    const orderFormStatus = document.getElementById('orderFormStatus');
    const orderSubmit = document.getElementById('orderSubmit');
    const productOrderButtons = document.querySelectorAll('.product-order-btn');

    if (!orderCart || !orderForm) return;

    const CART_STORAGE_KEY = 'e-hookah-cart';
    const MAX_QUANTITY = 99;
    const cart = new Map();
    let lastFocusedElement = null;
    let isCartOpen = false;

    function loadCart() {
      try {
        const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');

        if (!Array.isArray(storedCart)) return;

        storedCart.forEach((item) => {
          if (
            item &&
            ORDER_PRODUCTS[item.id] &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= MAX_QUANTITY
          ) {
            cart.set(item.id, item.quantity);
          }
        });
      } catch (error) {
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
        } catch (storageError) {
          // localStorage недоступен, поэтому корзина остаётся только в памяти.
        }
      }
    }

    function saveCart() {
      try {
        const storedCart = Array.from(cart.entries()).map(([id, quantity]) => ({
          id,
          quantity
        }));

        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCart));
      } catch (error) {
        // Корзина продолжает работать в памяти, даже если localStorage недоступен.
      }
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function getCartItems() {
      return Array.from(cart.entries()).map(([id, quantity]) => ({
        id,
        quantity,
        ...ORDER_PRODUCTS[id]
      }));
    }

    function getCartTotal() {
      return getCartItems().reduce((total, item) => total + item.price * item.quantity, 0);
    }

    function formatPrice(value) {
      return new Intl.NumberFormat('ru-RU').format(value);
    }

    function renderCart() {
      const items = getCartItems();
      const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
      headerCartCount.textContent = String(totalQuantity);
      headerCart.setAttribute('aria-expanded', String(isCartOpen));
      orderCart.hidden = false;
      orderCart.inert = !isCartOpen;
      orderCart.setAttribute('aria-hidden', String(!isCartOpen));

      if (items.length === 0) {
        orderCartItems.innerHTML = '<div class="order-cart__empty"><strong>Корзина пуста</strong><span>Добавьте товар из ассортимента, чтобы оформить заявку.</span></div>';
      } else {
        orderCartItems.innerHTML = items.map((item) => `
          <div class="order-cart__item">
            <div class="order-cart__product">
              <strong>${escapeHtml(item.name)}</strong>
              <span>${formatPrice(item.price)} руб. × ${item.quantity}</span>
            </div>
            <div class="order-cart__controls">
              <strong>${formatPrice(item.price * item.quantity)} руб.</strong>
              <button type="button" class="order-cart__quantity-btn" data-cart-action="decrease" data-product-id="${escapeHtml(item.id)}" aria-label="Уменьшить количество ${escapeHtml(item.name)}">−</button>
              <span aria-label="Количество: ${item.quantity}">${item.quantity}</span>
              <button type="button" class="order-cart__quantity-btn" data-cart-action="increase" data-product-id="${escapeHtml(item.id)}" aria-label="Увеличить количество ${escapeHtml(item.name)}"${item.quantity >= MAX_QUANTITY ? ' disabled' : ''}>+</button>
              <button type="button" class="order-cart__remove-btn" data-cart-action="remove" data-product-id="${escapeHtml(item.id)}" aria-label="Удалить ${escapeHtml(item.name)} из корзины">×</button>
            </div>
          </div>
        `).join('');
      }

      orderCartTotal.textContent = `${formatPrice(getCartTotal())} руб.`;
    }

    function addProduct(productId) {
      if (!ORDER_PRODUCTS[productId]) return;
      const nextQuantity = Math.min((cart.get(productId) || 0) + 1, MAX_QUANTITY);
      cart.set(productId, nextQuantity);
      saveCart();
      isCartOpen = true;
      renderCart();
    }

    function openCart() {
      if (cart.size === 0) return;
      isCartOpen = true;
      renderCart();
    }

    function closeCart() {
      isCartOpen = false;
      renderCart();
    }

    function updateQuantity(productId, delta) {
      if (!cart.has(productId)) return;
      const nextQuantity = cart.get(productId) + delta;
      if (nextQuantity <= 0) {
        cart.delete(productId);
      } else {
        cart.set(productId, Math.min(nextQuantity, MAX_QUANTITY));
      }

      if (cart.size === 0) isCartOpen = false;
      saveCart();
      renderCart();
    }

    function removeProduct(productId) {
      if (!cart.has(productId)) return;
      cart.delete(productId);
      if (cart.size === 0) isCartOpen = false;
      saveCart();
      renderCart();
    }

    function clearCart() {
      cart.clear();
      saveCart();
      isCartOpen = false;
      renderCart();
    }

    function renderModalSummary() {
      const items = getCartItems();
      orderModalSummary.innerHTML = items.map((item) => `
        <div class="order-modal__summary-item">
          <span>${item.name} × ${item.quantity}</span>
          <strong>${formatPrice(item.price * item.quantity)} руб.</strong>
        </div>
      `).join('') + `
        <div class="order-modal__summary-total">
          <span>Итого</span>
          <strong>${formatPrice(getCartTotal())} руб.</strong>
        </div>
      `;
    }

    function setFormStatus(message, type) {
      orderFormStatus.textContent = message;
      orderFormStatus.className = 'order-form__status';
      if (type) orderFormStatus.classList.add(`is-${type}`);
    }

    function openModal() {
      if (cart.size === 0) return;
      lastFocusedElement = document.activeElement;
      renderModalSummary();
      setFormStatus('', '');
      orderModal.hidden = false;
      setBodyScrollLock(true);
      document.getElementById('orderName').focus();
    }

    function closeModal() {
      orderModal.hidden = true;
      setBodyScrollLock(false);
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    productOrderButtons.forEach((button) => {
      button.addEventListener('click', function() {
        addProduct(button.dataset.productId);
      });
    });

    orderCartItems.addEventListener('click', function(event) {
      const button = event.target.closest('[data-cart-action]');
      if (!button) return;
      const action = button.dataset.cartAction;
      if (action === 'remove') {
        removeProduct(button.dataset.productId);
        return;
      }
      const delta = action === 'increase' ? 1 : -1;
      updateQuantity(button.dataset.productId, delta);
    });

    orderCartClear.addEventListener('click', clearCart);
    orderCartClose.addEventListener('click', closeCart);
    headerCart.addEventListener('click', openCart);
    openOrderModal.addEventListener('click', openModal);
    closeOrderModal.addEventListener('click', closeModal);

    orderModal.addEventListener('click', function(event) {
      if (event.target.hasAttribute('data-order-modal-close')) closeModal();
    });

    document.addEventListener('keydown', function(event) {
      if (orderModal.hidden) return;

      if (event.key === 'Escape') {
        closeModal();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = orderModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements.length) return;

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault();
        lastFocusableElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault();
        firstFocusableElement.focus();
      }
    });

    window.addEventListener('storage', function(event) {
      if (event.key !== CART_STORAGE_KEY) return;

      cart.clear();

      try {
        const storedCart = JSON.parse(event.newValue || '[]');

        if (Array.isArray(storedCart)) {
          storedCart.forEach((item) => {
            if (
              item &&
              ORDER_PRODUCTS[item.id] &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              item.quantity <= MAX_QUANTITY
            ) {
              cart.set(item.id, item.quantity);
            }
          });
        }
      } catch (error) {
        // Некорректные данные из другой вкладки игнорируются.
      }

      if (cart.size === 0) isCartOpen = false;
      renderCart();
    });

    orderForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      if (cart.size === 0) {
        setFormStatus('Добавьте хотя бы один товар в заявку.', 'error');
        return;
      }

      if (!orderForm.checkValidity()) {
        orderForm.reportValidity();
        return;
      }

      if (!ORDER_ENDPOINT) {
        setFormStatus('Форма заказа пока не подключена к Google Apps Script.', 'error');
        return;
      }

      const formData = new FormData(orderForm);
      const payload = {
        items: getCartItems().map((item) => ({
          id: item.id,
          quantity: item.quantity
        })),
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        comment: String(formData.get('comment') || '').trim()
      };

      orderSubmit.disabled = true;
      orderSubmit.textContent = 'Отправляем…';
      setFormStatus('', '');

      try {
        const response = await fetch(ORDER_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) throw new Error('Request failed');

        setFormStatus('Заявка отправлена. Мы свяжемся с вами.', 'success');
        orderForm.reset();
        clearCart();

        window.setTimeout(closeModal, 1800);
      } catch (error) {
        setFormStatus('Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.', 'error');
      } finally {
        orderSubmit.disabled = false;
        orderSubmit.textContent = 'Отправить заявку';
      }
    });

    loadCart();
    renderCart();
  }

  function initYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
  }

})();