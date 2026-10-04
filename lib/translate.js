// «Перевести сказку»: двуязычная книжка и озвучка перевода голосом Favola.
// Перевод и озвучка хранятся в самой сказке: rec.tr[язык] = {title, panels, audio:[файл на страницу]}.
import { get, set } from './store.js';
import { generateText, jsonFrom, generateVoice } from './providers.js';
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
  let out = null;
  for (let t = 0; t < 2 && !out; t++){
    const raw = await GEN_TEXT({
      system: `You translate a children's bedtime story page by page into ${langName(to)} for a family learning that language together. Keep the meaning, warmth and names; use simple, natural sentences a child can follow; keep each page as one page. Answer with JSON only: {"title":"...","pages":["...", "..."]} with exactly ${pages.length} pages, in the same order.`,
      prompt: JSON.stringify({ title: rec.title || '', pages }), maxTokens: 4000, temperature: 0.3 });
    try { const j = jsonFrom(raw); if (Array.isArray(j.pages) && j.pages.length === pages.length) out = { title: String(j.title || rec.title || ''), panels: j.pages.map(p => String(p || '').slice(0, 3000)) }; } catch (e) {}
  }
  if (!out) throw new Error('перевод не получился, попробуйте ещё раз');
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
    const v = await GEN_VOICE({ text: tr.panels[i], voiceId: NARRATOR(), settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2 } });
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
