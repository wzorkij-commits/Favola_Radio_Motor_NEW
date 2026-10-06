// Вход по коду на почту — тот же аккаунт, что в Favola (код проверяется
// по той же общей базе).
//
//   POST /api/otp {device, email}        — прислать код
//   POST /api/otp {device, email, code}  — проверить и войти
import { cors } from './providers.js';
import { get, set, loadUser, saveUser, publicView, linkIdentity, emailKey } from './store.js';
import { FREE_STORIES } from './plans.js';
import { send, codeLetter, MAIL_READY } from './mail.js';
import { grantOwner, isOwner } from './owner.js';
import { allowed, markJoined, markSignedUp } from './beta.js';
import { applyPendingGrants } from './promo.js';

const okMail = m => typeof m === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m.trim());
const codeKey = mail => 'fav:otp:' + mail;   // тот же ключ, что у Favola: код один на оба входа
const LIFE = 15 * 60 * 1000;
const TRIES = 5;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return res.status(200).json({ enabled: MAIL_READY() });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { device, email, code, lang } = req.body || {};
    // ── вход по личной ссылке от владельца (когда код на почту не доходит) ──
    if ((req.body || {}).act === 'magic') {
      const token = String((req.body || {}).token || '').replace(/[^A-Za-z0-9_-]/g, '');
      const link = token ? await get('rad:mlink:' + token) : null;
      if (!device || !link || link.exp < Date.now() || (link.uses || 0) >= 5)
        return res.status(200).json({ outcome: 'link-expired' });
      link.uses = (link.uses || 0) + 1; await set('rad:mlink:' + token, link);
      const mail2 = link.email;
      const u2 = await loadUser(device);
      u2.email = mail2;
      if (!u2.name) u2.name = mail2.split('@')[0];
      await linkIdentity(u2, emailKey(mail2));
      grantOwner(u2, mail2);
      await saveUser(u2);
      await markJoined(mail2).catch(() => {});
      return res.status(200).json({ outcome: 'ok', ...publicView(u2, FREE_STORIES), вошёл: true });
    }
    if (!device) return res.status(400).json({ error: 'нет ключа устройства' });
    if (!okMail(email)) return res.status(400).json({ error: 'почта не похожа на почту' });
    if (!MAIL_READY()) {
      return res.status(200).json({ outcome: 'not-configured',
        why: 'Вход по почте не подключён: в Vercel не задан RESEND_API_KEY.' });
    }
    const mail = email.trim().toLowerCase();

    if (!code) {
      // закрытая бета: код получают только приглашённые и те, кто уже заходил
      if (!(await allowed(mail))) return res.status(200).json({ outcome: 'beta', email: mail });
      const digits = String(Math.floor(100000 + Math.random() * 900000));
      await set(codeKey(mail), { code: digits, until: Date.now() + LIFE, left: TRIES, device });
      const letter = codeLetter(digits, lang);
      try { await send({ to: mail, ...letter }); }
      catch (e) { return res.status(200).json({ outcome: 'error', why: String(e.message || e) }); }
      return res.status(200).json({ outcome: 'sent', minutes: 15 });
    }

    const saved = await get(codeKey(mail));
    if (!saved) return res.status(200).json({ outcome: 'expired', why: 'код устарел, попросите новый' });
    if (saved.until < Date.now()) {
      await set(codeKey(mail), null);
      return res.status(200).json({ outcome: 'expired', why: 'код устарел, попросите новый' });
    }
    if (saved.left <= 0) return res.status(200).json({ outcome: 'expired', why: 'слишком много попыток' });

    if (String(code).trim() !== saved.code) {
      saved.left -= 1;
      await set(codeKey(mail), saved);
      return res.status(200).json({ outcome: 'wrong', left: saved.left });
    }

    await set(codeKey(mail), null);

    const u = await loadUser(device);
    u.email = mail;
    if (!u.name) u.name = mail.split('@')[0];
    await linkIdentity(u, emailKey(mail));
    grantOwner(u, mail);
    await applyPendingGrants(u, mail).catch(() => {});   // доступ, который владелец выдал заранее
    await saveUser(u);
    await markSignedUp(mail, lang).catch(() => {});   // есть в списке — «вошёл»; нет — новая строка на странице владельца

    return res.status(200).json({ outcome: 'ok', ...publicView(u, FREE_STORIES), вошёл: true });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
