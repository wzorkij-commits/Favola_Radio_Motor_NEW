// Площадь сказок, ссылки «поделиться» и загрузка за автора.
//   GET  /api/square?act=status&device            — открыта ли Площадь, владелец ли это
//   GET  /api/square?device                        — разделы Площади (карточки)
//   GET  /api/square?id=…&device                   — сказка с Площади (для проигрывания)
//   POST /api/square {act:'swallow'|'submit'|'withdraw'|'report', device, id, …}
//   владелец: GET ?act=pending|imports; POST {act:'publish'|'reject'|'unpublish'|'import'|'import-ticket'}
//   GET  /api/share?s=ключ                         — сказка по ссылке, без входа
//   POST /api/share {act:'create'|'revoke', device, id}
import { waitUntil } from '@vercel/functions';
import { cors } from '../lib/providers.js';
import { get, set, loadUser } from '../lib/store.js';
import { asked } from '../lib/route.js';
import { issueTicket } from '../lib/ticket.js';
import * as Q from '../lib/square.js';

export default async function handler(req, res){
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = req.query || {}, b = req.body || {};
  try {
    // ── ссылка «поделиться» ──
    if (asked(req) === 'share'){
      if (req.method === 'GET'){
        const st = await Q.openShare(q.s);
        return st ? res.status(200).json(st) : res.status(404).json({ error: 'ссылка не действует' });
      }
      const u = await loadUser(b.device); const rec = await get(Q.storyKey(b.id));
      if (!Q.mine(rec, b.device, u)) return res.status(404).json({ error: 'не найдено' });
      if (b.act === 'revoke'){ await Q.revokeShare(rec); return res.status(200).json({ ok: true }); }
      return res.status(200).json(await Q.createShare(rec));
    }

    const device = req.method === 'GET' ? q.device : b.device;
    if (!device) return res.status(400).json({ error: 'нет ключа устройства' });
    const u = await loadUser(device);
    const owner = await Q.ownerOf(device);
    const open = Q.squareOpen() || !!owner;
    const who = Q.whoKey(u);

    if (req.method === 'GET'){
      if (q.act === 'status') return res.status(200).json({ open, owner: !!owner, public: Q.squareOpen() });
      if (q.act === 'pending'){ if (!owner) return res.status(403).json({ error: 'только для владельца' }); return res.status(200).json({ pending: await Q.pendingList(), reports: ((await get(Q.REPORTS)) || []).slice(-50).reverse() }); }
      if (q.act === 'imports'){
        if (!owner) return res.status(403).json({ error: 'только для владельца' });
        const ids = (await get('rad:import:list')) || [];
        const out = []; for (const id of ids.slice(-20).reverse()){ const j = await get('rad:import:' + id); if (j) out.push({ id: j.id, title: j.title, author: j.author, steps: j.steps, status: j.status || 'work', error: j.error, artDone: j.artDone, artTotal: j.artTotal, storyId: j.storyId, created: j.created }); }
        return res.status(200).json({ imports: out });
      }
      if (!open) return res.status(200).json({ open: false });
      if (q.id){
        const rec = await get(Q.storyKey(q.id));
        const live = rec && rec.square && rec.square.status === 'live';
        if (!live && !(owner && rec)) return res.status(404).json({ error: 'сказки нет на Площади' });
        return res.status(200).json({ ...(await Q.publicStory(rec)), mine: !!(await get(`rad:sq:vote:${rec.id}:${who}`)) });
      }
      return res.status(200).json({ open: true, owner: !!owner, ...(await Q.squareSections(who)) });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'GET или POST' });
    const rec = b.id ? await get(Q.storyKey(b.id)) : null;

    if (b.act === 'swallow'){
      if (!open) return res.status(403).json({ error: 'Площадь закрыта' });
      if (!u.email && !u.google && !owner) return res.status(403).json({ error: 'войдите, чтобы отправить ласточку' });
      if (!rec || !rec.square || rec.square.status !== 'live') return res.status(404).json({ error: 'сказки нет на Площади' });
      return res.status(200).json(await Q.swallow(rec, who));
    }
    if (b.act === 'report'){
      const list = (await get(Q.REPORTS)) || []; list.push({ id: b.id, why: String(b.why || '').slice(0, 300), who, at: Date.now() });
      await set(Q.REPORTS, list.slice(-500)); return res.status(200).json({ ok: true });
    }
    if (b.act === 'submit'){
      if (!open) return res.status(403).json({ error: 'Площадь пока закрыта' });
      if (!Q.mine(rec, device, u)) return res.status(404).json({ error: 'не найдено' });
      if (!b.noChild || !b.rules) return res.status(400).json({ error: 'нужно подтвердить оба пункта' });
      if (owner) { await Q.publish(rec, { author: b.author, verified: !!b.verified }); return res.status(200).json({ status: 'live' }); }
      await Q.submit(rec, b.author); return res.status(200).json({ status: 'pending' });
    }
    if (b.act === 'withdraw'){
      if (!(Q.mine(rec, device, u) || owner)) return res.status(404).json({ error: 'не найдено' });
      await Q.withdraw(rec); return res.status(200).json({ ok: true });
    }

    // ── только владелец ──
    if (!owner) return res.status(403).json({ error: 'только для владельца' });
    if (b.act === 'publish'){ if (!rec) return res.status(404).json({ error: 'не найдено' }); await Q.publish(rec, { verified: b.verified, author: b.author }); return res.status(200).json({ ok: true }); }
    if (b.act === 'reject'){ if (!rec) return res.status(404).json({ error: 'не найдено' }); await Q.reject(rec); return res.status(200).json({ ok: true }); }
    if (b.act === 'unpublish'){ if (!rec) return res.status(404).json({ error: 'не найдено' }); await Q.withdraw(rec); return res.status(200).json({ ok: true }); }
    if (b.act === 'import-ticket') return res.status(200).json({ ticket: await issueTicket(device, 'import') });
    if (b.act === 'import'){
      if (!b.audioUrl) return res.status(400).json({ error: 'нет записи' });
      const job = Q.newImport({ device, audioUrl: b.audioUrl, title: b.title, author: b.author, lang: b.lang, studio: b.studio, publishNow: b.publish });
      await set('rad:import:' + job.id, job);
      const list = (await get('rad:import:list')) || []; list.push(job.id); await set('rad:import:list', list.slice(-200));
      waitUntil(Q.runImport(job.id).catch(() => {}));
      return res.status(200).json({ id: job.id });
    }
    if (b.act === 'import-retry'){
      const j = await get('rad:import:' + b.importId); if (!j) return res.status(404).json({ error: 'нет задания' });
      j.status = 'work'; j.error = ''; for (const k of Object.keys(j.steps)) if (j.steps[k] === 'error') j.steps[k] = 'wait';
      await set('rad:import:' + j.id, j); waitUntil(Q.runImport(j.id).catch(() => {})); return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: 'неизвестное действие' });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
