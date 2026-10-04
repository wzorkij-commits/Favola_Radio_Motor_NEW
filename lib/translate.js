// «Перевести сказку»: двуязычная книжка и озвучка перевода голосом Favola.
// Перевод и озвучка хранятся в самой сказке: rec.tr[язык] = {title, panels, audio:[файл на страницу]}.
import { get, set } from './store.js';
import { generateText, jsonFrom, generateVoice, elevenFetch } from './providers.js';
import { langName, LANGS } from './prompts.js';
import { putFile, viewUrl, canonicalUrl, BLOB_READY } from './blob.js';

export const storyKey = id => 'rad:story:' + id;
// голос Favola для озвучки перевода: многоязычная модель ElevenLabs, один голос на все языки
export const NARRATOR = () => process.env.FAVOLA_NARRATOR_VOICE || '21m00Tcm4TlvDq8ikWAM';
let GEN_TEXT = generateText, GEN_VOICE = generateVoice;
export function _setForTests(t, v){ if (t) GEN_TEXT = t; if (v) GEN_VOICE = v; }

export async function translateStory(rec, to){
  if (!LANGS.includes(to)) throw new Error('нет такого языка');
  rec.tr = rec.tr || {};
  if (rec.tr[to] && Array.isArray(rec.tr[to].panels)) return rec.tr[to];
  const pages = rec.panels || [];
  // Без JSON: кавычки в диалогах (особенно в китайском) ломали разбор. Страницы — с метками [[1]], [[2]]…
  let out = null, why = '';
  for (let t = 0; t < 3 && !out; t++){
    const raw = await GEN_TEXT({
      system: `You translate a children's bedtime story page by page into ${langName(to)} for a family learning that language together. Keep the meaning, warmth and names; use simple, natural sentences a child can follow; translate every page as one page, never merge or split pages.
Answer in exactly this format and nothing else:
TITLE: <translated title>
[[1]] <page 1>
[[2]] <page 2>
… up to [[${pages.length}]].`,
      prompt: `TITLE: ${rec.title || ''}\n` + pages.map((p, i) => `[[${i + 1}]] ${p}`).join('\n'), maxTokens: 6000, temperature: 0.3 });
    const parsed = parseTranslation(raw, pages.length);
    if (parsed) out = { title: parsed.title || rec.title || '', panels: parsed.pages }; else why = 'страниц не столько, сколько в сказке';
  }
  if (!out) throw new Error('перевод не получился (' + why + '), попробуйте ещё раз');
  rec.tr[to] = { ...out, audio: null, at: Date.now() };
  await set(storyKey(rec.id), rec);
  return rec.tr[to];
}

export async function narrate(rec, to){
  const tr = rec.tr && rec.tr[to];
  if (!tr) throw new Error('сначала переведите сказку');
  if (Array.isArray(tr.audio) && tr.audio.every(Boolean)) return tr;
  const audio = Array.isArray(tr.audio) ? tr.audio.slice() : new Array(tr.panels.length).fill(null);
  for (let i = 0; i < tr.panels.length; i++){
    if (audio[i]) continue;
    // Multilingual v2 не знает литовского — для него берём Eleven v3 (74 языка)
    const v = to === 'lt' && GEN_VOICE === generateVoice
      ? await voiceV3(tr.panels[i])
      : await GEN_VOICE({ text: tr.panels[i], voiceId: NARRATOR(), settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2 }, lang: to });
    const buf = Buffer.from(v.audio, 'base64');
    audio[i] = BLOB_READY() ? await putFile(`stories/${rec.id}/tr-${to}-${i}.mp3`, buf, 'audio/mpeg') : 'data:audio/mpeg;base64,' + v.audio;
    tr.audio = audio; await set(storyKey(rec.id), rec);           // сохраняем по странице — повтор продолжит с места
  }
  return tr;
}

export async function publicTr(rec){
  const out = {};
  for (const [l, t] of Object.entries(rec.tr || {})){
    out[l] = { title: t.title, panels: t.panels, audio: Array.isArray(t.audio) ? await Promise.all(t.audio.map(u => u ? viewUrl(u) : null)) : null };
  }
  return out;
}

/** Разбор ответа «TITLE: …  [[1]] …  [[2]] …» — страниц должно быть ровно столько, сколько в сказке. */
export function parseTranslation(raw, n){
  const text = String(raw || '').replace(/\r/g, '');
  const tm = /^\s*TITLE\s*[:：]\s*(.+)$/m.exec(text);
  const parts = text.split(/\[\[\s*(\d+)\s*\]\]/);
  const pages = new Array(n).fill(null);
  for (let i = 1; i < parts.length; i += 2){ const k = Number(parts[i]) - 1; if (k >= 0 && k < n) pages[k] = parts[i + 1].trim(); }
  if (pages.some(p => !p)) return null;
  return { title: tm ? tm[1].trim() : '', pages: pages.map(p => p.slice(0, 3000)) };
}

/** Озвучка моделью Eleven v3 (литовский и другие языки, которых нет в Multilingual v2): mp3 → base64. */
export async function voiceV3(text){
  const r = await elevenFetch(`https://api.elevenlabs.io/v1/text-to-speech/${NARRATOR()}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'xi-api-key': process.env.ELEVENLABS_API_KEY, accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: 'eleven_v3', language_code: 'lt' })
  }, 'tts');
  if (!r.ok) throw new Error(`voice ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return { audio: Buffer.from(await r.arrayBuffer()).toString('base64') };
}
