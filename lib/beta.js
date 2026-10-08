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
import { normLang } from './prompts.js';

export const okMail = m => typeof m === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.trim());
const norm = m => String(m || '').trim().toLowerCase();
const LIST = 'rad:beta:list';
const reqKey = m => 'rad:beta:req:' + norm(m);
const SITE = () => process.env.RADIO_SITE || 'https://www.favola.space';
export const BETA_OPEN = () => process.env.BETA_OPEN === '1';

/** Можно ли этой почте войти. */
// Открытая регистрация: заходит любой (без списка ожидания). Закрыть обратно — SIGNUP_CLOSED=1 в Vercel.
export const SIGNUP_OPEN = () => process.env.SIGNUP_CLOSED !== '1';
export async function allowed(mail){
  const m = norm(mail);
  if (!m) return false;
  if (SIGNUP_OPEN() || BETA_OPEN() || isOwner(m)) return true;
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
  const ru = !lang || lang === 'ru';   // письма: по-русски для русских, для остальных языков — по-английски
  const link = `${SITE()}/app.html?email=${encodeURIComponent(email)}`;
  if (kind === 'waiting') return ru
    ? { subject: 'Вы в списке Favola', html: shell('Вы в списке', `<p style="line-height:1.55">Спасибо! Favola сейчас в закрытой бете: мы пускаем людей небольшими группами, чтобы всё работало как надо.</p><p style="line-height:1.55">Как только освободится место, пришлём приглашение на этот адрес.</p>`), text: 'Спасибо! Вы в списке Favola. Пришлём приглашение, как только освободится место.' }
    : { subject: "You're on the Favola list", html: shell("You're on the list", `<p style="line-height:1.55">Thank you! Favola is in a closed beta: we let people in small groups so everything works as it should.</p><p style="line-height:1.55">We'll send an invitation to this address as soon as a place is free.</p>`), text: "Thank you! You're on the Favola list. We'll send an invitation as soon as a place is free." };
  const ru2 = ru;
  const site = SITE().replace(/^https?:\/\//, '');
  return ru2
    ? { subject: 'Ваше приглашение в Favola',
        html: shell('Добро пожаловать в Favola', `<p style="line-height:1.55">Здравствуйте! Это Василий из Favola. Для вас освободилось место в бете — можно входить.</p><p style="margin:26px 0"><a href="${link}" style="background:#E9A93C;color:#12132A;padding:14px 26px;border-radius:30px;text-decoration:none;font-family:sans-serif;font-weight:700">Открыть Favola</a></p><p style="line-height:1.55">Или откройте ${site} и войдите с этой почтой: ${email}. На почту придёт код для входа.</p><p style="line-height:1.55;opacity:.8">Первые две сказки — в подарок. Если что-то непонятно или не работает, просто ответьте на это письмо — я прочитаю.</p><p style="line-height:1.55">Василий, Favola</p>`),
        text: `Здравствуйте! Это Василий из Favola. Для вас освободилось место в бете — можно входить.\n\nОткрыть Favola: ${link}\n\nИли откройте ${site} и войдите с этой почтой: ${email}. На почту придёт код для входа.\n\nПервые две сказки — в подарок. Если что-то непонятно или не работает, просто ответьте на это письмо.\n\nВасилий, Favola` }
    : { subject: 'Your invitation to Favola',
        html: shell('Welcome to Favola', `<p style="line-height:1.55">Hello! This is Vasilii from Favola. A place in the beta is ready for you — come in.</p><p style="margin:26px 0"><a href="${link}" style="background:#E9A93C;color:#12132A;padding:14px 26px;border-radius:30px;text-decoration:none;font-family:sans-serif;font-weight:700">Open Favola</a></p><p style="line-height:1.55">Or open ${site} and sign in with this email: ${email}. A sign-in code will arrive by email.</p><p style="line-height:1.55;opacity:.8">Your first two stories are on us. If anything is unclear or doesn't work, just reply to this email — I read every reply.</p><p style="line-height:1.55">Vasilii, Favola</p>`),
        text: `Hello! This is Vasilii from Favola. A place in the beta is ready for you — come in.\n\nOpen Favola: ${link}\n\nOr open ${site} and sign in with this email: ${email}. A sign-in code will arrive by email.\n\nYour first two stories are on us. If anything is unclear, just reply to this email.\n\nVasilii, Favola` };
}

/** Заявка в список ожидания. */
export async function join({ email, who, country, lang }){
  const m = norm(email);
  if (!okMail(m)) return { outcome: 'bad-email' };
  if (await allowed(m)) return { outcome: 'already-in' };
  let r = await get(reqKey(m));
  if (!r){
    r = { email: m, who: String(who || '').slice(0, 60), country: String(country || '').slice(0, 60), lang: normLang(lang), at: Date.now(), status: 'waiting' };
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
  try { await send({ to: m, ...letter('invite', r.lang, m) }); }
  catch (e) { r.mailError = String(e.message || e).slice(0, 200); r.mailErrorAt = Date.now(); await set(reqKey(m), r); throw e; }
  r.status = r.status === 'joined' ? 'joined' : 'invited'; r.invitedAt = Date.now(); r.mailError = ''; r.mailedAt = Date.now();
  await set(reqKey(m), r);
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

/* ── кто сейчас в приложении ──
   Приложение раз в минуту, пока открыто, говорит «я здесь». Онлайн — кто отметился за последние 2 минуты.
   rad:online — упорядоченное множество «устройство → время последней отметки»; rad:here:<устройство> — почта и экран. */
export async function here(device, screen){
  if (!device) return;
  const { run, loadUser } = await import('./store.js');
  const now = Date.now(), u = await loadUser(device);
  await run([
    ['ZADD', 'rad:online', String(now), String(device)],
    ['ZREMRANGEBYSCORE', 'rad:online', '0', String(now - 8 * 24 * 3600 * 1000)],   // храним неделю — для «за сутки» и «за неделю»
    ['SET', 'rad:here:' + device, JSON.stringify({ email: u.email || '', screen: String(screen || '').slice(0, 30), at: now }), 'EX', String(8 * 24 * 3600)]
  ]);
}
export async function presence(){
  const { run, get } = await import('./store.js');
  const now = Date.now();
  const [nowList, day, week] = await run([
    ['ZRANGEBYSCORE', 'rad:online', String(now - 2 * 60 * 1000), String(now)],
    ['ZCOUNT', 'rad:online', String(now - 24 * 3600 * 1000), String(now)],
    ['ZCOUNT', 'rad:online', String(now - 7 * 24 * 3600 * 1000), String(now)]
  ]);
  const rows = [];
  for (const d of (nowList || []).slice(0, 100)){
    const h = await get('rad:here:' + d);
    rows.push({ email: (h && h.email) || '', screen: (h && h.screen) || '', ago: h ? Math.round((now - h.at) / 1000) : null });
  }
  return { now: (nowList || []).length, day: Number(day) || 0, week: Number(week) || 0, rows };
}

/** Личная ссылка для входа без кода: владелец отправляет её человеку сам (мессенджер). 7 дней, до 5 устройств. */
export async function loginLink(email){
  const crypto = await import('node:crypto');
  const m = norm(email); if (!m || !m.includes('@')) throw new Error('нужна почта');
  const r = (await get(reqKey(m))) || { email: m, at: Date.now(), lang: 'ru', status: 'waiting' };
  if (!(await get(reqKey(m)))) { const list = (await get(LIST)) || []; list.push(m); await set(LIST, list); }
  if (r.status !== 'joined') { r.status = 'invited'; r.invitedAt = r.invitedAt || Date.now(); }
  r.linkAt = Date.now(); await set(reqKey(m), r);
  const token = crypto.randomBytes(18).toString('base64url');
  await set('rad:mlink:' + token, { email: m, exp: Date.now() + 7 * 24 * 3600 * 1000, uses: 0, at: Date.now() });
  return { url: `${SITE()}/app.html?login=${token}`, email: m };
}

/** Новый человек зарегистрировался сам — строка в списке на странице владельца. */
export async function markSignedUp(mail, lang){
  const m = norm(mail); const r = await get(reqKey(m));
  if (r) { if (r.status !== 'joined') { r.status = 'joined'; r.joinedAt = Date.now(); await set(reqKey(m), r); } return; }
  await set(reqKey(m), { email: m, at: Date.now(), lang: lang || 'ru', status: 'joined', joinedAt: Date.now(), via: 'signup' });
  const list = (await get(LIST)) || []; if (!list.includes(m)) { list.push(m); await set(LIST, list); }
}
