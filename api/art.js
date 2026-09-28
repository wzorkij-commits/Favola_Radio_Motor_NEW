// POST /api/art {device, ticket, style, cast, world, scenes:[{brief, shows}]} -> {job}
//      рисование идёт на сервере в фоне; телефон может закрыть приложение
// GET  /api/art?job=ID                          -> {items:[{state,url}], done}
// POST /api/art {act:'attach', job, storyId, device} — готовые картинки сами встанут в сказку
// GET  /api/art?cron=1                          — расписание Vercel дорисовывает недорисованное
import { waitUntil } from '@vercel/functions';
import { cors } from '../lib/providers.js';
import { requireTicket } from '../lib/ticket.js';
import { get, set } from '../lib/store.js';
import { newJob, processJob, publicJob, cronPass, markPending, copyIntoStory, jobKey } from '../lib/art.js';

export default async function handler(req, res){
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = req.query || {};
  try {
    if (req.method === 'GET' && q.cron){
      const secret = process.env.CRON_SECRET;
      const auth = req.headers && (req.headers.authorization || '');
      const ua = req.headers && String(req.headers['user-agent'] || '');
      if (secret ? auth !== 'Bearer ' + secret : !/vercel-cron/i.test(ua)) return res.status(401).json({ error: 'только для расписания' });
      return res.status(200).json({ ok: true, pass: await cronPass(3) });
    }
    if (req.method === 'GET'){
      const job = q.job ? await get(jobKey(String(q.job))) : null;
      if (!job) return res.status(404).json({ error: 'задание не найдено' });
      return res.status(200).json(await publicJob(job));
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET или POST' });
    const b = req.body || {};
    if (b.act === 'attach'){
      const job = await get(jobKey(String(b.job || '')));
      if (!job || job.device !== b.device) return res.status(404).json({ error: 'задание не найдено' });
      job.storyId = String(b.storyId || '');
      await set(jobKey(job.id), job);
      await copyIntoStory(job);
      return res.status(200).json({ ok: true });
    }
    if (!(await requireTicket(req, res))) return;
    if (!Array.isArray(b.scenes) || !b.scenes.length) return res.status(400).json({ error: 'нет сцен' });
    const job = newJob({ device: b.device, style: b.style, cast: b.cast, world: b.world, scenes: b.scenes });
    await set(jobKey(job.id), job);
    await markPending(job.id, true);
    waitUntil(processJob(job.id).catch(() => {}));           // рисуем после ответа телефону
    return res.status(200).json({ job: job.id, items: job.items.length });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
