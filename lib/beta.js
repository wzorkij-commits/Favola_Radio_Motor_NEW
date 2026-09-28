// Закрытая бета: список ожидания и приглашения.
//
// Войти в приложение может только тот, кого пригласили, кто уже заходил раньше
// (почта есть в базе) или владелец. Остальные оставляют почту в списке ожидания.
// Аварийный выключатель: BETA_OPEN=1 в Vercel — вход открыт всем.
//
//   rad:beta:list          — порядок заявок (почты)
//   rad:beta:req:<почта>   — {email, who, country, lang, at, status:'waiting'|'invited'|'joined', invitedAt, joinedAt}
import { get, set, emailKey } from './store.js';
import { send, shell } from './mail.js';
import { isOwner } from './owner.js';

export const okMail = m => typeof m === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.trim());
const norm = m => String(m || '').trim().toLowerCase();
const LIST = 'rad:beta:list';
const reqKey = m => 'rad:beta:req:' + norm(m);
const SITE = () => process.env.RADIO_SITE || 'https://www.favola.space';
export const BETA_OPEN = () => process.env.BETA_OPEN === '1';

/** Можно ли этой почте войти. */
export async function allowed(mail){
  const m = norm(mail);
  if (!m) return false;
  if (BETA_OPEN() || isOwner(m)) return true;
  const r = await get(reqKey(m));
  if (r && (r.status === 'invited' || r.status === 'joined')) return true;
  return !!(await get(emailKey(m)));             // уже заходил раньше — своих не выгоняем
}

/** Отметить, что приглашённый действительно вошёл. */
export async function markJoined(mail){
  const r = await get(reqKey(mail));
  if (r && r.status !== 'joined') { r.status = 'joined'; r.joinedAt = Date.now(); await set(reqKey(mail), r); }
}

function letter(kind, lang, email){
  const ru = lang !== 'en';
  const link = `${SITE()}/app.html?email=${encodeURIComponent(email)}`;
  if (kind === 'waiting') return ru
    ? { subject: 'Вы в списке Favola', html: shell('Вы в списке', `<p style="line-height:1.55">Спасибо! Favola сейчас в закрытой бете: мы пускаем людей небольшими группами, чтобы всё работало как надо.</p><p style="line-height:1.55">Как только освободится место, пришлём приглашение на этот адрес.</p>`), text: 'Спасибо! Вы в списке Favola. Пришлём приглашение, как только освободится место.' }
    : { subject: "You're on the Favola list", html: shell("You're on the list", `<p style="line-height:1.55">Thank you! Favola is in a closed beta: we let people in small groups so everything works as it should.</p><p style="line-height:1.55">We'll send an invitation to this address as soon as a place is free.</p>`), text: "Thank you! You're on the Favola list. We'll send an invitation as soon as a place is free." };
  return ru
    ? { subject: 'Приглашение в Favola', html: shell('Добро пожаловать в Favola', `<p style="line-height:1.55">Место освободилось — можно входить. Первая сказка бесплатно.</p><p style="margin:26px 0"><a href="${link}" style="background:#E9A93C;color:#12132A;padding:14px 26px;border-radius:30px;text-decoration:none;font-family:sans-serif;font-weight:700">Открыть Favola</a></p><p style="line-height:1.55;opacity:.8">Входите с этой почтой: ${email}. Расскажите, что понравилось и что нет — просто ответьте на это письмо.</p>`), text: `Приглашение в Favola: ${link} — входите с почтой ${email}.` }
    : { subject: 'Your invitation to Favola', html: shell('Welcome to Favola', `<p style="line-height:1.55">A place is free — come in. Your first story is free.</p><p style="margin:26px 0"><a href="${link}" style="background:#E9A93C;color:#12132A;padding:14px 26px;border-radius:30px;text-decoration:none;font-family:sans-serif;font-weight:700">Open Favola</a></p><p style="line-height:1.55;opacity:.8">Sign in with this email: ${email}. Tell us what you liked and what you didn't — just reply to this email.</p>`), text: `Your Favola invitation: ${link} — sign in with ${email}.` };
}

/** Заявка в список ожидания. */
export async function join({ email, who, country, lang }){
  const m = norm(email);
  if (!okMail(m)) return { outcome: 'bad-email' };
  if (await allowed(m)) return { outcome: 'already-in' };
  let r = await get(reqKey(m));
  if (!r){
    r = { email: m, who: String(who || '').slice(0, 60), country: String(country || '').slice(0, 60), lang: lang === 'en' ? 'en' : 'ru', at: Date.now(), status: 'waiting' };
    await set(reqKey(m), r);
    const list = (await get(LIST)) || []; list.push(m); await set(LIST, list.slice(-20000));
    try { await send({ to: m, ...letter('waiting', r.lang, m) }); } catch (e) { /* заявка сохранена и без письма */ }
  }
  const list = (await get(LIST)) || [];
  const waiting = [];
  for (const x of list) { const q = await get(reqKey(x)); if (q && q.status === 'waiting') waiting.push(x); if (x === m) break; }
  return { outcome: 'waiting', position: waiting.length };
}

/** Пригласить одну почту (владелец). */
export async function invite(email){
  const m = norm(email);
  const r = (await get(reqKey(m))) || { email: m, at: Date.now(), lang: 'ru', status: 'waiting' };
  if (!(await get(reqKey(m)))) { const list = (await get(LIST)) || []; list.push(m); await set(LIST, list); }
  r.status = r.status === 'joined' ? 'joined' : 'invited'; r.invitedAt = Date.now();
  await set(reqKey(m), r);
  await send({ to: m, ...letter('invite', r.lang, m) });
  return r;
}

/** Все заявки для страницы владельца. */
export async function listAll(){
  const list = (await get(LIST)) || [];
  const rows = [];
  for (const m of list) { const r = await get(reqKey(m)); if (r) rows.push(r); }
  const count = s => rows.filter(r => r.status === s).length;
  return { rows, waiting: count('waiting'), invited: count('invited'), joined: count('joined') };
}
