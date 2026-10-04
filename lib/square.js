// Площадь сказок, ссылки «поделиться» и загрузка сказок владельцем за автора.
//
//   rad:share:<ключ>        — {id, at, plays}: ссылка открывает ровно одну сказку, без входа
//   rad:sq:live / :pending  — порядок сказок на Площади и в очереди на проверку
//   rad:sq:vote:<id>:<кто>  — ласточка (одна от человека на сказку)
//   rad:import:<id>         — задание «загрузить за автора»: шаги сборки на сервере
// В самой сказке: rec.share = {token, at}, rec.square = {status, author, verified, swallows, at, liveAt}
import crypto from 'node:crypto';
import { get, set, loadUser, saveUser } from './store.js';
import { viewUrl, canonicalUrl } from './blob.js';
import { isBlobUrl as blobUrl } from './record.js';
import { isOwner } from './owner.js';
import { normLang } from './prompts.js';

export const storyKey = id => 'rad:story:' + id;
export const LIVE = 'rad:sq:live', PENDING = 'rad:sq:pending', REPORTS = 'rad:sq:reports';
const SITE = () => process.env.RADIO_SITE || 'https://www.favola.space';
export const squareOpen = () => process.env.SQUARE_OPEN === '1';
export const whoKey = u => u.email || (u.google ? 'g:' + u.google : 'd:' + u.id);

export function mine(rec, device, u){
  return !!rec && (rec.device === device || (u.google && rec.google === u.google) || (u.email && rec.email === u.email) || (u.radio_made || []).includes(rec.id));
}
export async function ownerOf(device){ if (!device) return null; const u = await loadUser(device); return isOwner(u.email) ? u : null; }
async function listGet(k){ return (await get(k)) || []; }
async function listPut(k, ids){ await set(k, [...new Set(ids)].slice(0, 5000)); }

/** Сказка для чужого слушателя: только то, что нужно проиграть, по временным ссылкам. */
export async function publicStory(rec){
  const sq = rec.square || {};
  return {
    id: rec.id, title: rec.title, lang: rec.lang, kind: rec.kind, panels: rec.panels || [], questions: rec.questions || [],
    art: await Promise.all((rec.art || []).map(u => viewUrl(u))),
    audio: { voice: rec.audio && (rec.audio.voice || rec.audio.full) ? await viewUrl(rec.audio.voice || rec.audio.full) : null },
    meta: rec.meta || null, seed: rec.seed || null, tile: rec.tile || null, emblem: rec.emblem || null,
    author: sq.author || '', verified: !!sq.verified, swallows: sq.swallows || 0
  };
}
export async function cardOf(rec, who){
  const sq = rec.square || {};
  return { id: rec.id, title: rec.title, author: sq.author || '', verified: !!sq.verified, swallows: sq.swallows || 0,
    seed: rec.seed || null, tile: rec.tile || null, emblem: rec.emblem || null, at: sq.liveAt || sq.at || rec.at,
    cover: await viewUrl((rec.art || [])[0] || null), mine: who ? !!(await get(`rad:sq:vote:${rec.id}:${who}`)) : false };
}

/* ── ссылка «поделиться» ── */
export async function createShare(rec){
  if (rec.share && rec.share.token && await get('rad:share:' + rec.share.token)) {
    const s = await get('rad:share:' + rec.share.token);
    return { token: rec.share.token, url: `${SITE()}/listen.html?s=${rec.share.token}`, plays: s.plays || 0 };
  }
  const token = crypto.randomBytes(9).toString('base64url');
  await set('rad:share:' + token, { id: rec.id, at: Date.now(), plays: 0 });
  rec.share = { token, at: Date.now() }; await set(storyKey(rec.id), rec);
  return { token, url: `${SITE()}/listen.html?s=${token}`, plays: 0 };
}
export async function revokeShare(rec){
  if (rec.share && rec.share.token) await set('rad:share:' + rec.share.token, null);
  rec.share = null; await set(storyKey(rec.id), rec);
}
export async function openShare(token){
  const s = token ? await get('rad:share:' + String(token).replace(/[^A-Za-z0-9_-]/g, '')) : null;
  if (!s) return null;
  const rec = await get(storyKey(s.id));
  if (!rec) return null;
  s.plays = (s.plays || 0) + 1; await set('rad:share:' + token, s);
  return publicStory(rec);
}

