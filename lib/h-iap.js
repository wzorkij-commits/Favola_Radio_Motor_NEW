// Покупки внутри приложений из App Store и Google Play.
//
// Магазины не дают продавать сказки через SumUp внутри приложения, поэтому
// там пакеты покупаются через сам магазин. Посредник — RevenueCat: он
// проверяет чек у Apple или Google и присылает сюда событие (webhook).
// Мы начисляем сказки тем же способом, что и после оплаты через SumUp.
//
//   POST /api/iap                     событие от RevenueCat (заголовок Authorization)
//   GET  /api/pay?act=iap-config      публичные ключи RevenueCat для приложения
//
// Переменные окружения в Vercel:
//   REVENUECAT_WEBHOOK_AUTH  — секрет, который вписан в RevenueCat в поле Authorization
//   REVENUECAT_IOS_KEY       — публичный ключ приложения для iPhone (начинается с appl_)
//   REVENUECAT_ANDROID_KEY   — публичный ключ приложения для Android (начинается с goog_)
import { loadUser, saveUser, get, set } from './store.js';
import { grantFor, PLANS } from './plans.js';

// Какой товар магазина соответствует какому пакету. Те же идентификаторы
// нужно завести в App Store Connect и Google Play (тип: расходуемый товар).
export const IAP_PRODUCTS = {
  'space.favola.pack5':  'pack5',
  'space.favola.pack15': 'pack15',
  'space.favola.pack40': 'pack40'
};

// События RevenueCat, при которых человек действительно что-то купил.
const BUY_EVENTS = new Set(['NON_RENEWING_PURCHASE', 'INITIAL_PURCHASE']);

export function iapConfig() {
  return {
    ios: process.env.REVENUECAT_IOS_KEY || '',
    android: process.env.REVENUECAT_ANDROID_KEY || '',
    products: Object.keys(IAP_PRODUCTS).map(id => ({ id, plan: IAP_PRODUCTS[id], stories: PLANS[IAP_PRODUCTS[id]].stories }))
  };
}

/** Начислить пакет по событию. Возвращает, что сделано. Повтор того же события ничего не меняет. */
export async function applyIapEvent(ev, now = Date.now()) {
  if (!ev || typeof ev !== 'object') return { ok: false, why: 'нет события' };
  if (ev.type === 'TEST') return { ok: true, test: true };
  if (!BUY_EVENTS.has(ev.type)) return { ok: true, skipped: ev.type };

  const plan = IAP_PRODUCTS[ev.product_id];
  if (!plan) return { ok: true, skipped: 'неизвестный товар ' + ev.product_id };

  const device = String(ev.app_user_id || '');
  if (!device || device.startsWith('$RCAnonymousID')) return { ok: false, why: 'покупка без нашего пользователя' };

  const ref = 'iap:' + (ev.transaction_id || ev.id);
  // общий список обработанных покупок, чтобы повтор от RevenueCat не начислил дважды
  const seenKey = 'rad:iap:seen';
  const seen = (await get(seenKey)) || [];
  if (seen.includes(ref)) return { ok: true, already: true };

  const u = await loadUser(device);
  if ((u.payments || []).some(p => p.ref === ref)) return { ok: true, already: true };

  const g = grantFor(plan, now);
  const base = (u.until && u.until > now) ? u.until : now;
  u.plan = g.plan;
  u.until = Math.max(g.until, base + (g.until - now));
  if (g.stories === null || u.stories === null) u.stories = null;
  else u.stories = (u.stories || 0) + g.stories;

  const store = ev.store === 'APP_STORE' ? 'apple' : ev.store === 'PLAY_STORE' ? 'google' : String(ev.store || '').toLowerCase();
  u.payments = u.payments || [];
  u.payments.push({
    ref, plan, status: 'PAID', via: store,
    amount: typeof ev.price === 'number' ? ev.price : PLANS[plan].price,   // в долларах у RevenueCat, для справки
    currency: ev.currency || '',
    at: ev.purchased_at_ms || now, paidAt: now
  });
  await saveUser(u);

  seen.push(ref);
  await set(seenKey, seen.slice(-20000));
  return { ok: true, plan, stories: u.stories, device };
}

export default async function iapHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const secret = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!secret) return res.status(503).json({ error: 'REVENUECAT_WEBHOOK_AUTH не задан' });
  const auth = String(req.headers.authorization || '');
  if (auth !== secret && auth !== 'Bearer ' + secret) return res.status(401).json({ error: 'чужой запрос' });
  try {
    const r = await applyIapEvent((req.body || {}).event);
    return res.status(r.ok ? 200 : 400).json(r);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });   // RevenueCat повторит позже
  }
}
