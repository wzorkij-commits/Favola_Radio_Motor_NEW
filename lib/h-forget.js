// Выгрузить всё своё и удалить всё своё — из Radio. Аккаунт (почта, оплаченное)
// общий с Favola и здесь не трогается целиком: удаляются только сказки Radio
// и связь этого устройства с почтой/Google. Полное удаление аккаунта делается
// из Favola (там та же учётная запись видна целиком).
//
//   GET  /api/forget?device=...            — отдать сказки Radio на этом аккаунте
//   POST /api/forget {device, confirm:true} — стереть сказки Radio и их файлы
//   POST /api/forget {device, confirm:true, account:true} — удалить аккаунт целиком:
//        сказки и файлы со всех устройств этой почты, сам аккаунт и связь с почтой
//        и Google (требование App Store и Google Play: удаление из приложения)
import { cors } from './providers.js';
import { get, set, loadUser, saveUser, publicView, userKey, emailKey, googleKey } from './store.js';
import { withdraw } from './square.js';
import { deleteFiles } from './blob.js';
import { FREE_STORIES, RECORD_FREE } from './plans.js';

const key = id => 'rad:story:' + id;

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const device = req.method === 'GET' ? (req.query && req.query.device)
                                        : (req.body && req.body.device);
    if (!device) return res.status(400).json({ error: 'нет ключа устройства' });
    const u = await loadUser(device);

    if (req.method === 'GET') {
      const stories = [];
      for (const sid of (u.radio_made || [])) {
        const rec = await get(key(sid));
        if (rec) stories.push(rec);
      }
      return res.status(200).json({
        учётная_запись: publicView(u, FREE_STORIES, RECORD_FREE),
        сказки_radio: stories,
        собрано: new Date().toISOString()
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    if (!(req.body && req.body.confirm === true)) {
      return res.status(400).json({ error: 'нужно подтверждение' });
    }

    let files = 0, tales = 0;
    const wipeStories = async (owner) => {
      for (const sid of (owner.radio_made || [])) {
        const rec = await get(key(sid));
        if (!rec) continue;
        if (rec.square) { try { await withdraw(rec); } catch (e) {} }
        const urls = [...(rec.art || []).filter(Boolean), ...Object.values(rec.audio || {})].filter(x => typeof x === 'string');
        files += urls.length;
        await deleteFiles(urls);
        await set(key(sid), null);
        tales++;
      }
      owner.radio_made = [];
    };

    if (req.body.account === true) {
      // все устройства, связанные с этой почтой и с этим Google
      const devices = new Set([u.id]);
      const idKeys = [];
      if (u.email) idKeys.push(emailKey(u.email));
      if (u.google) idKeys.push(googleKey(u.google));
      for (const k of idKeys) {
        const known = await get(k);
        for (const d of ((known && known.devices) || [])) devices.add(d);
      }
      for (const d of devices) {
        const o = d === u.id ? u : await get(userKey(d));
        if (!o) continue;
        await wipeStories(o);
        await set(userKey(d), null);
      }
      for (const k of idKeys) await set(k, null);
      return res.status(200).json({ ok: true, account: 'deleted', удалено_сказок: tales, удалено_файлов: files, устройств: devices.size });
    }

    await wipeStories(u);
    await saveUser(u);

    return res.status(200).json({ ok: true, удалено_сказок: tales, удалено_файлов: files });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
