// Промокоды: бесплатный доступ для своих (друзья, инвесторы, партнёры).
// Владелец создаёт код на beta-admin; человек вводит его в приложении («У меня есть промокод»).
//   rad:promo:<КОД> — {code, note, stories | unlimited+days, uses, used, exp, at, by:[{email, at}]}
//   rad:promo:list  — все коды (для страницы владельца)
import crypto from 'node:crypto';
import { get, set, emailKey, userKey } from './store.js';

const LIST = 'rad:promo:list';
const key = c => 'rad:promo:' + c;
export const normCode = c => String(c || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);

export async function createPromo({ code, note, stories, unlimited, days, uses, expDays }){
  let c = normCode(code) || ('FAV-' + crypto.randomBytes(3).toString('hex').toUpperCase());
  if (await get(key(c))) throw new Error('такой код уже есть');
  const p = { code: c, note: String(note || '').slice(0, 80), unlimited: !!unlimited,
    stories: unlimited ? null : Math.max(1, Math.min(1000, Number(stories) || 10)),
    days: Math.max(1, Math.min(3650, Number(days) || 365)),
    uses: Math.max(1, Math.min(1000, Number(uses) || 1)), used: 0,
    exp: expDays ? Date.now() + Number(expDays) * 86400000 : 0, at: Date.now(), by: [] };
  await set(key(c), p);
  const list = (await get(LIST)) || []; list.push(c); await set(LIST, list.slice(-2000));
  return p;
}
export async function listPromos(){
  const out = []; for (const c of ((await get(LIST)) || []).slice().reverse()){ const p = await get(key(c)); if (p) out.push(p); } return out;
}
export async function disablePromo(code){ const p = await get(key(normCode(code))); if (!p) return; p.uses = p.used; await set(key(p.code), p); }

/** Применить код к аккаунту. Возвращает {outcome, granted}. */
export async function redeemPromo(u, code){
  const c = normCode(code);
  const p = c ? await get(key(c)) : null;
  if (!p) return { outcome: 'not-found' };
  if (p.exp && p.exp < Date.now()) return { outcome: 'expired' };
  if (p.used >= p.uses) return { outcome: 'used-up' };
  u.promos = u.promos || [];
  if (u.promos.includes(p.code)) return { outcome: 'already' };
  const now = Date.now();
  applyGrant(u, p);
  u.promos.push(p.code);
  p.used += 1; p.by.push({ email: u.email || '', at: now }); await set(key(p.code), p);
  return { outcome: 'ok', granted: p.unlimited ? { unlimited: true, until: u.until } : { stories: p.stories } };
}

/** Начислить доступ аккаунту: безлимит на N дней или N сказок (не сгорают). */
export function applyGrant(u, g){
  const now = Date.now(), base = (u.until && u.until > now) ? u.until : now;
  if (g.unlimited) { u.stories = null; u.until = Math.max(base, now + (Number(g.days) || 365) * 86400000); }
  else { if (u.stories !== null) u.stories = (u.stories || 0) + (Number(g.stories) || 0); u.until = Math.max(base, now + 3650 * 86400000); }
  u.plan = u.plan || 'promo';
  return u;
}

/* ── владелец даёт доступ по почте ──
   Почта уже в Favola → доступ сразу на всех её устройствах. Ещё нет → ждёт и включится при первом входе. */
const GRANTS = 'rad:grants:list';
const pendKey = m => 'rad:grant:pending:' + m;

export async function listGrants(){ const { get: g2 } = await import('./store.js'); return ((await g2(GRANTS)) || []).slice().reverse(); }
/** При входе: включить доступ, который владелец выдал заранее. */
export async function applyPendingGrants(u, email){
  const { get: g2, set: s2 } = await import('./store.js');
  const m = String(email || '').trim().toLowerCase(); if (!m) return false;
  const pend = await g2(pendKey(m)); if (!pend || !pend.length) return false;
  for (const g of pend) applyGrant(u, g);
  await s2(pendKey(m), null);
  const list = (await g2(GRANTS)) || []; for (const r of list) if (r.email === m && r.status === 'pending') { r.status = 'applied'; r.appliedAt = Date.now(); }
  await s2(GRANTS, list);
  return true;
}

/** Владелец даёт доступ по почте, без кода. Уже зарегистрирован — сразу на всех его устройствах;
 *  ещё нет — доступ ждёт и включится при первом входе (applyPendingGrants в h-otp.js и auth.js). */
export async function grantByEmail({ email, unlimited, days, stories, note }){
  const mail = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) throw new Error('проверьте почту');
  const g = { unlimited: !!unlimited, days: Math.max(1, Math.min(3650, Number(days) || 365)), stories: unlimited ? null : Math.max(1, Math.min(1000, Number(stories) || 10)) };
  const known = await get(emailKey(mail));
  const devices = (known && known.devices) || [];
  let status = 'pending';
  if (devices.length){
    for (const id of devices){ const u = await get(userKey(id)); if (!u) continue; applyGrant(u, g); u.plan = u.plan === 'promo' ? 'gift' : (u.plan || 'gift'); await set(userKey(id), u); }
    status = 'applied';
  } else {
    const pend = (await get(pendKey(mail))) || []; pend.push(g); await set(pendKey(mail), pend);
  }
  const list = (await get(GRANTS)) || [];
  list.push({ email: mail, ...g, note: String(note || '').slice(0, 80), status, at: Date.now(), appliedAt: status === 'applied' ? Date.now() : null });
  await set(GRANTS, list.slice(-1000));
  return { outcome: 'ok', status, email: mail, granted: g };
}
