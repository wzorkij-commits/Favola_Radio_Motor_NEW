// Опция «Прочитать сказку»: готовые бесплатные тексты без прав, с телесуфлёром.
//
//   GET  /api/library?lang=ru                       — список сказок
//   GET  /api/library?id=ru-repka                    — сказка целиком: текст,
//        план картинок (переведён и придуман один раз, дальше из кэша),
//        и уже нарисованные картинки, если есть
//   POST /api/library {act:'illustrate', id, scene}  — нарисовать одну картинку
//        сцены и сохранить навсегда (кадр рисуется один раз на всех читателей)
//
// Библиотека общая на всех: очистки счётчика сказок это не касается —
// готовые тексты бесплатны и не кончаются, как и в основном приложении Favola.
import { cors, generateText, generateImage, jsonFrom } from '../lib/providers.js';
import { LIBRARY_SCENES_SYSTEM, buildLibraryScenesPrompt, buildCastSheetPrompt, buildSceneImagePrompt } from '../lib/prompts.js';
import { get, set } from '../lib/store.js';
import { putFile, BLOB_READY, viewUrl } from '../lib/blob.js';
import { libraryList, libraryOne } from '../data/library.js';
import { f10Parse } from '../data/favola10.js';
import { langName } from '../lib/prompts.js';

// Сказка из «Favola 10» на нужном языке: английский — исходный текст, остальные языки
// переводятся один раз и запоминаются. Абзацев столько же — картинки общие для всех языков.
async function translated(base, lang) {
  if (lang === 'en') return base.text;
  const k = 'rad:f10t:' + lang + ':' + base.id;
  const cached = await get(k);
  if (cached && cached.text) return cached.text;
  const want = base.text.split(/\n\n+/).length;
  for (let t = 0; t < 2; t++) {
    try {
      const raw = await generateText({
        system: `You translate children's bedtime stories for reading aloud. Translate the story into ${langName(lang)}. Keep exactly the same paragraphs: ${want} paragraphs separated by one empty line, one paragraph for each original paragraph. Warm, natural, simple language for children aged 4 to 8, easy to read aloud. Keep the names, but use the traditional form if the target language has one (Solomon, Sheba, Bremen). Answer with the translated story only — no title, no notes.`,
        prompt: base.text, maxTokens: 4000, temperature: 0.3
      });
      const text = String(raw || '').replace(/\r/g, '').trim();
      if (text.split(/\n\s*\n+/).length === want) { await set(k, { text, at: Date.now() }); return text; }
    } catch (e) { /* попробуем ещё раз, потом — английский */ }
  }
  return base.text;
}
async function getStory(id) {
  const f = f10Parse(id);
  if (!f) return libraryOne(id);
  const text = await translated(f.base, f.lang);
  return { id, lang: text === f.base.text && f.lang !== 'en' ? 'en' : f.lang, title: f.base.titles[f.lang] || f.base.titles.en,
    source: f.base.source, estMinutes: f.base.estMinutes, text, planId: f.base.id,
    planStory: { id: f.base.id, lang: 'en', title: f.base.titles.en, text: f.base.text } };
}
// план картинок строится по английскому тексту и общий для всех языков; подписи — на языке читателя
async function planFor(story) {
  const plan = await ensurePlan(story.planStory || story);
  if (!story.planStory) return plan;
  const paras = story.text.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
  return { ...plan, scenes: plan.scenes.map((sc, i) => ({ ...sc, text: paras[i] || sc.text })) };
}

// «lib2»: с 27 сентября 2026 библиотека рисуется португальской книжкой (DEFAULT_STYLE);
// новый ключ — чтобы все обложки и картинки нарисовались заново, старые не мешали.
const planKey = id => 'rad:lib2:' + id;

