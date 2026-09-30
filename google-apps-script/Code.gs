const PRODUCTS = {
  'air-one': { name: 'E-Hookah Air One', price: 590 },
  'air-one-pro': { name: 'E-Hookah Air One Pro', price: 850 }
};

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const items = Array.isArray(payload.items) ? payload.items : [];
    const name = String(payload.name || '').trim();
    const phone = String(payload.phone || '').trim();
    const address = String(payload.address || '').trim();
    const comment = String(payload.comment || '').trim();

    if (!name || !phone || !address || !items.length) {
      return jsonResponse({ success: false, error: 'Invalid request' });
    }

    if (name.length > 80 || phone.length > 30 || address.length > 200 || comment.length > 500) {
      return jsonResponse({ success: false, error: 'Invalid request' });
    }

    const orderItems = items.map((item) => {
      const product = PRODUCTS[item.id];
      const quantity = Number(item.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error('Invalid product or quantity');
      }

      return {
        name: product.name,
        price: product.price,
        quantity: quantity,
        subtotal: product.price * quantity
      };
    });

    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const itemsText = orderItems
      .map((item) => `• ${item.name} — ${item.price} руб. × ${item.quantity} = ${item.subtotal} руб.`)
      .join('\n');

    const message = [
      'Новая заявка E-Hookah',
      '',
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Адрес: ${address}`,
      '',
      'Заказ:',
      itemsText,
      `Итого: ${total} руб.`,
      comment ? `\nКомментарий: ${comment}` : ''
    ].filter(Boolean).join('\n');

    const properties = PropertiesService.getScriptProperties();
    const telegramToken = properties.getProperty('TELEGRAM_BOT_TOKEN');
    const telegramChatId = properties.getProperty('TELEGRAM_CHAT_ID');
    const ownerEmail = properties.getProperty('OWNER_EMAIL');

    if (!telegramToken || !telegramChatId || !ownerEmail) {
      throw new Error('Script properties are not configured');
    }

    UrlFetchApp.fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: telegramChatId,
        text: message
      }),
      muteHttpExceptions: false
    });

    MailApp.sendEmail({
      to: ownerEmail,
      subject: 'Новая заявка E-Hookah',
      body: message
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: 'Server error' });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}