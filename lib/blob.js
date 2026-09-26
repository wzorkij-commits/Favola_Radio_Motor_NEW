// Файлы сказок: картинки и дорожки. В базу они не помещаются и не должны:
// база для описи, файлы — в файловом хранилище.
//
// Пишем по одному файлу за запрос. У функций Vercel потолок тела запроса
// 4,5 МБ, а целая сказка весит около четырёх — впритык, и однажды не влезет.
// По одному кадру это триста килобайт, запас десятикратный.

let putFn = null, delFn = null, getFn = null;

async function sdk() {
  if (putFn) return { put: putFn, del: delFn, get: getFn };
  const m = await import('@vercel/blob');
  putFn = m.put; delFn = m.del; getFn = m.get;
  return { put: putFn, del: delFn, get: getFn };
}

/**
 * Прочитать файл из нашего хранилища. Сначала как обычную ссылку; если хранилище
 * не отдаёт файл без пропуска (403/401 — так бывает у закрытого хранилища или
 * у файлов, загруженных новым способом), читаем через библиотеку Vercel Blob
 * с пропуском проекта.
 * @returns {Promise<{buffer: Buffer, mime: string, via: string}>}
 */
export async function readFile(url) {
  let status = 0;
  try {
    const f = await fetch(url);
    status = f.status;
    if (f.ok) return { buffer: Buffer.from(await f.arrayBuffer()), mime: (f.headers.get('content-type') || '').split(';')[0], via: 'link' };
  } catch (e) { status = -1; }
  if (!BLOB_READY()) throw new Error('файл не скачался из хранилища: ' + status);
  const { get } = await sdk();
  let lastErr = '';
  for (const access of ['private', 'public']) {
    try {
      const r = await get(url, { access, useCache: false });
      if (r && r.statusCode === 200 && r.stream) {
        const buffer = Buffer.from(await new Response(r.stream).arrayBuffer());
        return { buffer, mime: (r.blob && r.blob.contentType) || '', via: 'sdk-' + access };
      }
      lastErr = r ? 'ответ ' + r.statusCode : 'файла нет';
    } catch (e) { lastErr = String(e.message || e); }
  }
  throw new Error('файл не скачался из хранилища: ' + status + ' (и с пропуском: ' + lastErr.slice(0, 160) + ')');
}

// Хранилище считается подключённым, если есть либо старый ключ BLOB_READ_WRITE_TOKEN,
// либо новый набор: BLOB_STORE_ID (Vercel сам выдаёт короткий пропуск на время работы функции).
// Пропуск на прямую загрузку из телефона выдаётся только по полному ключу хранилища.
export const blobToken = () => process.env.BLOB_READ_WRITE_TOKEN || null;

export const BLOB_READY = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

/**
 * @param {string} path  куда класть, например stories/<id>/panel-1.jpg
 * @param {Buffer} data
 * @returns {Promise<string>} постоянный адрес файла
 */
export async function putFile(path, data, contentType) {
  if (!BLOB_READY()) throw new Error('файловое хранилище не подключено: нет BLOB_READ_WRITE_TOKEN и нет BLOB_STORE_ID');
  const { put } = await sdk();
  // Хранилище у Radio закрытое (private): так на живой проверке 26 сентября ответил
  // сам Vercel Blob. Сначала пишем так, как хранилище настроено; если оно ответило,
  // что настроено иначе, запоминаем и пишем по-другому. Закрытые файлы телефон
  // получает по временным подписанным ссылкам (viewUrl ниже).
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const b = await put(path, data, { access: storeAccess(), addRandomSuffix: true, contentType });
      return b.url;
    } catch (e) {
      const msg = String(e && e.message || e);
      if (attempt === 0 && /private store|private access/i.test(msg) && storeAccess() !== 'private') { ACCESS = 'private'; continue; }
      if (attempt === 0 && /public store|public access/i.test(msg) && storeAccess() !== 'public') { ACCESS = 'public'; continue; }
      throw e;
    }
  }
}

// Какой доступ у хранилища. Можно задать явно переменной BLOB_ACCESS (private|public);
// иначе считаем открытым, пока хранилище не скажет обратное.
let ACCESS = null;
export const storeAccess = () => ACCESS || (process.env.BLOB_ACCESS === 'private' ? 'private' : process.env.BLOB_ACCESS === 'public' ? 'public' : 'public');
export function _setAccessForTests(a) { ACCESS = a; }

/** Ссылка из закрытого хранилища (такую телефон без подписи не откроет). */
export function isPrivateUrl(u) {
  try { return /\.private\.blob\.vercel-storage\.com$/.test(new URL(u).hostname); } catch (e) { return false; }
}

/** Постоянный адрес файла без временной подписи (в опись кладём только его). */
export function canonicalUrl(u) {
  try {
    const x = new URL(u);
    if (!/(^|\.)blob\.vercel-storage\.com$/.test(x.hostname)) return u;
    return x.origin + x.pathname;
  } catch (e) { return u; }
}

// Одно разрешение «читать всё хранилище» на время работы функции, дальше
// каждая ссылка подписывается на месте, без лишних запросов.
const VIEW_HOURS = 24;
let viewToken = null;
async function readToken() {
  if (viewToken && viewToken.validUntil - Date.now() > 60 * 60 * 1000) return viewToken;
  const m = await import('@vercel/blob');
  viewToken = await m.issueSignedToken({ pathname: '*', operations: ['get'], validUntil: Date.now() + VIEW_HOURS * 3600 * 1000 });
  return viewToken;
}

/**
 * Ссылка, которую можно отдать телефону. Открытые ссылки и data:-строки как есть;
 * файл из закрытого хранилища — временная подписанная ссылка (сутки).
 * Если подписать не вышло, отдаём как есть: пусть лучше не откроется одна
 * картинка, чем упадёт вся полка.
 */
export async function viewUrl(u) {
  if (!u || !isPrivateUrl(u)) return u;
  try {
    const m = await import('@vercel/blob');
    const t = await readToken();
    const x = new URL(canonicalUrl(u));
    const pathname = decodeURIComponent(x.pathname.slice(1));
    const r = await m.presignUrl(t, { operation: 'get', pathname, access: 'private', validUntil: t.validUntil });
    return r.presignedUrl;
  } catch (e) { return u; }
}

export async function deleteFiles(urls) {
  if (!BLOB_READY() || !urls || !urls.length) return;
  const { del } = await sdk();
  try { await del(urls); } catch (e) { /* уже удалено — не беда */ }
}

/** data:image/jpeg;base64,.... -> { buffer, type, ext } */
export function fromDataUrl(s) {
  const m = /^data:([^;,]+);base64,(.+)$/.exec(String(s || ''));
  if (!m) throw new Error('это не файл в виде строки');
  const type = m[1];
  const ext = type.includes('jpeg') ? 'jpg'
            : type.includes('png')  ? 'png'
            : type.includes('webp') ? 'webp'
            : type.includes('mpeg') ? 'mp3'
            : type.includes('mp4')  ? 'm4a' : 'bin';
  return { buffer: Buffer.from(m[2], 'base64'), type, ext };
}
