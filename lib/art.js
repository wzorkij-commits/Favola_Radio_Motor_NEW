// Картинки к сказке рисует сервер, а не телефон.
// Телефон отправляет одну короткую команду (POST /api/art), получает номер задания и
// только спрашивает «готово?» (GET /api/art?job=…). Сервер рисует в фоне: лист героя,
// потом кадры по два за раз, у каждого до MAX_TRIES попыток, файлы кладёт в хранилище.
// Что не получилось сразу, дорисовывает расписание (cron) — пока не выйдет.
// Если задание привязано к сохранённой сказке, готовые картинки сами встают в неё.
import { generateImage } from './providers.js';
import { buildSceneImagePrompt, buildCastSheetPrompt } from './prompts.js';
import { get, set } from './store.js';
import { putFile, fromDataUrl, readFile, BLOB_READY, viewUrl, canonicalUrl } from './blob.js';

export const MAX_TRIES = 4;          // попыток за один проход
export const LIFETIME_TRIES = 16;    // всего попыток за жизнь задания (с учётом расписания)
const PENDING = 'rad:art:pending';
export const jobKey = id => 'rad:art:' + id;
const storyKey = id => 'rad:story:' + id;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let SLEEP = sleep;                   // тесты подменяют паузы
export function _fastForTests(){ SLEEP = async () => {}; }
let GEN = generateImage;             // тесты подменяют рисование
export function _setGenForTests(fn){ GEN = fn; }

export function newJob({ device, style, cast, world, scenes, heroRef }){
  const id = 'aj_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return {
    id, device, style: style || null, cast: String(cast || '').slice(0, 600), world: world || '',
    hero: heroRef ? { state: 'done', url: heroRef } : (cast ? { state: 'wait', url: null, tries: 0 } : { state: 'skip', url: null }),
    items: (scenes || []).slice(0, 12).map(s => ({ brief: String(s.brief || '').slice(0, 1200), shows: s.shows || [], state: 'wait', url: null, tries: 0, err: '' })),
    storyId: null, created: Date.now(), updated: Date.now()
  };
}

async function pendingList(){ return (await get(PENDING)) || []; }
async function setPending(ids){ await set(PENDING, [...new Set(ids)].slice(-500)); }
export async function markPending(id, on){
  const list = await pendingList();
  await setPending(on ? [...list, id] : list.filter(x => x !== id));
}

async function saveImage(jobId, name, dataUrl){
  if (!BLOB_READY()) return dataUrl;                        // без хранилища (тесты) — держим как есть
  const f = fromDataUrl(dataUrl);
  return await putFile(`radio-art/${jobId}/${name}.${f.ext}`, f.buffer, f.type);
}
async function asDataUrl(url){
  if (!url) return null;
  if (String(url).startsWith('data:')) return url;
  try { const f = await readFile(url); return `data:${f.mime || 'image/png'};base64,${f.buffer.toString('base64')}`; }
  catch (e) { return null; }
}

/** Вписать готовые картинки в сохранённую сказку (если задание к ней привязано). */
export async function copyIntoStory(job){
  if (!job.storyId) return;
  const rec = await get(storyKey(job.storyId));
  if (!rec) return;
  rec.art = rec.art || [];
  let changed = false;
  job.items.forEach((it, i) => {
    if (it.state === 'done' && it.url && (!String(it.url).startsWith('data:') || !BLOB_READY()) && !rec.art[i]) { rec.art[i] = String(it.url).startsWith('data:') ? it.url : canonicalUrl(it.url); changed = true; }
  });
  if (changed) await set(storyKey(job.storyId), rec);
}

/** Один проход по заданию: лист героя, затем недорисованные кадры по два за раз. */
export async function processJob(id){
  let job = await get(jobKey(id));
  if (!job) return null;
  const save = async () => { job.updated = Date.now(); await set(jobKey(id), job); };
  let heroData = null;
  if (job.hero.state === 'wait' && job.hero.tries < LIFETIME_TRIES){
    for (let t = 0; t < 2 && job.hero.state !== 'done'; t++){
      try {
        heroData = await GEN(buildCastSheetPrompt(job.cast, job.style));
        job.hero = { state: 'done', url: await saveImage(id, 'hero', heroData), tries: job.hero.tries + 1 };
      } catch (e) { job.hero.tries++; job.hero.err = String(e.message || e).slice(0, 300); await SLEEP(1500); }
    }
    if (job.hero.state !== 'done') job.hero.state = 'skip';   // без листа героя кадры всё равно рисуем
    await save();
  }
  if (!heroData && job.hero.state === 'done') heroData = await asDataUrl(job.hero.url);
  const refs = heroData ? [heroData] : [];
  const todo = job.items.map((it, i) => i).filter(i => job.items[i].state !== 'done' && job.items[i].tries < LIFETIME_TRIES);
  let next = 0;
  const worker = async () => {
    while (next < todo.length){
      const i = todo[next++], it = job.items[i];
      for (let t = 0; t < MAX_TRIES && it.state !== 'done' && it.tries < LIFETIME_TRIES; t++){
        try {
          const prompt = buildSceneImagePrompt(it.brief, job.cast, refs.length > 0, { world: job.world, shows: it.shows, style: job.style });
          const img = await GEN(prompt, refs);
          it.url = await saveImage(id, 'scene-' + (i + 1), img);
          it.state = 'done'; it.err = '';
        } catch (e) { it.err = String(e.message || e).slice(0, 300); await SLEEP(2000 * (t + 1)); }
        it.tries++;
      }
      if (it.state !== 'done') it.state = 'retry';           // дорисует расписание
      await save();
      await copyIntoStory(job);
    }
  };
  await Promise.all([worker(), worker()]);
  const unfinished = job.items.some(it => it.state !== 'done' && it.tries < LIFETIME_TRIES);
  await markPending(id, unfinished);
  await save();
  await copyIntoStory(job);
  return job;
}

/** Что отдать телефону: состояние и ссылки, которые телефон может открыть. */
export async function publicJob(job){
  const items = [];
  for (const it of job.items) items.push({ state: it.state, url: it.url ? await viewUrl(it.url) : null, err: it.state === 'done' ? '' : it.err });
  return { job: job.id, items, done: items.every(x => x.state === 'done'), hero: job.hero.state };
}

/** Проход расписания: несколько старейших незаконченных заданий. */
export async function cronPass(limit = 3){
  const ids = await pendingList();
  const out = [];
  for (const id of ids.slice(0, limit)){
    const job = await get(jobKey(id));
    if (!job) { await markPending(id, false); continue; }
    if (Date.now() - job.updated < 60_000) continue;          // над ним ещё работает первый проход
    const j = await processJob(id);
    out.push({ id, done: j ? j.items.filter(i => i.state === 'done').length : 0, of: j ? j.items.length : 0 });
  }
  return out;
}
