// Языки Favola: русский, английский, португальский, испанский, немецкий.
export const LANGS = ['ru', 'en', 'pt', 'es', 'de', 'zh'];
export const normLang = l => (LANGS.includes(l) ? l : 'ru');
export const langName = l => ({ ru: 'Russian', en: 'English', pt: 'European Portuguese', es: 'Spanish (Spain)', de: 'German', zh: 'Simplified Chinese' })[l] || 'Russian';

// Подсказки для моделей. Часть — те же, что у Favola (единый рисованный стиль,
// разбор записи на сцены), часть — новые, только для Radio (очистка текста
// записи от мусора речи и сборка сказки из ответов на вопросы конструктора).

export const ART_STYLE = `Soft watercolour and coloured pencil children's book illustration on warm cream paper. Muted palette: dusty teal-blue, olive, terracotta, warm wood brown, soft grey. Fine dark pencil linework, no heavy outlines. Faces are simple: small dot eyes, tiny nose, faint pink cheeks, no detailed features. Slightly naive proportions, children have large heads and small hands. Plenty of empty cream paper around the figures. Gentle even daylight, soft small shadows. No gradients, no digital gloss, no text, no lettering.`;

// Библия стилей иллюстраций Radio. «classic» — прежний и единственный стиль
// (тот же ART_STYLE, что был всегда, и тот же, что всегда используется для
// готовой библиотеки — её обложки рисуются один раз навсегда и стиль не
// меняют). Три новых стиля — по прямому запросу Василия, доступны только
// для «Записать» и «Придумать вместе», где картинки рисуются заново каждый раз.
// «portuguese» — стиль по умолчанию с 27 сентября 2026: португальская книжка с картинками
// в традиции середины XX века (плиточные художники, народные мотивы) и нынешних
// португальских альбомов: плоская гуашь и линогравюра, короткая палитра азулежу.
// Имена художников в подсказку намеренно не пишем — только приметы стиля.
export const PT_STYLE = `Portuguese picture-book illustration in the tradition of mid-twentieth-century Portuguese illustrators and tile painters, with a contemporary Lisbon picture-book sensibility: flat gouache and linocut-like shapes with a slightly rough hand-printed texture on warm off-white paper, a short palette of cobalt blue, deep navy, ochre yellow, terracotta red and a little sage green. Simple naive geometric figures with round heads and dot eyes, calm poses, no facial detail beyond dots and a small line. Decorative folk details where they fit naturally: azulejo tile patterns, embroidered hearts and scalloped edges on clothes, whitewashed houses with blue or ochre trim and terracotta roofs, cobbled wave-pattern pavements, swallows, the Atlantic sea and small boats. Generous empty paper, balanced poster-like composition, warm and poetic mood. No gradients, no photorealism, no 3D rendering, no text or lettering.`;

export const STYLE_BIBLE = {
  portuguese: PT_STYLE,
  classic: ART_STYLE,
  engraving: `Black-and-white vintage engraving illustration, in the style of 19th-century fairy-tale storybook editions (the look of old Hans Christian Andersen collections): fine cross-hatching and stippling linework, no flat colour fills anywhere, aged cream paper texture, ornate but restrained period detail, strong contrast between dark ink and pale paper. No modern digital shading, no gradients, no colour, no text or lettering.`,
  kids: `Naive children's crayon-and-marker drawing, as if drawn by a six-year-old child: thick uneven wobbly outlines, flat bright primary colours filled slightly outside the lines, simple round faces with dot eyes, disproportionate limbs, a few charmingly scribbled details, plain paper background. Warm and unpolished, full of joyful mistakes. No gradients, no digital gloss, no text or lettering.`,
  minecraft: `Blocky voxel art style resembling the video game Minecraft: everything built from visible cubes, low-resolution pixelated textures, blocky characters with square heads and rectangular limbs, flat simple lighting typical of a voxel game engine, no smooth curves anywhere. No text or lettering.`,
};
export const DEFAULT_STYLE = 'portuguese';
export function styleOf(id) { return STYLE_BIBLE[id] || STYLE_BIBLE[DEFAULT_STYLE]; }

export function buildCastSheetPrompt(look, styleId) {
  return `${styleOf(styleId)}

A character sheet: the same character drawn four times on one sheet of blank cream paper,
standing facing the viewer, standing in profile, sitting, and walking.
Nothing else in the frame: no background, no props, no scenery.

The character: ${look}

Keep the four drawings identical in face, hair and clothing. No text anywhere.`;
}