/* ── Площадь ── */
export async function submit(rec, author){
  rec.square = { status: 'pending', author: String(author || '').trim().slice(0, 40), verified: false, swallows: (rec.square && rec.square.swallows) || 0, at: Date.now() };
  await set(storyKey(rec.id), rec);
  await listPut(PENDING, [rec.id, ...(await listGet(PENDING))]);
}
export async function publish(rec, { verified, author } = {}){
  rec.square = { ...(rec.square || {}), status: 'live', liveAt: Date.now(), verified: !!(verified || (rec.square && rec.square.verified)),
    author: String(author || (rec.square && rec.square.author) || '').slice(0, 40), swallows: (rec.square && rec.square.swallows) || 0 };
  await set(storyKey(rec.id), rec);
  await listPut(PENDING, (await listGet(PENDING)).filter(x => x !== rec.id));
  await listPut(LIVE, [rec.id, ...(await listGet(LIVE)).filter(x => x !== rec.id)]);
}
export async function reject(rec){
  if (rec.square) rec.square.status = 'rejected';
  await set(storyKey(rec.id), rec);
  await listPut(PENDING, (await listGet(PENDING)).filter(x => x !== rec.id));
}
export async function withdraw(rec){
  rec.square = null; await set(storyKey(rec.id), rec);
  await listPut(PENDING, (await listGet(PENDING)).filter(x => x !== rec.id));
  await listPut(LIVE, (await listGet(LIVE)).filter(x => x !== rec.id));
}
export async function swallow(rec, who){
  const k = `rad:sq:vote:${rec.id}:${who}`, had = !!(await get(k));
  await set(k, had ? null : Date.now());
  rec.square.swallows = Math.max(0, (rec.square.swallows || 0) + (had ? -1 : 1));
  await set(storyKey(rec.id), rec);
  return { mine: !had, swallows: rec.square.swallows };
}
/** Разделы Площади: голоса Favola, сказка недели, новые. */
export async function squareSections(who, lang){
  const okLang = l => !lang || (l || 'ru') === lang || l === 'en';   // свой язык + английский
  const ids = (await listGet(LIVE)).slice(0, 300);
  const cards = [];
  for (const id of ids){ const rec = await get(storyKey(id)); if (rec && rec.square && rec.square.status === 'live' && okLang(rec.lang)) cards.push({ ...(await cardOf(rec, who)), lang: rec.lang || 'ru' }); }
  const week = cards.filter(c => Date.now() - c.at < 7 * 24 * 3600 * 1000);
  const top = (week.length ? week : cards).slice().sort((a, b) => b.swallows - a.swallows)[0] || null;
  return { stars: cards.filter(c => c.verified), week: top && top.swallows > 0 ? top : null, fresh: cards.filter(c => !c.verified).slice(0, 60), total: cards.length };
}
export async function pendingList(){
  const out = [];
  for (const id of await listGet(PENDING)){ const rec = await get(storyKey(id)); if (rec && rec.square && rec.square.status === 'pending') out.push({ ...(await publicStory(rec)), at: rec.square.at }); }
  return out;
}

