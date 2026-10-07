(function() {
  'use strict';

  const SCROLL_LOCKS = {
    MOBILE_MENU: 'mobile-menu',
    MOBILE_CART: 'mobile-cart',
    ORDER_MODAL: 'order-modal'
  };

  const activeScrollLocks = new Set();

  function getScrollbarWidth() {
    return window.innerWidth - document.documentElement.clientWidth;
  }

  function updateBodyScrollLock() {
    if (activeScrollLocks.size > 0) {
      const scrollBarWidth = getScrollbarWidth();
      document.body.classList.add('no-scroll');
      document.body.style.paddingRight = scrollBarWidth > 0 ? `${scrollBarWidth}px` : '';
      return;
    }

    document.body.classList.remove('no-scroll');
    document.body.style.paddingRight = '';
  }

  function setBodyScrollLock(source, locked) {
    if (locked) {
      activeScrollLocks.add(source);
    } else {
      activeScrollLocks.delete(source);
    }

    updateBodyScrollLock();
  }

  const CONFIG = {
    CATALOG_ENDPOINT: 'https://script.google.com/macros/s/AKfycby5f25xnoYAmx8xH2ZMW61j8LaEBHo2vKTQhJJVtZ3YpWPnXZuTJvMKBFmi3s9UFjKogg/exec',
    CART_STORAGE_KEY: 'e-hookah-cart',
    MAX_QUANTITY: 99,
    CATALOG_TIMEOUT_MS: 15000,
    ORDER_TIMEOUT_MS: 20000
  };

  const ORDER_ENDPOINT = CONFIG.CATALOG_ENDPOINT;
  let PRODUCTS = {};
  let orderFormInitialized = false;

  initAccordion();
  initMobileMenu();
  initYear();
  loadCatalog();

  function getProductId(name) {
    const normalizedName = String(name)
      .trim()
      .toLowerCase();

    const productIds = {
      'e-hookah air one': 'air-one',
      'e-hookah air one pro': 'air-one-pro'
    };

    return productIds[normalizedName] || 'product';
  }

  function getStatusClass(status) {
    return status === 'В наличии' ? 'available' : 'none';
  }

  function normalizeCatalogProducts(catalog) {
    if (!Array.isArray(catalog)) {
      throw new Error('Каталог имеет неверный формат');
    }

    const products = {};
    const usedIds = new Set();

    catalog.forEach((item) => {
      const name = String(item['Название'] || '').trim();
      const description = String(item['Описание'] || '').trim();
      const price = Number(item['Цена, BYN']);
      const status = String(item['Статус'] || '').trim();
      const desktopImage = String(item['Фото товара'] || '').trim();
      const mobileImage = String(item['Фото товара (мобильное)'] || '').trim();
      const accessoriesDesktop = String(item['Фото комплектации'] || '').trim();
      const accessoriesMobile = String(item['Фото комплектации (мобильное)'] || '').trim();

      if (!name || !description || !Number.isFinite(price) || !status || !desktopImage || !mobileImage || !accessoriesDesktop || !accessoriesMobile) {
        return;
      }

      const baseId = getProductId(name);
      let id = baseId;
      let suffix = 2;

      while (usedIds.has(id)) {
        id = baseId + '-' + suffix;
        suffix += 1;
      }

      usedIds.add(id);

      products[id] = {
        name,
        description,
        price,
        status,
        statusClass: getStatusClass(status),
        image: {
          desktop: desktopImage,
          mobile: mobileImage,
          alt: name
        },
        accessories: {
          desktop: accessoriesDesktop,
          mobile: accessoriesMobile,
          alt: 'Комплектация'
        }
      };
    });

    return products;
  }

  function showCatalogMessage(message, canRetry) {
    const catalog = document.getElementById('productCatalog');
    if (!catalog) return;

    catalog.innerHTML = '<div class="catalog-message" role="status">' +
      '<p>' + escapeHtml(message) + '</p>' +
      (canRetry ? '<button class="btn btn-primary catalog-retry-btn" type="button">Повторить загрузку</button>' : '') +
      '</div>';

    if (canRetry) {
      const retryButton = catalog.querySelector('.catalog-retry-btn');
      if (retryButton) retryButton.addEventListener('click', loadCatalog, { once: true });
    }
  }

  function loadCatalog() {
    if (!CONFIG.CATALOG_ENDPOINT) {
      showCatalogMessage('Каталог временно недоступен.', false);
      return;
    }

    showCatalogMessage('Загружаем ассортимент…', false);

    const callbackName = 'eHookahCatalog_' + Date.now();
    const script = document.createElement('script');
    const url = new URL(CONFIG.CATALOG_ENDPOINT);
    let finished = false;
    let timeoutId = null;

    url.searchParams.set('callback', callbackName);

    const cleanup = function() {
      if (finished) return;
      finished = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    };

    const fail = function(message, error) {
      cleanup();
      if (error) {
        console.error(message, error);
      } else {
        console.error(message);
      }
      showCatalogMessage('Не удалось загрузить ассортимент. Попробуйте ещё раз.', true);
    };

    window[callbackName] = function(catalog) {
      if (finished) return;

      try {
        const normalizedProducts = normalizeCatalogProducts(catalog);

        if (Object.keys(normalizedProducts).length === 0) {
          throw new Error('Каталог не содержит корректных товаров');
        }

        PRODUCTS = normalizedProducts;
        renderCatalog();
        initOrderForm();
        cleanup();
      } catch (error) {
        fail('Не удалось загрузить каталог из Google Apps Script:', error);
      }
    };

    script.src = url.toString();
    script.onerror = function() {
      fail('Не удалось получить каталог из Google Apps Script.');
    };

    timeoutId = window.setTimeout(function() {
      fail('Превышено время ожидания каталога из Google Apps Script.');
    }, CONFIG.CATALOG_TIMEOUT_MS);

    document.head.appendChild(script);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderCatalog() {
    const catalog = document.getElementById('productCatalog');
    if (!catalog) return;

    catalog.innerHTML = Object.entries(PRODUCTS).map(([id, product]) => `
      <article class="product-wide-card">
        <div class="product-part">
          <picture>
            <source media="(max-width: 1024px)" srcset="${escapeHtml(product.image.mobile)}">
            <img src="${escapeHtml(product.image.desktop)}" loading="lazy" alt="${escapeHtml(product.image.alt)}">
          </picture>
        </div>
        <div class="product-part info-main">
          <div class="info-content">
            <span class="product-status ${escapeHtml(product.statusClass)}">${escapeHtml(product.status)}</span>
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.description)}</p>
            <div class="product-price-wrapper">
              <span class="price-label">Цена за комплект:</span>
              <span class="product-price">${escapeHtml(product.price)} руб.</span>
            </div>
            <button class="btn btn-primary product-order-btn" type="button" data-product-id="${escapeHtml(id)}"${product.status !== 'В наличии' ? ' disabled' : ''}>${product.status === 'В наличии' ? 'В корзину' : 'Недоступно'}</button>
          </div>
        </div>
        <div class="product-part photo-kit">
          <picture>
            <source media="(max-width: 1024px)" srcset="${escapeHtml(product.accessories.mobile)}">
            <img src="${escapeHtml(product.accessories.desktop)}" loading="lazy" alt="${escapeHtml(product.accessories.alt)}">
          </picture>
        </div>
      </article>
    `).join('');
  }

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
        setBodyScrollLock(SCROLL_LOCKS.MOBILE_MENU, true);
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
      setBodyScrollLock(SCROLL_LOCKS.MOBILE_MENU, false);
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

    if (!orderCart || !orderForm || orderFormInitialized) return;

    orderFormInitialized = true;
    const cart = new Map();
    let lastFocusedElement = null;
    let isCartOpen = false;

    function loadCart() {
      try {
        const storedCart = JSON.parse(localStorage.getItem(CONFIG.CART_STORAGE_KEY) || '[]');

        if (!Array.isArray(storedCart)) return;

        storedCart.forEach((item) => {
          if (
            item &&
            PRODUCTS[item.id] &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= CONFIG.MAX_QUANTITY
          ) {
            cart.set(item.id, item.quantity);
          }
        });
      } catch (error) {
        try {
          localStorage.removeItem(CONFIG.CART_STORAGE_KEY);
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

        localStorage.setItem(CONFIG.CART_STORAGE_KEY, JSON.stringify(storedCart));
      } catch (error) {
        // Корзина продолжает работать в памяти, даже если localStorage недоступен.
      }
    }

    function getCartItems() {
      return Array.from(cart.entries()).map(([id, quantity]) => ({
        id,
        quantity,
        ...PRODUCTS[id]
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
              <button type="button" class="order-cart__remove-btn" data-cart-action="remove" data-product-id="${escapeHtml(item.id)}" aria-label="Удалить ${escapeHtml(item.name)} из корзины">×</button>
            </div>
            <div class="order-cart__details">
              <div class="order-cart__price">
                <span>${formatPrice(item.price)} руб.</span>
              </div>
              <div class="order-cart__controls">
                <strong>${formatPrice(item.price * item.quantity)} руб.</strong>
                <button type="button" class="order-cart__quantity-btn" data-cart-action="decrease" data-product-id="${escapeHtml(item.id)}" aria-label="Уменьшить количество ${escapeHtml(item.name)}">−</button>
                <span aria-label="Количество: ${item.quantity}">${item.quantity}</span>
                <button type="button" class="order-cart__quantity-btn" data-cart-action="increase" data-product-id="${escapeHtml(item.id)}" aria-label="Увеличить количество ${escapeHtml(item.name)}"${item.quantity >= CONFIG.MAX_QUANTITY ? ' disabled' : ''}>+</button>
              </div>
            </div>
          </div>
        `).join('');
      }

      orderCartTotal.textContent = `${formatPrice(getCartTotal())} руб.`;
    }

    function addProduct(productId) {
      const product = PRODUCTS[productId];
      if (!product || product.status !== 'В наличии') return;
      const nextQuantity = Math.min((cart.get(productId) || 0) + 1, CONFIG.MAX_QUANTITY);
      cart.set(productId, nextQuantity);
      saveCart();
      isCartOpen = true;
      setBodyScrollLock(SCROLL_LOCKS.MOBILE_CART, window.innerWidth <= 600);
      renderCart();
    }

    function openCart() {
      if (cart.size === 0) return;
      isCartOpen = true;
      setBodyScrollLock(SCROLL_LOCKS.MOBILE_CART, window.innerWidth <= 600);
      renderCart();
    }

    function closeCart() {
      isCartOpen = false;
      setBodyScrollLock(SCROLL_LOCKS.MOBILE_CART, false);
      renderCart();
    }

    function updateQuantity(productId, delta) {
      if (!cart.has(productId)) return;
      const nextQuantity = cart.get(productId) + delta;
      const quantity = Math.max(1, Math.min(nextQuantity, CONFIG.MAX_QUANTITY));

      cart.set(productId, quantity);
      saveCart();
      renderCart();
    }

    function removeProduct(productId) {
      if (!cart.has(productId)) return;
      cart.delete(productId);
      saveCart();

      if (cart.size === 0) {
        closeCart();
        return;
      }

      renderCart();
    }

    function clearCart() {
      cart.clear();
      saveCart();
      isCartOpen = false;
      setBodyScrollLock(SCROLL_LOCKS.MOBILE_CART, false);
      renderCart();
    }

    function renderModalSummary() {
      const items = getCartItems();
      orderModalSummary.innerHTML = items.map((item) => `
        <div class="order-modal__summary-item">
          <span>${escapeHtml(item.name)} × ${item.quantity}</span>
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

    const formFields = {
      name: {
        input: document.getElementById('orderName'),
        error: document.getElementById('orderNameError'),
        validate(value) {
          if (!value) return 'Введите ФИО.';
          if (value.length < 2) return 'ФИО должно содержать минимум 2 символа.';
          if (value.length > 80) return 'ФИО не должно превышать 80 символов.';
          if (!/^[\p{L}\p{M}][\p{L}\p{M}'’ -]*$/u.test(value)) {
            return 'Используйте только буквы, пробелы и дефисы.';
          }
          return '';
        }
      },
      phone: {
        input: document.getElementById('orderPhone'),
        error: document.getElementById('orderPhoneError'),
        validate(value) {
          if (!value) return 'Введите номер телефона.';
          if (!/^[+]?\d[\d\s().-]{6,28}\d$/.test(value)) {
            return 'Введите корректный номер телефона.';
          }
          return '';
        }
      },
      address: {
        input: document.getElementById('orderAddress'),
        error: document.getElementById('orderAddressError'),
        validate(value) {
          if (!value) return 'Введите адрес доставки.';
          if (value.length < 5) return 'Введите полный адрес доставки.';
          if (value.length > 200) return 'Адрес не должен превышать 200 символов.';
          return '';
        }
      },
      comment: {
        input: document.getElementById('orderComment'),
        error: document.getElementById('orderCommentError'),
        validate(value) {
          if (value.length > 500) return 'Комментарий не должен превышать 500 символов.';
          return '';
        }
      }
    };

    function validateField(field) {
      const value = field.input.value.trim();
      const message = field.validate(value);

      field.error.textContent = message;
      field.input.setAttribute('aria-invalid', String(Boolean(message)));
      field.input.classList.toggle('is-invalid', Boolean(message));

      return !message;
    }

    function validateOrderForm(focusInvalidField = false) {
      let isValid = true;
      let firstInvalidField = null;

      Object.values(formFields).forEach((field) => {
        const fieldIsValid = validateField(field);
        if (!fieldIsValid) {
          isValid = false;
          if (!firstInvalidField) firstInvalidField = field.input;
        }
      });

      if (!isValid && focusInvalidField && firstInvalidField) {
        firstInvalidField.focus();
        setFormStatus('Проверьте данные в форме.', 'error');
      }

      return isValid;
    }

    function openModal() {
      if (cart.size === 0) return;
      lastFocusedElement = document.activeElement;
      renderModalSummary();
      setFormStatus('', '');
      orderModal.hidden = false;
      setBodyScrollLock(SCROLL_LOCKS.ORDER_MODAL, true);
      document.getElementById('orderName').focus();
    }

    function closeModal() {
      orderModal.hidden = true;
      setBodyScrollLock(SCROLL_LOCKS.ORDER_MODAL, false);
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    Object.values(formFields).forEach((field) => {
      field.input.addEventListener('blur', () => validateField(field));
      field.input.addEventListener('input', () => {
        if (field.input.classList.contains('is-invalid')) validateField(field);
      });
    });

    const productCatalog = document.getElementById('productCatalog');

    if (productCatalog) {
      productCatalog.addEventListener('click', function(event) {
        const button = event.target.closest('.product-order-btn');
        if (!button) return;
        addProduct(button.dataset.productId);
      });
    }

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
      if (event.key !== CONFIG.CART_STORAGE_KEY) return;

      cart.clear();

      try {
        const storedCart = JSON.parse(event.newValue || '[]');

        if (Array.isArray(storedCart)) {
          storedCart.forEach((item) => {
            if (
              item &&
              PRODUCTS[item.id] &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              item.quantity <= CONFIG.MAX_QUANTITY
            ) {
              cart.set(item.id, item.quantity);
            }
          });
        }
      } catch (error) {
        // Некорректные данные из другой вкладки игнорируются.
      }

      if (cart.size === 0) {
        isCartOpen = false;
        setBodyScrollLock(SCROLL_LOCKS.MOBILE_CART, false);
      }

      renderCart();
    });

    window.addEventListener('resize', function() {
      setBodyScrollLock(SCROLL_LOCKS.MOBILE_CART, isCartOpen && window.innerWidth <= 600);
    });

    orderForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      if (cart.size === 0) {
        setFormStatus('Добавьте хотя бы один товар в заявку.', 'error');
        return;
      }

      if (!validateOrderForm(true)) {
        return;
      }

      if (!ORDER_ENDPOINT) {
        setFormStatus('Форма заказа пока не подключена к Google Apps Script.', 'error');
        return;
      }

      const items = getCartItems();

      if (items.some((item) => item.status !== 'В наличии')) {
        setFormStatus('Один из выбранных товаров сейчас недоступен. Обновите корзину и попробуйте снова.', 'error');
        return;
      }

      const formData = new FormData(orderForm);
      const payload = {
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity
        })),
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        address: String(formData.get('address') || '').trim(),
        comment: String(formData.get('comment') || '').trim()
      };

      orderSubmit.disabled = true;
      orderSubmit.textContent = 'Отправляем…';
      setFormStatus('', '');

      const controller = new AbortController();
      const timeoutId = window.setTimeout(function() {
        controller.abort();
      }, CONFIG.ORDER_TIMEOUT_MS);

      try {
        const response = await fetch(ORDER_ENDPOINT, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.success) throw new Error('Request failed');

        setFormStatus('Заявка отправлена. Мы свяжемся с вами.', 'success');
        orderForm.reset();
        clearCart();

        window.setTimeout(closeModal, 1800);
      } catch (error) {
        if (error.name === 'AbortError') {
          setFormStatus('Сервис не ответил вовремя. Проверьте соединение и попробуйте ещё раз.', 'error');
        } else {
          setFormStatus('Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами по телефону.', 'error');
        }
      } finally {
        window.clearTimeout(timeoutId);
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