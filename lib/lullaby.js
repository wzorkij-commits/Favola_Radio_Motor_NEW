// Колыбельные: владелец загружает запись, мотор рисует обложку, слушать могут все.
//   rad:lull:list — порядок (новые сверху); rad:lull:<id> — {id, title, author, lang, audio, cover, seed, at, plays, coverState}
import { get, set } from './store.js';
import { viewUrl, canonicalUrl, putFile, fromDataUrl, BLOB_READY } from './blob.js';

const LIST = 'rad:lull:list';
export const lullKey = id => 'rad:lull:' + id;
let GEN = null;
export function _setGenForTests(fn){ GEN = fn; }

export async function addLullaby({ audioUrl, title, author, lang, idea }){
  const id = 'lu' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const rec = { id, title: String(title || '').slice(0, 80), author: String(author || '').slice(0, 60), lang: lang === 'en' ? 'en' : 'ru',
    idea: String(idea || '').slice(0, 200), audio: String(audioUrl).startsWith('data:') ? audioUrl : canonicalUrl(audioUrl),
    cover: null, coverState: 'wait', seed: 'lull-' + id, at: Date.now(), plays: 0 };
  await set(lullKey(id), rec);
  await set(LIST, [id, ...((await get(LIST)) || [])].slice(0, 500));
  return rec;
}
/** Рисуем обложку: ночь, луна, сон — в стиле португальской книжки, без надписей. */
export async function drawCover(id){
  const rec = await get(lullKey(id)); if (!rec) return null;
  rec.coverState = 'work'; await set(lullKey(id), rec);
  const gen = GEN || (await import('./providers.js')).generateImage;
  const prompt = `A square picture-book cover illustration for a lullaby${rec.title ? ` called "${rec.title}"` : ''}. ` +
    `A calm night scene: a big soft moon, stars, a gentle sleeping moment${rec.idea ? `, ${rec.idea}` : ''}. ` +
    `Portuguese folk picture-book style with azulejo-inspired ornament, deep night blue, warm gold and cream, soft light, peaceful, for small children. No text, no letters, no words.`;
  for (let t = 0; t < 3; t++){
    try {
      const img = await gen(prompt);
      let url = img;
      if (BLOB_READY()) { const f = fromDataUrl(img); url = await putFile(`lullabies/${id}.${f.ext}`, f.buffer, f.type); }
      rec.cover = url; rec.coverState = 'done'; rec.coverError = ''; await set(lullKey(id), rec); return rec;
    } catch (e) { rec.coverError = String(e.message || e).slice(0, 200); }
  }
  rec.coverState = 'error'; await set(lullKey(id), rec); return rec;
}
export async function removeLullaby(id){
  await set(lullKey(id), null);
  await set(LIST, ((await get(LIST)) || []).filter(x => x !== id));
}
export async function listLullabies(lang){
  const out = [];
  for (const id of (await get(LIST)) || []){
    const r = await get(lullKey(id)); if (!r) continue;
    if (lang && (r.lang || 'ru') !== lang) continue;      // у русской и английской версии приложения — свои колыбельные
    out.push({ id: r.id, title: r.title, author: r.author, lang: r.lang, seed: r.seed, cover: r.cover ? await viewUrl(r.cover) : null, coverState: r.coverState, coverError: r.coverError || '', plays: r.plays || 0 });
  }
  return out;
}
export async function playLullaby(id){
  const r = await get(lullKey(id)); if (!r) return null;
  r.plays = (r.plays || 0) + 1; await set(lullKey(id), r);
  return { id: r.id, title: r.title, author: r.author, cover: r.cover ? await viewUrl(r.cover) : null, seed: r.seed, audio: await viewUrl(r.audio) };
}
