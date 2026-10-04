// Свои сказки Radio: сохранение, список, чтение, удаление. Отдельные ключи
// от сказок Favola (rad:story: вместо fav:story:), но один и тот же аккаунт.
//
//   POST /api/stories {device, act:"start", story}          — завести сказку
//   POST /api/stories {device, act:"asset", id, name, data} — положить файл
//   POST /api/stories {device, act:"done", id}               — закрыть
//   POST /api/stories {device, act:"delete", id}             — удалить
//   GET  /api/stories?device=...                             — список описей
//   GET  /api/stories?device=...&id=...                      — сказка целиком
import { cors } from '../lib/providers.js';
import { get, set, loadUser, saveUser } from '../lib/store.js';
import { putFile, deleteFiles, fromDataUrl, BLOB_READY, viewUrl, canonicalUrl } from '../lib/blob.js';
import { isBlobUrl } from '../lib/record.js';

const key = id => 'rad:story:' + id;
const MAX_PER_USER = 200;

// Сказка «своя», если её записали с этого устройства, под этой почтой/Google-входом
// или если она просто лежит в списке сказок этого человека. Последнее важно: при
// переезде на новый адрес (favola.space) у телефона новый ключ устройства, а сказки,
// записанные до входа по почте, помнят только старый ключ — полка их показывала,
// а открыть не давала («не найдено»).
const mine = (rec, device, u) =>
  rec && (rec.device === device || (u.google && rec.google === u.google) ||
          (u.email && rec.email === u.email) || (u.radio_made || []).includes(rec.id));

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const device = req.query && req.query.device;
      const id = req.query && req.query.id;
      if (!device) return res.status(400).json({ error: 'нет ключа устройства' });
      const u = await loadUser(device);

      if (id) {
        const rec = await get(key(id));
        if (!mine(rec, device, u)) return res.status(404).json({ error: 'не найдено' });
        // Файлы из закрытого хранилища телефон получает по временным подписанным
        // ссылкам; в описи остаются постоянные адреса.
        const out = { ...rec, art: await Promise.all((rec.art || []).map(viewUrl)), audio: { ...(rec.audio || {}) } };
        if (out.audio.voice) out.audio.voice = await viewUrl(out.audio.voice);
        if (out.audio.full) out.audio.full = await viewUrl(out.audio.full);
        delete out.audio.original;       // исходник — архив, телефону для проигрывания не нужен
        return res.status(200).json(out);
      }

      const list = [];
      for (const sid of (u.radio_made || []).slice(-MAX_PER_USER).reverse()) {
        const rec = await get(key(sid));
        if (!rec) continue;
        list.push({ id: rec.id, title: rec.title, kind: rec.kind, lang: rec.lang, seed: rec.seed || null, tile: rec.tile || null, emblem: rec.emblem || null,
                    at: rec.at, cover: await viewUrl((rec.art || [])[0] || null), done: !!rec.done });
      }
      return res.status(200).json({ stories: list, файловое_хранилище: BLOB_READY() });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { device, act, id, name, data, story } = req.body || {};
    if (!device) return res.status(400).json({ error: 'нет ключа устройства' });
    const u = await loadUser(device);

    if (act === 'start') {
      if (!story || !Array.isArray(story.panels)) return res.status(400).json({ error: 'нет сказки' });
      const sid = 'rd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const rec = {
        id: sid, device, google: u.google || null, email: u.email || null,
        at: Date.now(), done: false,
        // kind: 'record' | 'library' | 'wizard' — откуда взялась сказка, для полки
        kind: story.kind || 'wizard',
        title: story.title || '', lang: story.lang || 'ru',
        panels: story.panels, questions: story.questions || [],
        child: !!story.child,              // в сказке настоящее имя ребёнка — только для семьи, не для Площади
        // audio.url — уже готовая ссылка на файл (чистка звука сама кладёт его в хранилище
        // при записи); timeline — на какой секунде начинается/кончается каждая страница;
        // words — слова с таймингом внутри каждой страницы (постепенное появление текста
        // в такт голосу); pauses — долгие паузы внутри записи (тихо промотать при прослушивании).
        meta: story.meta || (story.audio && story.audio.timeline ? {
          audioTimeline: story.audio.timeline,
          audioWords: story.audio.words || [],
          audioPauses: story.audio.pauses || []
        } : null),
        // audio.url кладём в опись, только если это уже настоящая ссылка на файл.
        // Строку data:... (запись, которую не успели положить в хранилище) сюда
        // не пишем — она весит мегабайты и не должна лежать в описи целиком;
        // такую запись клиент отдельно проведёт через act:"asset".
        art: [], audio: (story.audio && story.audio.url && !String(story.audio.url).startsWith('data:'))
          ? { voice: canonicalUrl(story.audio.url) } : {}
      };
      // Исходная запись, как её снял телефон, до очистки от шума. Её не проигрываем,
      // но храним навсегда: это настоящий голос, если очистка его хоть чуть испортила.
      // Берём только ссылку из нашего же хранилища.
      // Плитка на стене: семя узора и громкость голоса по ячейкам (0..1), как рисовалось при записи.
      rec.emblem = /^[a-z]{2,20}$/.test(String(story.emblem || '')) ? story.emblem : null;
      rec.seed = String(story.seed || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || null;
      rec.tile = Array.isArray(story.tile) ? story.tile.slice(0, 16).map(n => Math.round(Math.max(0, Math.min(1, Number(n) || 0)) * 100) / 100) : null;
      if (story.audio && isBlobUrl(story.audio.original)) rec.audio.original = canonicalUrl(story.audio.original);
      // Картинки, у которых уже есть постоянная ссылка (готовая библиотека кэширует
      // свои иллюстрации в хранилище), кладём сразу. Раньше их пытались отправить
      // через act:"asset" как файл, сервер отвечал ошибкой, и сохранение сказки
      // из библиотеки при работающем хранилище срывалось.
      if (Array.isArray(story.art)) story.art.forEach((u, i) => { if (isBlobUrl(u)) rec.art[i] = canonicalUrl(u); });
      if (story.audio && story.audio.cleaned === false && rec.meta) rec.meta.notCleaned = true;
      await set(key(sid), rec);
      u.radio_made = [...(u.radio_made || []), sid].slice(-MAX_PER_USER);
      await saveUser(u);
      return res.status(200).json({ id: sid, файловое_хранилище: BLOB_READY() });
    }

    if (act === 'asset') {
      const rec = await get(key(id));
      if (!mine(rec, device, u)) return res.status(404).json({ error: 'не найдено' });
      // Раньше это молча отвечало "ok", а картинка или голос никуда не сохранялись —
      // человек видел «Сохранено» и терял запись. Теперь — явная ошибка, чтобы
      // приложение не врало, что всё получилось.
      if (!BLOB_READY()) return res.status(200).json({ error: 'файловое хранилище (Blob) не подключено на сервере', outcome: 'no-storage' });
      let file;
      try { file = fromDataUrl(data); }
      catch (e) { return res.status(400).json({ error: String(e.message) }); }

      const url = await putFile(`radio-stories/${id}/${name}.${file.ext}`, file.buffer, file.type);
      if (/^panel-\d+$/.test(name) && file.type.startsWith('image/')) {
        const n = parseInt(name.split('-')[1], 10) - 1;
        rec.art[n] = url;
      } else {
        rec.audio[name] = url;
      }
      await set(key(id), rec);
      return res.status(200).json({ url });
    }

    if (act === 'done') {
      const rec = await get(key(id));
      if (!mine(rec, device, u)) return res.status(404).json({ error: 'не найдено' });
      rec.done = true;
      await set(key(id), rec);
      return res.status(200).json({ ok: true, id });
    }

    if (act === 'delete') {
      const rec = await get(key(id));
      if (!mine(rec, device, u)) return res.status(404).json({ error: 'не найдено' });
      await deleteFiles([...(rec.art || []).filter(Boolean), ...Object.values(rec.audio || {})]);
      await set(key(id), null);
      u.radio_made = (u.radio_made || []).filter(x => x !== id);
      await saveUser(u);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'неизвестное действие: ' + act });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
