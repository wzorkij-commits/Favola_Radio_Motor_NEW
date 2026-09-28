// Полная живая проверка Favola Radio: каждый внешний сервис по-настоящему,
// но дёшево (десятые доли цента, кроме одной картинки ≈ $0,07).
// Результат — список пунктов: ok / warn / fail + что делать человеку.
import { generateImage, generateText } from './providers.js';
import { STORE_READY, get, set } from './store.js';
import { SUMUP_READY, merchantCode } from './sumup.js';
import { BLOB_READY, putFile, readFile, deleteFiles, viewUrl } from './blob.js';

const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + ': нет ответа за ' + ms / 1000 + ' с')), ms))]);
const item = (id, name, status, detail, fix) => ({ id, name, status, detail: detail || '', fix: fix || '' });

async function checkConfig(){
  const need = { ANTHROPIC_API_KEY:'тексты (Claude)', GEMINI_API_KEY:'картинки (Google)', ELEVENLABS_API_KEY:'голос (ElevenLabs)',
    RESEND_API_KEY:'письма с кодом', MAIL_FROM:'адрес отправителя писем', GOOGLE_CLIENT_ID:'вход через Google', SUMUP_API_KEY:'оплата' };
  const miss = Object.entries(need).filter(([k]) => !process.env[k]).map(([k, v]) => `${k} (${v})`);
  const out = [miss.length ? item('config', 'Ключи в Vercel', 'fail', 'нет: ' + miss.join(', '), 'Vercel → favola-radio → Settings → Environment Variables: добавить и сделать Redeploy.')
                           : item('config', 'Ключи в Vercel', 'ok', 'все ключи на месте')];
  out.push(process.env.RADIO_OPEN === '1'
    ? item('open', 'Защита оплаты', 'warn', 'включён аварийный выключатель RADIO_OPEN=1: платные шаги работают без списания сказки', 'Удалите RADIO_OPEN в Environment Variables и сделайте Redeploy — иначе сказки бесплатные для всех.')
    : item('open', 'Защита оплаты', 'ok', 'сказки списываются, пропуск на сказку работает'));
  return out;
}
async function checkStore(){
  if (!STORE_READY) return item('store', 'База (аккаунты, сказки)', 'fail', 'база не подключена', 'Проверьте KV_REST_API_URL / TOKEN в Vercel.');
  const k = 'rad:health:' + Date.now(); await set(k, { ok: 1 }); const v = await get(k);
  return v && v.ok ? item('store', 'База (аккаунты, сказки)', 'ok', 'запись и чтение работают') : item('store', 'База (аккаунты, сказки)', 'fail', 'записанное не читается', 'Проверьте тариф Upstash (лимит команд) и ключи.');
}
async function checkBlob(){
  if (!BLOB_READY()) return item('blob', 'Хранилище файлов (голос, картинки)', 'fail', 'хранилище не подключено', 'Проверьте BLOB_STORE_ID / BLOB_READ_WRITE_TOKEN в Vercel.');
  const url = await putFile('health/' + Date.now() + '.txt', Buffer.from('favola'), 'text/plain');
  const f = await readFile(url); const phone = await viewUrl(url);
  const r = await fetch(phone); await deleteFiles([url]).catch(() => {});
  return f.buffer.toString() === 'favola' && r.ok ? item('blob', 'Хранилище файлов (голос, картинки)', 'ok', 'файл пишется, читается и открывается телефоном')
    : item('blob', 'Хранилище файлов (голос, картинки)', 'fail', 'файл не открылся по ссылке для телефона (' + r.status + ')', 'Напишите Claude — нужна проверка доступа к хранилищу.');
}
async function checkText(){
  const t = await generateText({ system: 'Answer with one word.', prompt: 'Say: сказка', maxTokens: 10, temperature: 0 });
  return item('text', 'Тексты сказок (Claude)', 'ok', 'Claude отвечает: «' + String(t).trim().slice(0, 20) + '»');
}
async function checkImage(){
  const img = await generateImage('A single small blue azulejo tile on cream paper, flat illustration, no text.');
  return item('image', 'Картинки (Google Gemini)', 'ok', 'нарисована пробная картинка, ' + Math.round(img.length * 0.75 / 1024) + ' КБ');
}
async function checkVoice(){
  // Тот же путь, что у записи человека: готовая запись речи → очистка от шума → расшифровка.
  // (Раньше запись делалась синтезом голоса и зависела от ELEVENLABS_VOICE_RU, которая самому
  // приложению не нужна; из-за неверного значения в ней проверка падала, хотя запись работала.)
  const { SAMPLE_MP3 } = await import('../data/health-voice.js');
  const buf = Buffer.from(SAMPLE_MP3, 'base64');
  const key = process.env.ELEVENLABS_API_KEY;
  const name = 'Голос: очистка и расшифровка (ElevenLabs)';
  const f1 = new FormData(); f1.append('audio', new Blob([buf], { type: 'audio/mpeg' }), 'h.mp3');
  const r1 = await fetch('https://api.elevenlabs.io/v1/audio-isolation', { method: 'POST', headers: { 'xi-api-key': key }, body: f1 });
  if (!r1.ok) return item('voice', name, 'fail', 'очистка звука: ' + r1.status + ' ' + (await r1.text()).slice(0, 160), 'Проверьте ключ ELEVENLABS_API_KEY, тариф и кредиты ElevenLabs.');
  const clean = Buffer.from(await r1.arrayBuffer());
  const f2 = new FormData(); f2.append('model_id', process.env.FAVOLA_STT_MODEL || 'scribe_v1'); f2.append('file', new Blob([clean], { type: 'audio/mpeg' }), 'h.mp3');
  const r2 = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: f2 });
  if (!r2.ok) return item('voice', name, 'fail', 'расшифровка: ' + r2.status + ' ' + (await r2.text()).slice(0, 160), 'Проверьте ключ ELEVENLABS_API_KEY, тариф и кредиты ElevenLabs.');
  const j = await r2.json(); const heard = String(j.text || '').trim();
  return /сов|лун/i.test(heard) ? item('voice', name, 'ok', 'очистка и расшифровка работают: «' + heard.slice(0, 50) + '»')
    : item('voice', name, 'warn', 'расшифровано неточно: «' + heard.slice(0, 50) + '» (проверочная запись синтетическая)', 'Если сказки людей расшифровываются нормально — всё в порядке.');
}
function checkVoiceVars(){
  const bad = ['ELEVENLABS_VOICE_RU', 'ELEVENLABS_VOICE_EN'].filter(k => /^sk_/.test(process.env[k] || ''));
  return bad.length ? [item('voicevar', 'Лишняя переменная ElevenLabs', 'warn', `в ${bad.join(', ')} записан ключ API, а не номер голоса`,
    'Удалите эту переменную в Vercel: приложению она не нужна. Ключ ElevenLabs должен лежать только в ELEVENLABS_API_KEY.')] : [];
}
async function checkMail(){
  const from = process.env.MAIL_FROM || '';
  const dom = (from.match(/@([^>\s]+)/) || [])[1] || '';
  const r = await fetch('https://api.resend.com/domains', { headers: { authorization: 'Bearer ' + process.env.RESEND_API_KEY } });
  if (r.status === 401 || r.status === 403) return item('mail', 'Письма с кодом входа (Resend)', 'fail', 'ключ Resend не принят (' + r.status + ')', 'Создайте новый ключ в Resend и замените RESEND_API_KEY.');
  if (!r.ok) return item('mail', 'Письма с кодом входа (Resend)', 'warn', 'Resend ответил ' + r.status + ' — ключ, возможно, только для отправки', 'Если коды приходят — всё в порядке.');
  const j = await r.json(); const d = (j.data || []).find(x => x.name === dom);
  if (!d) return item('mail', 'Письма с кодом входа (Resend)', 'fail', `домен ${dom || '(не указан в MAIL_FROM)'} не найден в Resend`, 'Resend → Domains: добавьте favola.space и подтвердите.');
  return d.status === 'verified' ? item('mail', 'Письма с кодом входа (Resend)', 'ok', `домен ${dom} подтверждён; бесплатно — до 100 писем в день`, 'Перед рассылкой ссылки многим людям перейдите на Resend Pro.')
    : item('mail', 'Письма с кодом входа (Resend)', 'fail', `домен ${dom}: ${d.status}`, 'Resend → Domains → подтвердите домен.');
}
async function checkPay(){
  if (!SUMUP_READY()) return item('pay', 'Оплата (SumUp)', 'fail', 'SumUp не подключён', 'Добавьте SUMUP_API_KEY в Vercel.');
  const code = await merchantCode();
  return item('pay', 'Оплата (SumUp)', 'ok', 'SumUp отвечает, продавец ' + code, 'Один раз проверьте настоящей оплатой и возвратом.');
}
async function checkArtQueue(){
  const ids = (await get('rad:art:pending')) || [];
  let oldest = 0;
  for (const id of ids.slice(0, 20)) { const j = await get('rad:art:' + id); if (j) oldest = Math.max(oldest, Date.now() - j.created); }
  if (!ids.length) return item('art', 'Дорисовка картинок по расписанию', 'ok', 'очередь пуста — все картинки дорисованы');
  return oldest > 60 * 60 * 1000
    ? item('art', 'Дорисовка картинок по расписанию', 'warn', `в очереди ${ids.length}, самое старое задание — ${Math.round(oldest / 60000)} мин`, 'Vercel → favola-radio → Settings → Cron Jobs: задача должна быть включена.')
    : item('art', 'Дорисовка картинок по расписанию', 'ok', `в очереди ${ids.length} — дорисовываются`);
}
function checkGoogle(){
  return item('google', 'Вход через Google', process.env.GOOGLE_CLIENT_ID ? 'warn' : 'fail',
    process.env.GOOGLE_CLIENT_ID ? 'ключ есть; статус публикации отсюда не виден' : 'нет GOOGLE_CLIENT_ID',
    'Google Cloud → OAuth consent screen → Audience: должно быть «In production». В режиме Testing войти через Google смогут только добавленные вами тестовые адреса.');
}