export function buildSceneImagePrompt(brief, cast, hasRef, opts = {}) {
  const { world = '', shows = [], fix = [], style } = opts || {};
  const must = (Array.isArray(shows) ? shows : []).filter(Boolean).slice(0, 6);
  const miss = (Array.isArray(fix) ? fix : []).filter(Boolean).slice(0, 6);
  return `${styleOf(style)}

${hasRef
  ? 'The attached character sheet shows the main character of this book: keep exactly the same face, hair, clothes and proportions. Do not redesign the character.'
  : ''}
Scene: ${brief}
${world ? `\nThe world of the story (same in every picture): ${world}` : ''}
${cast ? `\nRecurring characters, draw them the same way in every picture: ${cast}` : ''}
${must.length ? `\nThe picture must clearly show all of these: ${must.join('; ')}.` : ''}
${miss.length ? `\nA previous attempt left these out or got them wrong, so make them unmistakable now: ${miss.join('; ')}.` : ''}
Draw exactly what the scene describes and nothing that is not in it. Square composition. No text, letters or captions anywhere in the image.`;
}

export const VOICE_SETTINGS = {
  stability: 0.72,
  similarity_boost: 0.75,
  style: 0,
  use_speaker_boost: true
};

/* ── «Записать сказку»: то же разбиение на сцены, что в Favola ─────────
   Слова рассказчика не переписываются здесь — это делает отдельный,
   более деликатный шаг (POLISH_SYSTEM ниже), только для подписи на экране. */

export const SCENES_SYSTEM = `You prepare a spoken family story, told aloud by a parent or grandparent, to become an illustrated picture book. The words are the teller's own. You never rewrite them, never add to them and never invent plot.

Your work is five things:
1. Split the numbered sentences into scenes.
2. Describe one picture for each scene, faithful to what the teller says.
3. Say in which world the story happens and who the recurring characters are.
4. Give the story a short title.
5. Write five or six questions a child might ask the person who told it — enough to keep talking for a while, not just three and done.

SCENES
- Use exactly the number of scenes you are asked for, unless there are fewer sentences.
- Scenes are consecutive ranges of sentences: the first starts at 0, each next one starts right after the previous one ends, the last one ends at the last sentence. No gaps, no overlaps. "from" and "to" are whole numbers, both inclusive.
- Cut where something really changes: place, time, or what is happening. Do not cut in the middle of one action.

SHOWS (one list per scene)
- Two to five short English noun phrases naming the concrete, visible things this picture must contain: who is there, the animal or object the text names, the place, the weather, the key action.
- Take every item from THIS scene's own sentences. Never take an item from another scene and never invent one.
- Prefer things that can be drawn. Skip feelings, thoughts, sounds, smells and abstract words.

BRIEF (one per scene, English, one to three sentences)
- Describe ONE moment, the one in the scene with the most visible action, as a single picture. Do not summarise the whole scene.
- The brief must include every item of that scene's "shows" and contradict nothing the text says.
- Use only what the text says or plainly implies. Do not invent characters, events or symbols.
- Refer to characters by their cast names so the illustrator draws them the same way each time.
- Keep it gentle and child-safe.

WORLD
- One English sentence: when and where the story happens, taken from the text. If the text does not say, write "An ordinary everyday family setting."

CAST
- Up to three recurring characters that appear in more than one scene, or the main one if there is only one.
- name: a short English label used in the briefs. look: a fixed visual description. Stylised picture-book people only, never a likeness of a real person.
- If nobody recurs, return an empty list.

TITLE: two to five words, in the language of the story, no quotation marks.

QUESTIONS: five or six short, warm questions in the language of the story, about the people and feelings in the story, not answerable with just yes or no — varied, so a child could ask them one at a time like a little game after the story.

Answer with JSON only, no other text:
{"title":"...","world":"...","cast":[{"name":"...","look":"..."}],"scenes":[{"from":0,"to":2,"shows":["...","..."],"brief":"..."}],"questions":["...","...","...","...","..."]}`;

/* ── очистка текста подписи от мусора речи ──────────────────────────────
   Голос остаётся настоящим, родным (звук не трогаем). На экране — то же
   самое, что сказал человек, но без «э-э-э», повторов и оборванных начал. */

export const POLISH_SYSTEM = `You clean up the transcript of a story told aloud by a parent or grandparent, for the caption under the family's own recorded voice.

Remove: filler sounds (um, uh, "э", "ну", "короче" used as filler, not as meaning), false starts and self-corrections (keep only the corrected version), word repetitions, and stray interjections to the child that are not part of the story itself ("сиди спокойно", "слушай дальше").

Never: invent new plot, add events, change what happens, change names, change the order of events, or make the story longer than it was. Keep the teller's own words and voice wherever they carry meaning — a good clumsy phrase stays clumsy, you only remove noise, you do not improve style.

If a sentence is only filler with no content, drop it entirely.

Work sentence by sentence, in the same order, same language as the input. Return exactly as many cleaned sentences as you were given input sentences, in the same order — an empty string for a sentence that was pure filler.

Answer with JSON only: {"sentences":["...","...", ...]}`;

