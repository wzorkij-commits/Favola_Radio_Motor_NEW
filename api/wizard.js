// Опция «Придумать вместе»: восемь ответов ребёнка и взрослого → сказка с картинками.
//
//   POST /api/wizard {answers:[8 строк], lang}
//     -> {title, panels:[...], cast, world, scenes:[{brief,shows}], questions}
//
// Два шага (см. lib/prompts.js, WIZARD_TALE_SYSTEM):
//   1. писатель — сказка обычной прозой (название + 5–6 абзацев), без форматов;
//   2. художник — к готовым абзацам план картинок, герои, мир, вопросы (JSON).
// Текст сказки после первого шага больше не меняется: абзацы и есть страницы книжки.
import { cors, generateTextEx, jsonFrom } from '../lib/providers.js';
import { WIZARD_TALE_SYSTEM, WIZARD_PLAN_SYSTEM, buildWizardPrompt, buildWizardPlanPrompt } from '../lib/prompts.js';
import { requireTicket } from '../lib/ticket.js';

const clip = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);
export const MIN_TOTAL = 900, MIN_PARAS = 4;

/** Первая строка — название, дальше абзацы через пустую строку. */
export function parseTale(raw){
  const text = String(raw || '').replace(/\r/g, '').replace(/```[a-z]*\n?|```/gi, '').trim();
  const blocks = text.split(/\n\s*\n+/).map(b => b.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  if (!blocks.length) return { title: '', paragraphs: [] };
  let title = blocks[0].replace(/^[#*«"\s]+|[*»"\s]+$/g, '').replace(/^(название|title)\s*[:—-]\s*/i, '');
  let paragraphs = blocks.slice(1);
  if (title.length > 80){ paragraphs = blocks; title = ''; }      // названия не было — всё текст
  return { title: clip(title, 60), paragraphs: paragraphs.map(p => clip(p, 1400)).filter(p => p.length > 1) };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!(await requireTicket(req, res))) return;

  try {
    const { answers, lang = 'ru' } = req.body || {};
    if (!Array.isArray(answers) || answers.length !== 8 || answers.some(a => !String(a || '').trim())) {
      return res.status(400).json({ error: 'нужны все восемь ответов' });
    }
    const clean = answers.map(a => clip(a, 300));
    const trace = [];

    // ── шаг 1: писатель ──
    let tale = null, why = '';
    for (let attempt = 1; attempt <= 3 && !tale; attempt++) {
      const tr = { step: 'tale', attempt }; trace.push(tr);
      try {
        const note = attempt > 1 ? (lang === 'en'
          ? '\n\nImportant: write the full story in five or six paragraphs of three to six sentences each, about 350 words.'
          : '\n\nВажно: напиши всю сказку целиком — пять-шесть абзацев по три-шесть предложений, около 350 слов.') : '';
        const t0 = Date.now();
        const r = await generateTextEx({ system: WIZARD_TALE_SYSTEM, prompt: buildWizardPrompt(clean, lang) + note, maxTokens: 3000, temperature: attempt === 1 ? 0.9 : 0.7 });
        const p = parseTale(r.text);
        const total = p.paragraphs.join(' ').length;
        Object.assign(tr, { ms: Date.now() - t0, stop: r.stop, outTokens: r.out, paragraphs: p.paragraphs.map(x => x.length), total });
        if (r.stop === 'max_tokens') { why = 'текст оборвался'; continue; }
        if (p.paragraphs.length >= MIN_PARAS && total >= MIN_TOTAL) tale = p;
        else { why = `короткий текст: ${p.paragraphs.length} абзацев, ${total} символов`; if (attempt === 3 && p.paragraphs.length >= 3) tale = p; }
      } catch (e) { why = String(e.message || e); tr.error = why.slice(0, 200); }
    }

    let out;
    if (tale) {
      const paragraphs = tale.paragraphs.slice(0, 7);
      const title = tale.title || clean[0];
      // ── шаг 2: художник (план картинок к готовому тексту) ──
      let plan = null;
      for (let attempt = 1; attempt <= 2 && !plan; attempt++) {
        const tr = { step: 'plan', attempt }; trace.push(tr);
        try {
          const t0 = Date.now();
          const r = await generateTextEx({ system: WIZARD_PLAN_SYSTEM, prompt: buildWizardPlanPrompt(title, paragraphs, lang), maxTokens: 3000, temperature: 0.4 });
          const j = jsonFrom(r.text);
          Object.assign(tr, { ms: Date.now() - t0, stop: r.stop, scenes: Array.isArray(j.scenes) ? j.scenes.length : 0 });
          if (Array.isArray(j.scenes) && j.scenes.length) plan = j;
        } catch (e) { tr.error = String(e.message || e).slice(0, 200); }
      }
      const scenes = paragraphs.map((p, i) => {
        const s = plan && plan.scenes && (plan.scenes[i] || plan.scenes[plan.scenes.length - 1]);
        return s && s.brief ? { brief: clip(s.brief, 400), shows: Array.isArray(s.shows) ? s.shows.slice(0, 6) : [] }
                            : { brief: 'A picture-book illustration of this moment: ' + clip(p, 300), shows: [] };
      });
      out = {
        title, panels: paragraphs, scenes,
        cast: (plan && Array.isArray(plan.cast) ? plan.cast : [{ name: clean[0], look: clean[1] }]).slice(0, 3)
          .map(c => ({ name: clip(c && c.name, 40), look: clip(c && c.look, 300) })).filter(c => c.name && c.look),
        world: clip(plan && plan.world || clean[5], 220),
        questions: (plan && Array.isArray(plan.questions) ? plan.questions : []).slice(0, 6).map(q => clip(q, 200)).filter(Boolean)
      };
      if (!out.questions.length) out.questions = lang === 'en'
        ? ['What do you think the hero felt?', 'What would you have done?', 'What happens next, do you think?', 'Which part would you draw?', 'Who would you want as a friend in this story?']
        : ['Что, как ты думаешь, чувствовал герой?', 'А что бы сделал ты?', 'Как думаешь, что было дальше?', 'Какую часть ты бы нарисовал?', 'С кем из этой истории ты хотел бы дружить?'];
    } else {
      // Модель не ответила вовсе — складываем сказку из восьми ответов, чтобы человек не остался ни с чем.
      const Q = lang === 'en'
        ? ['is called', 'is a', 'wants', 'is stopped by', 'is helped by', 'in', 'first tries', 'in the end']
        : ['зовут', 'это', 'хочет', 'мешает', 'помогает', 'происходит в', 'сначала пробует', 'в итоге'];
      out = {
        title: clean[0], panels: clean.map((a, i) => `${Q[i]}: ${a}`),
        cast: [{ name: clean[0], look: clean[1] }], world: clean[5],
        scenes: clean.map(a => ({ brief: `A picture-book illustration: ${a}`, shows: [] })),
        questions: lang === 'en' ? ['What do you think the hero felt?', 'What would you have done?', 'What happens next, do you think?']
                                 : ['Что, как ты думаешь, чувствовал герой?', 'А что бы сделал ты?', 'Как думаешь, что было дальше?'],
        source: 'fallback', why
      };
    }
    console.log('wizard-trace ' + JSON.stringify({ result: out.source === 'fallback' ? 'fallback' : 'ok', why, trace }));
    if (req.query && req.query.trace === '1') out._trace = trace;
    return res.status(200).json(out);
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
