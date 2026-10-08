// Тарифы в одном месте. Цены и квоты берёт и сервер, и приложение,
// чтобы на экране никогда не было написано одно, а списано другое.

export const CURRENCY = 'EUR';

export const PLANS = {
  // «Семья-основатель»: разовый платёж на время беты, первые FOUNDER_LIMIT семей — по ранней цене
  founder: {
    id: 'founder',
    price: 39,
    stories: 60,
    days: 3650,
    founder: true,
    title: { ru: 'Семья-основатель', en: 'Founding family' },
    note:  { ru: '60 сказок, все новые функции беты, ваша семья на стене основателей', en: '60 stories, every new beta feature, your family on the founders wall' }
  },
  pack5: {
    id: 'pack5', price: 7.99, stories: 5, days: 3650,
    title: { ru: '5 сказок', en: '5 stories' }, note: { ru: 'Не сгорают', en: "Don't expire" }
  },
  pack15: {
    id: 'pack15', price: 17.99, stories: 15, days: 3650, popular: true,
    title: { ru: '15 сказок', en: '15 stories' }, note: { ru: 'Самый популярный · не сгорают', en: "Most popular · don't expire" }
  },
  pack40: {
    id: 'pack40', price: 39.99, stories: 40, days: 3650,
    title: { ru: '40 сказок', en: '40 stories' }, note: { ru: 'Для большой семьи · не сгорают', en: "For a big family · don't expire" }
  }
};
// Ранняя цена «Семьи-основателя» — только для первых FOUNDER_LIMIT семей, дальше FOUNDER_LATE_PRICE.
export const FOUNDER_LIMIT = 100;
export const FOUNDER_LATE_PRICE = 59;

// Сколько сказок человек собирает бесплатно, прежде чем увидит тарифы —
// три, любым способом (запись, чтение с суфлёра или конструктор). Владелец
// (см. lib/owner.js) под это ограничение не попадает вообще.
// Сняты с продажи, но платежи, начатые до смены тарифов, ещё должны засчитываться.
export const LEGACY_PLANS = {
  pack10:  { id: 'pack10',  price: 9.99,  stories: 10,  days: 3650, title: { ru: '10 сказок', en: '10 stories' },   note: { ru: 'Снят с продажи', en: 'No longer sold' } },
  pack100: { id: 'pack100', price: 49.99, stories: 100, days: 3650, title: { ru: '100 сказок', en: '100 stories' }, note: { ru: 'Снят с продажи', en: 'No longer sold' } },
  year: { id: 'year', price: 49.99, stories: null, days: 365, title: { ru: 'Год', en: 'One year' }, note: { ru: 'Снят с продажи', en: 'No longer sold' } }
};

// Бесплатные сказки. С 8 октября 2026 новым аккаунтам — две (FREE_NEW, записывается в аккаунт при создании);
// у тех, кто пришёл раньше, в аккаунте этого поля нет — им остаются обещанные три (FREE_STORIES).
export const FREE_STORIES = 3;
export const FREE_NEW = 2;

// Запись голосом — тот же общий бесплатный лимит, отдельного порога больше нет.
export const RECORD_FREE = 3;

export const DONATION = {
  id: 'support',
  title: { ru: 'Поддержать проект', en: 'Support the project' },
  note:  { ru: 'Любая сумма от 10 €, без доступа', en: 'Any amount from €10, no access attached' },
  min: 10,
  max: 10000
};

/** Что человеку начисляется за покупку. Донат доступа не даёт. */
export function grantFor(planId, now = Date.now()) {
  const p = PLANS[planId] || LEGACY_PLANS[planId];
  if (!p) return null;
  return {
    plan: p.id,
    stories: p.stories,                                   // null = без ограничений
    until: now + p.days * 24 * 60 * 60 * 1000
  };
}

export function priceOf(planId, amount) {
  if (planId === DONATION.id) {
    const a = Number(amount);
    if (!isFinite(a) || a < DONATION.min || a > DONATION.max) return null;
    return Math.round(a * 100) / 100;
  }
  return PLANS[planId] ? PLANS[planId].price : null;
}
/** Цена «Семьи-основателя» с учётом того, сколько мест уже занято. */
export function founderPrice(sold){ return (Number(sold) || 0) < FOUNDER_LIMIT ? PLANS.founder.price : FOUNDER_LATE_PRICE; }