/* ── загрузка за автора: сборка сказки на сервере теми же шагами, что в телефоне ── */
export function newImport({ device, audioUrl, title, author, lang, studio, publishNow }){
  const id = 'imp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return { id, device, audioUrl, title: String(title || '').slice(0, 80), author: String(author || '').slice(0, 40), lang: normLang(lang),
    studio: !!studio, publishNow: !!publishNow, created: Date.now(), updated: Date.now(),
    steps: { clean: 'wait', transcribe: 'wait', text: 'wait', scenes: 'wait', art: 'wait', save: 'wait' }, artDone: 0, artTotal: 0, storyId: null, error: '' };
}
function fakeRes(){ return { _s: 200, _b: null, status(c){ this._s = c; return this; }, json(o){ this._b = o; return this; }, end(){ return this; }, setHeader(){ return this; } }; }
async function callRoute(route, name, body){
  const res = fakeRes();
  await route(name, { method: 'POST', query: {}, headers: {}, body }, res);
  if (res._s >= 400 || !res._b || res._b.error) throw new Error(name + ': ' + ((res._b && (res._b.error || res._b.why)) || res._s));
  return res._b;
}
export async function runImport(id){
  const key = 'rad:import:' + id;
  let job = await get(key); if (!job) return null;
  const save = async () => { job.updated = Date.now(); await set(key, job); };
  const step = async (name, fn) => { if (job.steps[name] === 'done') return; job.steps[name] = 'work'; await save(); await fn(); job.steps[name] = 'done'; await save(); };
  try {
    const { recordRoute } = await import('./record.js');
    const { issueTicket } = await import('./ticket.js');
    const ticket = job.ticket || (job.ticket = await issueTicket(job.device, 'import'));
    const base = { device: job.device, ticket };
    await step('clean', async () => { const r = await callRoute(recordRoute, 'clean', { ...base, url: job.audioUrl, studio: job.studio }); job.voice = r.url; });
    await step('transcribe', async () => {
      const r = await callRoute(recordRoute, 'transcribe', String(job.voice).startsWith('data:') ? { ...base, audio: job.voice } : { ...base, url: job.voice });
      if (!r.sentences || !r.sentences.length) throw new Error('в записи не расслышали ни слова');
      job.tr = { sentences: r.sentences, words: r.words || [], pauses: r.pauses || [], language: r.language };
    });
    await step('text', async () => { job.pol = await callRoute(recordRoute, 'polish', { ...base, sentences: job.tr.sentences.map(x => x.text), lang: job.lang }); });
    await step('scenes', async () => { job.sc = await callRoute(recordRoute, 'scenes', { ...base, sentences: job.tr.sentences, lang: job.lang }); });
    await step('art', async () => {
      const A = await import('./art.js');
      const aj = A.newJob({ device: job.device, style: null, cast: job.sc.castText || '', world: job.sc.world || '', scenes: job.sc.scenes });
      await set(A.jobKey(aj.id), aj); job.artJob = aj.id; job.artTotal = aj.items.length; await save();
      const done = await A.processJob(aj.id);
      job.art = done.items.map(it => it.state === 'done' ? it.url : null); job.artDone = job.art.filter(Boolean).length;
    });
    await step('save', async () => {
      const u = await loadUser(job.device);
      const sents = (job.pol && job.pol.sentences) || job.tr.sentences.map(x => x.text);
      const panels = job.sc.scenes.map(sc => sents.slice(sc.from, sc.to + 1).filter(Boolean).join(' ') || sc.text);
      const sid = 'rd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const rec = { id: sid, device: job.device, google: u.google || null, email: u.email || null, at: Date.now(), done: true, kind: 'record',
        title: job.title || job.sc.title || '', lang: job.lang, panels, questions: job.sc.questions || [],
        meta: { audioTimeline: job.sc.scenes.map(x => ({ start: x.start, end: x.end })), audioWords: job.sc.scenes.map(sc => job.tr.words.filter(w => w.s >= sc.start && w.s < sc.end)), audioPauses: job.tr.pauses },
        art: (job.art || []).map(u2 => u2 && !String(u2).startsWith('data:') ? canonicalUrl(u2) : (u2 || null)),
        audio: { voice: canonicalUrl(job.voice), ...(blobUrl(job.audioUrl) ? { original: canonicalUrl(job.audioUrl) } : {}) },
        seed: 'imp-' + sid, tile: null, emblem: null, importedBy: 'owner', author: job.author };
      await set(storyKey(sid), rec);
      u.radio_made = [...(u.radio_made || []), sid].slice(-200); await saveUser(u);
      if (job.artJob) { const A = await import('./art.js'); const aj = await get(A.jobKey(job.artJob)); if (aj) { aj.storyId = sid; await set(A.jobKey(aj.id), aj); } }
      job.storyId = sid;
      if (job.publishNow) await publish(rec, { verified: true, author: job.author });
      else { rec.square = { status: 'draft', author: job.author, verified: true, swallows: 0, at: Date.now() }; await set(storyKey(sid), rec); }
    });
    job.status = 'done'; await save();
  } catch (e) {
    job.error = String(e.message || e).slice(0, 300); job.status = 'error';
    for (const k of Object.keys(job.steps)) if (job.steps[k] === 'work') job.steps[k] = 'error';
    await save();
  }
  return job;
}