async function ensurePlan(story) {
  const cached = await get(planKey(story.id));
  if (cached) return cached;

  const paragraphs = story.text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  let plan;
  try {
    const raw = await generateText({
      system: LIBRARY_SCENES_SYSTEM,
      prompt: buildLibraryScenesPrompt(paragraphs, story.lang),
      maxTokens: 3000, temperature: 0.4
    });
    const j = jsonFrom(raw);
    if (Array.isArray(j.scenes) && j.scenes.length === paragraphs.length) {
      plan = {
        world: String(j.world || ''),
        cast: (Array.isArray(j.cast) ? j.cast : []).slice(0, 3)
          .map(c => ({ name: String(c.name || ''), look: String(c.look || '') }))
          .filter(c => c.name && c.look),
        scenes: paragraphs.map((p, i) => ({
          text: p,
          brief: String((j.scenes[i] && j.scenes[i].brief) || '').slice(0, 400) || `A picture-book illustration for this part of "${story.title}".`,
          shows: Array.isArray(j.scenes[i] && j.scenes[i].shows) ? j.scenes[i].shows.slice(0, 6) : [],
          image: null
        })),
        heroSheet: null
      };
    }
  } catch (e) { /* ниже — запасной план без AI */ }

  if (!plan) {
    plan = {
      world: '', cast: [], heroSheet: null,
      scenes: paragraphs.map(p => ({
        text: p,
        brief: `A picture-book illustration for this part of the story "${story.title}": ${p.slice(0, 200)}`,
        shows: [], image: null
      }))
    };
  }

  await set(planKey(story.id), plan);
  return plan;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { id, lang } = req.query || {};
      if (!id) {
        // Обложка — картинка первой сцены, если её уже когда-нибудь рисовали
        // (план кэшируется навсегда). Ничего заново не рисуем на списке —
        // это было бы слишком медленно; просто читаем, что уже есть.
        const list = libraryList(lang);
        const withCovers = await Promise.all(list.map(async s => {
          const cached = await get(planKey(s.planId || s.id));
          const cover = (cached && cached.scenes && cached.scenes[0] && cached.scenes[0].image) || null;
          return { ...s, cover: await viewUrl(cover) };
        }));
        return res.status(200).json({ stories: withCovers });
      }

      const story = await getStory(id);
      if (!story) return res.status(404).json({ error: 'сказка не найдена' });
      // Для телесуфлёра нужен только текст — отдаём сразу. План картинок (он просит
      // модель и занимает 10–30 секунд, если сказку ещё никто не открывал) здесь
      // не ждём: приложение попросит его отдельно, в фоне, пока человек читает.
      if (req.query && req.query.light) {
        return res.status(200).json({ id: story.id, lang: story.lang, title: story.title, source: story.source,
          estMinutes: story.estMinutes, text: story.text });
      }
      const plan = await planFor(story);
      return res.status(200).json({
        id: story.id, lang: story.lang, title: story.title, source: story.source,
        estMinutes: story.estMinutes, text: story.text,
        world: plan.world, cast: plan.cast, heroSheet: plan.heroSheet,
        scenes: await Promise.all(plan.scenes.map(async s => ({ text: s.text, image: await viewUrl(s.image) })))
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const { act, id, scene } = req.body || {};
    if (act !== 'illustrate') return res.status(400).json({ error: 'неизвестное действие' });

    const story = await getStory(id);
    if (!story) return res.status(404).json({ error: 'сказка не найдена' });
    const pid = story.planId || story.id;
    const plan = await ensurePlan(story.planStory || story);
    const n = Number(scene);
    if (!Number.isInteger(n) || n < 0 || n >= plan.scenes.length) return res.status(400).json({ error: 'нет такой сцены' });

    if (plan.scenes[n].image) return res.status(200).json({ image: await viewUrl(plan.scenes[n].image), cached: true });

    // Лист героя рисуем один раз на всю сказку, если есть постоянные персонажи.
    if (!plan.heroSheet && plan.cast.length) {
      try {
        plan.heroSheet = await generateImage(buildCastSheetPrompt(plan.cast.map(c => `${c.name}: ${c.look}`).join('; ')));
      } catch (e) { /* без референса тоже можно рисовать, просто герой может немного плыть */ }
    }

    const castText = plan.cast.map(c => `${c.name}: ${c.look}`).join(' | ');
    const prompt = buildSceneImagePrompt(plan.scenes[n].brief, castText, !!plan.heroSheet, { world: plan.world, shows: plan.scenes[n].shows });
    const dataUrl = await generateImage(prompt, plan.heroSheet ? [plan.heroSheet] : []);

    let finalUrl = dataUrl;
    if (BLOB_READY()) {
      try {
        const m = /^data:([^;]+);base64,/.exec(dataUrl);
        const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
        finalUrl = await putFile(`library/${pid}/scene-${n}.jpg`, buf, (m && m[1]) || 'image/jpeg');
      } catch (e) { /* не сохранилось в хранилище — вернём как есть, просто не кэшируется */ }
    }

    plan.scenes[n].image = finalUrl;
    await set(planKey(pid), plan);
    return res.status(200).json({ image: await viewUrl(finalUrl), cached: false });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