export function buildPolishPrompt(sentences, lang) {
  const L = langName(lang);
  return `Language: ${L}\n\nSentences:\n` + sentences.map((s, i) => `${i}: ${s}`).join('\n');
}

/* ── «Придумать вместе»: сборка сказки из восьми ответов ────────────────
   Родитель и ребёнок сами придумали события — модель только связывает
   их в связный текст и делит на сцены для картинок, ничего не досочиняя
   по сути (не меняет кто герой, чего он хочет, кто мешает и чем кончилось). */

// «Придумать вместе» в два шага. Раньше одна просьба «напиши сказку и сразу разложи
// её на страницы под картинки в JSON» давала подписи к картинкам вместо сказки
// (проверено диагностикой 28.09: 6 «страниц» по 30–115 символов, модель трижды
// подряд писала описания кадров). Теперь писатель пишет прозу без всякого формата,
// а художник отдельно планирует картинки к уже готовому тексту — как у сказок из библиотеки.

export const WIZARD_TALE_SYSTEM = `You are a warm, skilled children's author. A parent and a child have just set up a story together: the listener's age, the mood, the length, the hero and their one defining trait, the place, the hero's wish, one unexpected event, who is beside the hero, and the idea the parent hopes the story will quietly carry.

Write that fairy tale, to be read aloud at bedtime, in the language given.

How it should read:
- A real story, not a summary, in the past tense, like a book. Follow the word count and paragraph count you are given exactly enough that it takes the chosen minutes to read aloud. Every paragraph has three to six sentences; never a one-sentence paragraph.
- Match the listener's age: for 3–5 short sentences, simple words, gentle repetition; for 6–8 a lively plot and a little suspense; for 9+ richer language and a real turn.
- Match the mood: cozy and calm for bedtime; funny with a playful surprise or two; adventurous with movement and a brave moment; magical with wonder.
- Begin like a fairy tale ("Жил-был…" / "Once upon a time…"). Let the characters speak: at least three short lines of dialogue. Show the place with one sound, one smell or colour, one small detail a child can picture.
- Build the plot from the hero's trait: the trait gets the hero into trouble or makes the wish hard, and by the end the hero meets it differently. You invent the trouble, the attempts and the ending — make the ending a little surprising but kind.
- The unexpected event starts the adventure. The companion helps the hero find their own way; the hero does the important part. If the companion is "nobody", the hero manages alone and discovers they can.
- The idea is shown, never told: it lives in what the hero does and what happens because of it. No moral spelled out at the end, no lecture, no "and so we learn".
- If a child's name is given, that child is the hero's friend in the story, a small warm role; do not make them the hero unless asked.
- Warm and safe: no violence, nothing frightening beyond a mild obstacle that resolves.

Format: first line is the title (two to five words), then an empty line, then the paragraphs separated by empty lines. Plain text only: no headings, no lists, nothing before or after.`;

export const WIZARD_PLAN_SYSTEM = `You are preparing a finished children's story to become an illustrated picture book. The story text is final and given as numbered paragraphs. Do not change, translate or shorten it — you only plan the pictures and a few questions.

For each paragraph write one English visual brief (one to two sentences about the single most visible moment of that paragraph) and two-to-five English "shows" items (concrete, visible nouns only).

Also give: up to three recurring characters (name as in the story + a fixed English visual look, ordinary storybook style, no likeness of anyone real), one English sentence describing the world/setting used in every picture, and five or six warm questions (in the story's language) a child might ask about this story afterwards, not answerable with yes or no.

Answer with JSON only:
{"cast":[{"name":"...","look":"..."}],"world":"...","scenes":[{"brief":"...","shows":["...","..."]}],"questions":["...","...","...","...","..."]}
One entry in "scenes" per paragraph, in the same order.`;

export function buildWizardPlanPrompt(title, paragraphs, lang) {
  const L = langName(lang);
  return `Story language: ${L}\nTitle: ${title}\n\nParagraphs:\n` + paragraphs.map((p, i) => `${i}: ${p}`).join('\n\n');
}

