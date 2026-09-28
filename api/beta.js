// Закрытая бета.
//   POST /api/beta {act:'join', email, who, country, lang}   — оставить почту (открыто всем)
//   GET  /api/beta?act=list&device=…                         — заявки (только владелец)
//   POST /api/beta {act:'invite', device, emails:[…]}          — пригласить (только владелец)
//   POST /api/beta {act:'invite-next', device, n}              — пригласить следующих n по очереди
import { cors } from '../lib/providers.js';
import { get, loadUser } from '../lib/store.js';
import { isOwner } from '../lib/owner.js';
import { join, invite, listAll, BETA_OPEN } from '../lib/beta.js';

async function owner(device){ if (!device) return false; const u = await loadUser(device); return isOwner(u.email); }

export default async function handler(req, res){
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const q = req.query || {}, b = req.body || {};
    if (req.method === 'GET'){
      if (q.act !== 'list') return res.status(200).json({ beta: !BETA_OPEN() });
      const me = q.device ? (await loadUser(q.device)).email || null : null;
      if (!(await owner(q.device))) return res.status(403).json({ error: 'только для владельца', me });
      const donations = (await get('rad:donate:list')) || [];
      return res.status(200).json({ ...(await listAll()), me, donations, donatedTotal: Math.round(donations.reduce((s, d) => s + (Number(d.amount) || 0), 0) * 100) / 100 });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET или POST' });
    if (b.act === 'join') return res.status(200).json(await join(b));
    if (b.act === 'invite' || b.act === 'invite-next'){
      if (!(await owner(b.device))) return res.status(403).json({ error: 'только для владельца' });
      let emails = Array.isArray(b.emails) ? b.emails : [];
      if (b.act === 'invite-next'){ const all = await listAll(); emails = all.rows.filter(r => r.status === 'waiting').slice(0, Math.min(50, Number(b.n) || 10)).map(r => r.email); }
      const done = [], failed = [];
      for (const m of emails){ try { await invite(m); done.push(m); } catch (e) { failed.push({ email: m, why: String(e.message || e).slice(0, 160) }); } }
      return res.status(200).json({ invited: done, failed });
    }
    return res.status(400).json({ error: 'неизвестное действие' });
  } catch (e) { return res.status(500).json({ error: String(e.message || e) }); }
}
