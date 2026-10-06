// Начало оплаты — тот же SumUp-продавец и те же тарифы, что в Favola,
// потому что подписка одна на оба приложения.
//
//   POST /api/pay {device, plan, amount?, email?, back}
import { normLang } from '../lib/prompts.js';
import { publicView } from '../lib/store.js';
import { FOUNDER_LIMIT, founderPrice, FREE_STORIES as FREE_N } from '../lib/plans.js';
import * as PR from '../lib/promo.js';
import { isOwner } from '../lib/owner.js';
import { get as kvGet } from '../lib/store.js';
import { cors } from '../lib/providers.js';
import { loadUser, saveUser } from '../lib/store.js';
import { PLANS, DONATION, CURRENCY, priceOf } from '../lib/plans.js';
import { createCheckout, SUMUP_READY } from '../lib/sumup.js';
import { asked } from '../lib/route.js';
import paystatus from '../lib/h-paystatus.js';

const okMail = m => typeof m === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.trim());

export default async function handler(req, res) {
  if (asked(req) === 'pay-status') return paystatus(req, res);

  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  // сколько мест «Семьи-основателя» осталось — для экрана оплаты
  if (req.method === 'GET' && (req.query || {}).act === 'founders') {
    const sold = Number(await kvGet('rad:founders:count')) || 0;
    return res.status(200).json({ sold, limit: FOUNDER_LIMIT, left: Math.max(0, FOUNDER_LIMIT - sold), price: founderPrice(sold) });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // ── промокоды: человек вводит код; владелец создаёт, смотрит, выключает ──
  { const bb = req.body || {};
    if (bb.act === 'promo' || bb.act === 'promo-create' || bb.act === 'promo-list' || bb.act === 'promo-off' || bb.act === 'grant' || bb.act === 'grant-list') {
      try {
        const uu = await loadUser(bb.device);
        if (bb.act === 'promo') {
          if (!uu.email) return res.status(200).json({ outcome: 'signin' });   // доступ привязываем к почте, чтобы он был на любом устройстве
          const r = await PR.redeemPromo(uu, bb.code);
          if (r.outcome === 'ok') await saveUser(uu);
          return res.status(200).json({ ...r, me: publicView(uu, FREE_N) });
        }
        if (!isOwner(uu.email)) return res.status(403).json({ error: 'только для владельца' });
        if (bb.act === 'promo-create') return res.status(200).json(await PR.createPromo(bb));
        if (bb.act === 'promo-off') { await PR.disablePromo(bb.code); return res.status(200).json({ ok: true }); }
        if (bb.act === 'grant') return res.status(200).json(await PR.grantByEmail(bb));
        if (bb.act === 'grant-list') return res.status(200).json({ grants: await PR.listGrants() });
        return res.status(200).json({ promos: await PR.listPromos() });
      } catch (e) { return res.status(400).json({ error: String(e.message || e) }); }
    }
  }

  try {
    if (!SUMUP_READY()) {
      return res.status(200).json({
        outcome: 'not-configured',
        why: 'Оплата не подключена: в Vercel не задан SUMUP_API_KEY.'
      });
    }

    const { device, plan, amount, email, back, name, message, lang } = req.body || {};
    if (!device) return res.status(400).json({ error: 'нет ключа устройства' });

    const isDonation = plan === DONATION.id;
    if (!isDonation && !PLANS[plan]) return res.status(400).json({ error: 'неизвестный тариф: ' + plan });

    const price = plan === 'founder' ? founderPrice(Number(await kvGet('rad:founders:count')) || 0) : priceOf(plan, amount);
    if (price === null) return res.status(400).json({ error: 'сумма вне допустимого' });

    const u = await loadUser(device);
    if (email !== undefined && email !== null && email !== '') {
      if (!okMail(email)) return res.status(400).json({ error: 'почта не похожа на почту' });
      u.email = String(email).trim().toLowerCase();
    }

    const ref = 'favrad-' + device.slice(0, 12) + '-' + Date.now().toString(36);
    const title = isDonation ? DONATION.title.ru : PLANS[plan].title.ru;

    const co = await createCheckout({
      reference: ref,
      amount: price,
      currency: CURRENCY,
      description: 'Favola Radio · ' + title,
      redirectUrl: (back && /^https?:\/\//.test(back))
        ? back.replace('{REF}', encodeURIComponent(ref))
        // запасной адрес — только если сайт не прислал свой: ведёт на сам сайт
        // приложения, а не на голый адрес мотора (там нет страниц).
        : 'https://favola-radio-1.vercel.app/app.html?paid=' + encodeURIComponent(ref),
      email: u.email
    });

    u.payments = (u.payments || []).filter(p => p.status !== 'PENDING' || Date.now() - p.at < 36e5);
    const extra = isDonation ? { name: String(name || '').slice(0, 60), message: String(message || '').slice(0, 300), email: email ? String(email).trim().toLowerCase() : (u.email || ''), lang: normLang(lang) } : {};
    u.payments.push({ ref, checkout: co.id, plan, amount: price, at: Date.now(), status: 'PENDING', ...extra });
    await saveUser(u);

    return res.status(200).json({ outcome: 'ok', url: co.url, ref, checkout: co.id, amount: price, currency: CURRENCY });
  } catch (e) {
    return res.status(200).json({ outcome: 'error', why: String(e.message || e) });
  }
}
