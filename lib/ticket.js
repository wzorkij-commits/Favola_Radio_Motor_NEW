// Пропуск на сборку одной сказки. Выдаётся в /api/spend в ту же секунду, когда
// списывается сказка (бесплатная или из оплаченных), и нужен каждому адресу,
// который тратит деньги: очистка и расшифровка звука, чистка текста, сцены,
// картинки, лист героя, конструктор, озвучка. Без пропуска эти адреса отвечают
// 402 — пользоваться ими в обход приложения и оплаты нельзя.
//
// Пропуск живёт 7 дней (запись, отложенная в телефоне, успеет собраться),
// привязан к устройству и выдерживает до MAX_CALLS вызовов (сказка с повторами
// после сбоев — это 15–40 вызовов). Аварийный выключатель: RADIO_OPEN=1 в Vercel.
import { get, run } from './store.js';

const TTL_SEC = 7 * 24 * 3600;
export const MAX_CALLS = 80;
const key = id => 'rad:ticket:' + id;
const ok = id => /^tk_[a-z0-9]{10,40}$/.test(String(id || ''));

export async function issueTicket(device, kind) {
  const id = 'tk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  await run([['SET', key(id), JSON.stringify({ device: String(device), kind: kind || 'story', at: Date.now(), calls: 0 }), 'EX', String(TTL_SEC)]]);
  return id;
}

/** Проверяет пропуск. true — можно работать; false — ответ 402/429 уже отправлен. */
export async function requireTicket(req, res, fromPayload) {
  if (process.env.RADIO_OPEN === '1') return true;
  const b = fromPayload || req.body || {};
  const deny = (code, why, outcome) => { res.status(code).json({ error: why, outcome }); return false; };
  if (!b.device || !ok(b.ticket)) return deny(402, 'Сказку нужно начать в приложении Favola Radio: там списывается бесплатная или оплаченная сказка.', 'no-ticket');
  const t = await get(key(b.ticket));
  if (!t || t.device !== String(b.device)) return deny(402, 'Пропуск на эту сказку не найден или устарел. Начните сказку заново.', 'no-ticket');
  t.calls = (t.calls || 0) + 1;
  if (t.calls > MAX_CALLS) return deny(429, 'Слишком много попыток для одной сказки. Начните сказку заново.', 'too-many');
  await run([['SET', key(b.ticket), JSON.stringify(t), 'KEEPTTL']]);
  return true;
}