export async function runHealth(){
  const checks = [
    ['config', checkConfig], ['store', checkStore], ['blob', checkBlob], ['text', checkText], ['image', checkImage],
    ['voice', checkVoice], ['mail', checkMail], ['pay', checkPay], ['art', checkArtQueue]
  ];
  const names = { config:'Ключи в Vercel', store:'База (аккаунты, сказки)', blob:'Хранилище файлов (голос, картинки)', text:'Тексты сказок (Claude)',
    image:'Картинки (Google Gemini)', voice:'Голос: очистка и расшифровка (ElevenLabs)', mail:'Письма с кодом входа (Resend)', pay:'Оплата (SumUp)', art:'Дорисовка картинок по расписанию' };
  const fixes = { text:'Проверьте баланс и ключ в console.anthropic.com (ключ мог истечь).', image:'Проверьте оплату Google Cloud и лимиты Gemini API.' };
  const res = await Promise.all(checks.map(([id, fn]) => withTimeout(fn(), 90000, names[id])
    .catch(e => item(id, names[id], 'fail', String(e.message || e).slice(0, 220), fixes[id] || 'Напишите Claude текст ошибки.'))));
  const flat = res.flat(); flat.push(...checkVoiceVars(), checkGoogle());
  const worst = flat.some(x => x.status === 'fail') ? 'fail' : flat.some(x => x.status === 'warn') ? 'warn' : 'ok';
  return { at: new Date().toISOString(), overall: worst, checks: flat };
}