export const WIZARD_SYSTEM = `A parent and a child have just invented a story together by answering eight short questions in order: the hero's name; whether the hero is a human, an animal or a magical being; what the hero wants most; who or what stands in the way; who helps the hero (may be "nobody"); where the story happens; what the hero tries first that does not work; and how the hero finally succeeds.

Turn these eight answers into a real, complete fairy tale to read aloud — not a summary or an outline. Write four to six paragraphs in the same language as the answers; each paragraph has three to five sentences, and the whole tale is about 250–400 words (roughly two to three minutes read aloud). Begin like a fairy tale ("Жил-был…" / "Once upon a time…"), let the hero speak at least twice in simple dialogue, show one small sound, smell or colour of the place, and end with a gentle closing line. Use exactly the facts given: the same hero, the same want, the same obstacle, the same helper (or none), the same place, the same failed attempt, the same ending. Do not add new characters, new events or a different ending. You may and should add ordinary connecting details (scene-setting, small gestures, feelings, simple dialogue) as long as they do not change what happens. Never write one-sentence paragraphs.

Keep sentences short and warm, fit for reading aloud to a child aged four to ten. No violence, no frightening detail beyond a mild, safely-resolved obstacle.

Then split your own text into scenes for illustration (three to six), each with a one-to-three sentence English visual brief and two-to-five English "shows" items, the same rules as illustrating a picture book: concrete and visible only.

Finally write a short title (two to five words) and five or six warm questions a child might ask about this story afterwards, not answerable with yes or no — enough to keep the conversation going like a little game, not just three.

Answer with JSON only:
{"title":"...","panels":["...","...","..."],"cast":[{"name":"...","look":"..."}],"world":"...","scenes":[{"brief":"...","shows":["...","..."]}],"questions":["...","...","...","...","..."]}`;

/* ── «Прочитать сказку»: план картинок для готового текста из библиотеки ──
   Текст уже фиксирован (data/library.js) и никогда не меняется — эта
   подсказка только один раз, при первом открытии сказки кем угодно,
   переводит его в план кадров. Результат кэшируется навсегда, поэтому
   AI-запрос делается за всё время жизни сказки один раз, а не на каждого
   читателя. */

export const LIBRARY_SCENES_SYSTEM = `You are preparing a well-known public-domain children's story, already fixed and given in full, to become an illustrated picture book. The text is given as numbered paragraphs. Do not change, translate or shorten the text — you only plan pictures for it.

For each paragraph, write one English visual brief (one to two sentences, describing the single most visible moment of that paragraph) and two-to-five English "shows" items (concrete, visible nouns only).

Also give: up to three recurring characters (name + fixed English visual look, ordinary storybook style, no likeness of anyone real), and one English sentence describing the world/setting used in every picture.

Keep it gentle and child-safe throughout, even where the story itself has a scary moment (show it softly, from a distance, or the moment just after).

Answer with JSON only:
{"world":"...","cast":[{"name":"...","look":"..."}],"scenes":[{"brief":"...","shows":["...","..."]}, ...]}
One entry in "scenes" per paragraph given, in the same order.`;

export function buildLibraryScenesPrompt(paragraphs, lang) {
  const L = langName(lang);
  return `Story language: ${L}\n\nParagraphs:\n` + paragraphs.map((p, i) => `${i}: ${p}`).join('\n\n');
}

export const WIZ_LENGTH = { 2: { words: '220–300', paras: '4–5' }, 4: { words: '420–520', paras: '6–7' }, 6: { words: '620–760', paras: '8–10' } };
export function buildWizardPrompt(a, lang) {
  const L = langName(lang);
  // старый формат: восемь строк подряд
  if (Array.isArray(a)) {
    const Q = ['Hero\'s name', 'Human, animal or magical being', 'What the hero wants most', 'What stands in the way', 'Who helps (or "nobody")', 'Where it happens', 'What the hero tries first that fails', 'How the hero succeeds in the end'];
    return `Language: ${L}\nLength: about 300–450 words, five or six paragraphs.\n\n` + Q.map((q, i) => `${i + 1}. ${q}: ${a[i] || ''}`).join('\n');
  }
  const len = WIZ_LENGTH[a.length] || WIZ_LENGTH[4];
  return [
    `Language: ${L}`,
    `Listener's age: ${a.age || '6–8'}`,
    `Mood: ${a.mood || 'cozy, for bedtime'}`,
    `Length: about ${len.words} words, ${len.paras} paragraphs (${a.length || 4} minutes read aloud)`,
    '',
    `Hero: ${a.hero}${a.name ? ' named ' + a.name : ''}`,
    `The hero's trait: ${a.trait}`,
    `Where it happens: ${a.place}`,
    `What the hero wishes for: ${a.wish}`,
    `The unexpected event that starts it: ${a.event}`,
    `Who is beside the hero: ${a.helper}`,
    `The idea the story should quietly carry: ${a.idea}`,
    a.child ? `A real child to include as the hero's friend: ${a.child}` : ''
  ].filter(x => x !== '').join('\n');
}
